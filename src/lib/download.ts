type Line = { label: string; value: string };

// Canvas produces a real PNG without external images, network requests or screenshots.
export async function downloadDocument(
  title: string,
  lines: Line[],
  filename: string,
  footnote: string,
) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  const width = 1400;
  const scratch = canvas.getContext('2d');
  if (!scratch) throw new Error('O navegador não permite criar a imagem.');
  const wrap = (text: string, maxWidth: number): string[] => {
    const output: string[] = [];
    let current = '';
    for (const char of text) {
      if (char === '\n' || scratch.measureText(current + char).width > maxWidth) {
        output.push(current);
        current = char === '\n' ? '' : char;
      } else current += char;
    }
    if (current) output.push(current);
    return output;
  };
  scratch.font = '30px Manrope, sans-serif';
  const wrapped = lines.map((line) => ({ ...line, rows: wrap(line.value, 1140) }));
  scratch.font = '22px Manrope, sans-serif';
  const notes = wrap(footnote, 1140);
  canvas.width = width;
  canvas.height =
    430 +
    wrapped.reduce((height, line) => height + 75 + line.rows.length * 42, 0) +
    notes.length * 32;
  const ctx = scratch;
  ctx.fillStyle = '#F4EAD8';
  ctx.fillRect(0, 0, width, canvas.height);
  ctx.fillStyle = '#1748D4';
  ctx.fillRect(width - 25, 0, 25, canvas.height);
  ctx.strokeStyle = '#101F38';
  ctx.lineWidth = 2;
  ctx.strokeRect(35, 35, width - 70, canvas.height - 70);
  ctx.fillStyle = '#101F38';
  ctx.font = '64px Anton, Impact, sans-serif';
  ctx.fillText('D&B.', 100, 125);
  ctx.font = '20px "Courier New", monospace';
  ctx.fillText('EDIÇÃO LIMITADA A UMA PESSOA.  /  DOCUMENTO PESSOAL', 100, 175);
  ctx.font = '72px Anton, Impact, sans-serif';
  ctx.fillText(title, 100, 290);
  let y = 360;
  for (const line of wrapped) {
    ctx.fillStyle = '#233E60';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText(line.label.toUpperCase(), 100, y);
    y += 44;
    ctx.fillStyle = '#101F38';
    ctx.font = '30px Manrope, sans-serif';
    for (const row of line.rows) {
      ctx.fillText(row, 100, y);
      y += 42;
    }
    y += 31;
  }
  ctx.fillStyle = '#233E60';
  ctx.font = '22px Manrope, sans-serif';
  for (const row of notes) {
    ctx.fillText(row, 100, y + 10);
    y += 32;
  }
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Não foi possível criar a imagem.'))),
      'image/png',
    ),
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
