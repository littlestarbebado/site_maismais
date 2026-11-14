import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

// A separate Vite instance receives test-only configuration. All remote requests
// are intercepted: this script cannot deliver a message to Formspree.
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5174', '--strictPort'],
  {
    env: {
      ...process.env,
      VITE_FORM_PROVIDER: 'formspree',
      VITE_FORMSPREE_ENDPOINT: 'https://formspree.io/f/localtest',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  },
);
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Test server timeout')), 15000);
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Local:')) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.stderr.on('data', (chunk) => {
      clearTimeout(timer);
      reject(new Error(chunk.toString()));
    });
    server.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
  browser = await chromium.launch(
    process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  let fail = true;
  const submissions = [];
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (url.origin === 'https://formspree.io') {
      submissions.push(route.request().postDataJSON());
      return route.fulfill({
        status: fail ? 500 : 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: !fail }),
      });
    }
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5174');
  await page.locator('.entry-copy button').click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole('radio').nth(1).check();
    await page.locator('.quiz-bottom button').click();
  }
  await page.locator('.results-screen > button').click();
  await page.locator('.invite-actions > button').first().click();
  await page.locator('.club-extras > summary').click();
  await page.getByRole('radio', { name: /Tens Uma Ideia Melhor/ }).check();
  await page
    .getByLabel('A tua ideia', { exact: true })
    .fill('Um passeio junto ao rio e um jantar sem inspeções.');
  await page.getByLabel('Data proposta', { exact: true }).fill('2099-02-18');
  const submit = page
    .getByRole('form', { name: 'Pedir reserva' })
    .getByRole('button', { name: /Pedir reserva/ });
  await submit.click();
  await page.getByRole('alert').filter({ hasText: 'Não foi possível confirmar' }).waitFor();
  assert.equal(
    await page.getByLabel('A tua ideia', { exact: true }).inputValue(),
    'Um passeio junto ao rio e um jantar sem inspeções.',
  );
  fail = false;
  await submit.click();
  await page.getByRole('heading', { name: 'Pedido recebido.' }).waitFor();
  assert.equal(await page.getByText('À espera de confirmação', { exact: true }).count(), 1);
  const download = page.waitForEvent('download');
  await page
    .locator('.confirmation')
    .getByRole('button', { name: /Guardar bilhete/ })
    .click();
  await mkdir('artifacts', { recursive: true });
  await (await download).saveAs('artifacts/reserva-bilhete.png');
  assert.equal((await readFile('artifacts/bilhete.png')).subarray(1, 4).toString(), 'PNG');
  await page.locator('.confirmation').screenshot({ path: 'artifacts/confirmation-mobile.png' });
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(
    axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
  );
  await page
    .getByLabel('A tua mensagem', { exact: true })
    .fill('Teste automatizado, sem envio externo.');
  await page.getByRole('button', { name: /Entregar à direção/ }).click();
  await page.getByText(/A direção recebeu a tua reclamação/).waitFor();
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
  await page.getByRole('button', { name: /Enviar avaliação/ }).click();
  await page.getByText(/Agradecemos a tua colaboração/).waitFor();
  assert.equal(submissions.length, 4);
  assert.deepEqual(
    submissions.map((s) => s['form-name']),
    ['reserva', 'reserva', 'livro', 'inquerito'],
  );
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  console.log(
    'PASS: reserva com erro e repetição, bilhete PNG, reclamações, avaliações, acessibilidade. 0 envios externos.',
  );
} finally {
  await browser?.close();
  server.kill();
}
