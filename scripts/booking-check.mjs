import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5174';
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
        '5174',
        '--strictPort',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
    );
let browser;
const external = [];

async function waitForPreview() {
  const deadline = Date.now() + 20000;
  let lastError = 'no response';
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Preview exited: ${server.exitCode}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview startup timeout: ${lastError}`);
}

try {
  if (server) await waitForPreview();

  browser = await chromium.launch(
    process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    external.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(url);
  await page.getByRole('button', { name: /COMEÇAR ESTA PALHAÇADA/ }).click();
  for (let question = 0; question < 4; question++) {
    await page.getByRole('radio').nth(1).check();
    await page.getByRole('button', { name: /SEGUINTE|VER O VEREDITO/ }).click();
  }
  await page.getByRole('button', { name: /PRONTO, O QUE É QUE QUERES/ }).click();
  assert.equal(await page.getByRole('form').count(), 0);
  await page.getByRole('button', { name: 'SIMMMMM 💋' }).click();
  await page.getByRole('heading', { name: 'FODA-SE CONSEGUI UM SEGUNDO DATE' }).waitFor();
  assert.equal(await page.getByRole('form').count(), 0);
  assert.equal(
    await page.getByRole('button', { name: /Guardar bilhete|Pedir reserva/ }).count(),
    0,
  );
  assert.equal(await page.locator('.dinner-ticket, .confirmation-grid').count(), 0);
  const violations = (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  ).violations;
  assert.deepEqual(
    violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target),
    })),
    [],
  );
  assert.deepEqual(external, []);
  console.log(
    'PASS: second-date acceptance shows no reservation/ticket flow or external requests.',
  );
} finally {
  await browser?.close();
  server?.kill();
}
