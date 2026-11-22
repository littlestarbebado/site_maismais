import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import assert from 'node:assert/strict';

// Defense in depth: only dist/ is a publishable artifact. Private drafts must
// never be copied into public/, imported by src/, or shipped as source maps.
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    result.push(...(entry.isDirectory() ? await files(path) : [path]));
  }
  return result;
}
const output = await files('dist');
const forbiddenContent =
  /namorar|cap[ií]tulo\s*(?:ii|2)\b|chapter[-_ ]?ii|preciso de tempo|a tua avalia[çc][ãa]o ainda n[ãa]o terminou/i;
const forbiddenPath = /(?:^|[\\/])\.private(?:[\\/]|$)|release-plan/i;
for (const path of output) {
  assert(!/\.map$|\.md$|\.env|release-plan/i.test(path), `Forbidden output: ${path}`);
  assert(!forbiddenPath.test(relative('dist', path)), `Private filename: ${path}`);
  assert(
    !/whatsapp image|kiss bish/i.test(relative('dist', path)),
    `Unreviewed personal photo shipped: ${path}`,
  );
  if (/\.(?:html|css|js|json|txt|svg)$/i.test(path)) {
    assert(
      !forbiddenContent.test(await readFile(path, 'utf8')),
      `Private content found in ${path}`,
    );
  }
}
assert(
  output.some((path) => relative('dist', path).replaceAll('\\', '/') === 'photos/daniel-ben-kiss.jpeg'),
  'The specifically authorized Daniel and Ben photo is missing.',
);
assert(
  output.some((path) => relative('dist', path) === 'admin.html'),
  'Admin entry is missing',
);
for (const name of ['coracao', 'sanidade', 'fallesi']) {
  const source = await readFile(`public/memes/${name}.png`);
  assert(source.equals(await readFile(`dist/memes/${name}.png`)), `Meme altered: ${name}`);
}
console.log(
  `PASS: ${output.length} production files checked; no private chapter or source maps; 3 original memes intact.`,
);
