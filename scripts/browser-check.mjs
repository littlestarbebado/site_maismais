import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5173';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch(
  process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
);
const errors = [];
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === new URL(url).origin
      ? route.continue()
      : route.abort(),
  );
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
  const initialAxe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  results.push({ view: 'initial', violations: initialAxe.violations });
  await page.getByRole('button', { name: 'Ver convocatória', exact: false }).click();
  results.push({
    view: 'invitation',
    violations: (
      await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    ).violations,
  });
  await page.getByRole('button', { name: /Aceitar ser avaliado/ }).click();
  for (let i = 0; i < 5; i++) {
    await page
      .getByRole('radio')
      .nth(i % 4)
      .check();
    if (i === 0)
      results.push({
        view: 'questionnaire',
        violations: (
          await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
        ).violations,
      });
    await page
      .getByRole('button', { name: i === 4 ? /Consultar decisão/ : /Próxima pergunta/ })
      .click();
  }
  await page.getByRole('heading', { name: 'Admitido.' }).waitFor();
  await page.getByRole('button', { name: 'Ver verso do cartão de sócio' }).click();
  assert.equal(
    await page
      .getByRole('button', { name: 'Ver frente do cartão de sócio' })
      .getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('button', { name: 'Ver frente do cartão de sócio' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Guardar cartão/ }).click();
  const card = await download;
  await card.saveAs('artifacts/cartao.png');
  const bytes = await readFile('artifacts/cartao.png');
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  await page.getByRole('radio', { name: /Jantar às Cegas/ }).check();
  await page.getByLabel('Data proposta', { exact: true }).fill('2099-01-05');
  await page.getByLabel(/Alguma observação/).fill('Teste local sem envio.');
  await page
    .getByRole('form', { name: 'Pedir reserva' })
    .getByRole('button', { name: /^Pedir reserva/ })
    .click();
  await page.getByRole('alert').filter({ hasText: 'ainda não está disponível' }).waitFor();
  assert.equal(await page.getByLabel(/Alguma observação/).inputValue(), 'Teste local sem envio.');
  await page.getByRole('button', { name: /Inquérito de satisfação/ }).click();
  for (const name of [
    'Comida',
    'Ambiente',
    'Escolha do filme',
    'Companhia',
    'Qualidade dos abraços',
    'Vontade de repetir',
  ])
    await page.getByRole('radio', { name: `${name}: 1 de 5`, exact: true }).check();
  const admittedAxe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  results.push({ view: 'admitted', violations: admittedAxe.violations });
  await page.screenshot({ path: 'artifacts/desktop-admitted.png', fullPage: true });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
      `Overflow at ${width}px`,
    );
    await page.screenshot({ path: `artifacts/member-${width}.png`, fullPage: true });
  }
  await page.reload();
  await page.getByRole('heading', { name: 'Admitido.' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Menu +' }).click();
  await page.getByRole('link', { name: 'Secretaria', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Menu +' }).getAttribute('aria-expanded'),
    'false',
  );
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  await mobile.goto(url);
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  );
  await writeFile('artifacts/accessibility.json', JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify(
      {
        browserErrors: errors,
        accessibility: results.map((item) => ({
          view: item.view,
          violations: item.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        })),
        downloads: ['cartao.png'],
        viewports: [320, 390, 768, 1440],
      },
      null,
      2,
    ),
  );
  assert.equal(errors.length, 0, 'Browser errors');
  assert.equal(results.flatMap((item) => item.violations).length, 0, 'Accessibility violations');
} finally {
  await browser.close();
}
