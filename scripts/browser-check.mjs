import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5175';
const server = process.env.TEST_URL
  ? null
  : spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '5175',
        '--strictPort',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
    );
let browser;
const results = [],
  errors = [],
  external = [];
const widths = [320, 390, 768, 1440];
const questions = [
  [
    'Eish. Não era preciso seres querido.',
    'OK, DESCULPA LÁ.',
    'Pior. É o Daniel.',
    'Finalmente, alguma honestidade.',
  ],
  [
    'UMA ESTRELA CONFIRMADA.',
    'O chef está insuportável agora.',
    'O chef vai chorar na cozinha.',
    'Distraído com quem, BEN?',
  ],
  ['Não espalhes.', 'Acertaste.', 'A DGS já foi informada.', 'INFELIZMENTE???'],
  [
    'Pronto, era só isso.',
    'Não prometo nada.',
    'Olha o crítico Michelin.',
    'Tudo bem. O convite fica sem efeito.',
  ],
];

async function audit(page, view, width) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
  if (width !== 1440)
    assert.equal(
      await page.evaluate(
        () => document.getAnimations().filter((a) => a.playState === 'running').length,
      ),
      0,
      'Reduced motion',
    );
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    `Overflow ${view} ${width}`,
  );
  const violations = (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  ).violations;
  results.push({ view, width, violations });
  // Also detect content clipped by the page's decorative overflow boundary.
  const clipped = await page.locator('main button, main h1, .quiz-answer').evaluateAll((nodes) =>
    nodes
      .filter((n) => {
        const r = n.getBoundingClientRect();
        return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
      })
      .map((n) => n.textContent),
  );
  assert.deepEqual(clipped, [], `Clipped controls ${view} ${width}`);
  if (width === 390 || width === 1440)
    await page.screenshot({ path: `artifacts/${view}-${width}.png`, fullPage: true });
}
async function finishQuiz(page, refusal = false) {
  await page.getByRole('button', { name: /COMEÇAR ESTA PALHAÇADA/ }).click();
  for (let q = 0; q < 4; q++) {
    await page
      .getByRole('radio')
      .nth(q === 3 && refusal ? 3 : 1)
      .check();
    await page.getByRole('button', { name: /SEGUINTE|VER O VEREDITO|TERMINAR/ }).click();
  }
}

try {
  if (server)
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Preview startup timeout')), 20000);
      server.stdout.on('data', (chunk) => {
        if (chunk.toString().includes('Local:')) {
          clearTimeout(timer);
          resolve();
        }
      });
      server.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      server.on('exit', (code) => {
        if (code) {
          clearTimeout(timer);
          reject(new Error(`Preview exited: ${code}`));
        }
      });
    });
  await mkdir('artifacts', { recursive: true });
  browser = await chromium.launch(
    process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
  );
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      isMobile: width <= 390,
      hasTouch: width <= 390,
      reducedMotion: width === 1440 ? 'no-preference' : 'reduce',
    });
    await context.route('**/*', (route) => {
      if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
      external.push(route.request().url());
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await audit(page, 'entrada', width);
    assert.equal(
      await page.getByRole('button', { name: /SOM DESLIGADO/ }).getAttribute('aria-pressed'),
      'false',
    );
    // Keyboard entry and focus transition.
    await page.getByRole('button', { name: /COMEÇAR ESTA PALHAÇADA/ }).focus();
    await page.keyboard.press('Enter');
    for (let q = 0; q < 4; q++) {
      assert(
        await page.getByRole('heading', { level: 1 }).evaluate((n) => n === document.activeElement),
      );
      assert.equal(await page.getByRole('radio').count(), 4);
      if (width === 390) {
        for (let choice = 0; choice < 4; choice++) {
          await page.getByRole('radio').nth(choice).check();
          assert.equal(await page.locator('.quiz-reaction').textContent(), questions[q][choice]);
          if (await page.getByRole('button', { name: 'Fechar reação' }).count()) {
            assert(
              await page
                .locator('.meme-reaction img')
                .evaluate((img) => img.complete && img.naturalWidth > 0),
            );
            await audit(page, `meme-q${q + 1}-${choice}`, width);
            await page.getByRole('button', { name: 'Fechar reação' }).click();
          }
        }
      }
      // Native radio keyboard behavior: choose B, move to C, return to B.
      await page.getByRole('radio').nth(1).check();
      await page.getByRole('radio').nth(1).focus();
      await page.keyboard.press('ArrowRight');
      assert(await page.getByRole('radio').nth(2).isChecked());
      await page.keyboard.press('ArrowLeft');
      if (await page.getByRole('button', { name: 'Fechar reação' }).count())
        await page.keyboard.press('Escape');
      await audit(page, `pergunta-${q + 1}`, width);
      await page.getByRole('button', { name: /SEGUINTE|VER O VEREDITO/ }).click();
    }
    await audit(page, 'resultado', width);
    await page.getByRole('button', { name: /PRONTO, O QUE É QUE QUERES/ }).click();
    await audit(page, 'convite', width);
    await page.getByRole('button', { name: /SIM, VÁ. MARCA LÁ ISSO/ }).click();
    await audit(page, 'bilhete', width);
    if (width === 390) {
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: /Guardar bilhete/ }).click();
      await (await downloadEvent).saveAs('artifacts/bilhete.png');
      const bytes = await readFile('artifacts/bilhete.png');
      assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
      assert.equal(bytes.readUInt32BE(16), 1400);
      // Clipboard is an honest local action, independently verified through a browser permission.
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.getByRole('button', { name: /COPIAR MENSAGEM/ }).click();
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /jantar n.º 002/);
      await page.getByText(/EXTRAS ABSOLUTAMENTE/).click();
      await page.getByRole('button', { name: 'Ver verso do cartão de sócio' }).click();
      const cardDownload = page.waitForEvent('download');
      await page.getByRole('button', { name: /Guardar cartão/ }).click();
      await (await cardDownload).saveAs('artifacts/cartao.png');
      assert.equal((await readFile('artifacts/cartao.png')).subarray(1, 4).toString(), 'PNG');
      await audit(page, 'extras', width);
    }
    assert.equal(await page.evaluate(() => localStorage.length), 0);
    await page.reload();
    await finishQuiz(page, true);
    await page.getByRole('heading', { name: /TUDO BEM, BEN/ }).waitFor();
    await audit(page, 'recusa', width);
    assert.equal(await page.getByRole('button', { name: /MARCA LÁ/ }).count(), 0);
    await page.reload();
    await finishQuiz(page);
    await page.getByRole('button', { name: /PRONTO, O QUE É QUE QUERES/ }).click();
    await page.getByRole('button', { name: 'AGORA NÃO, OBRIGADO.' }).click();
    await page.getByRole('heading', { name: /TUDO BEM, BEN/ }).waitFor();
    await context.close();
    console.log(`Checked ${width}px: complete flow, keyboard, both refusals, accessibility.`);
  }
  await writeFile('artifacts/accessibility.json', JSON.stringify(results, null, 2));
  await writeFile(
    'artifacts/browser-summary.json',
    JSON.stringify(
      {
        widths,
        errors,
        external,
        audits: results.length,
        violations: results.flatMap((x) => x.violations).length,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(errors, [], 'Browser errors');
  assert.deepEqual(external, [], 'Unexpected external requests');
  assert.deepEqual(
    results.flatMap((x) =>
      x.violations.map((v) => ({
        view: x.view,
        width: x.width,
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ),
    [],
    'Accessibility violations',
  );
  console.log(
    `PASS: ${results.length} accessibility audits; 16 answers; 4 widths; PNG ticket and card; zero external requests.`,
  );
} finally {
  await browser?.close();
  server?.kill();
}
