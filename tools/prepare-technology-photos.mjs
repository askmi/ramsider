/** Restore only title glyphs; all other master pixels are copied exactly. */
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sources = {
  '02': 'HeatCore_02_THREE_HEATERS_941x1672.png',
  '03': 'HeatCore_03_ACTIVE_AIR_SAILS_941x1672.png',
  '04': 'HeatCore_04_PROGRAMMABLE_HEAT_PROFILES_941x1672.png',
  '05': 'HeatCore_05_GOLD_AND_TITANIUM_NITRIDE_941x1672.png',
};
const crop = { left: 16, top: 80, width: 528, height: 256 };
const evidence = 'docs/evidence/technology-viewer/live-title';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(evidence, { recursive: true });
const items = [];

for (const [id, filename] of Object.entries(sources)) {
  const source = `design/references/tech_01/${filename}`;
  const patch = `design/derived/technology-title/${id}-wall.png`;
  const output = `public/art/technology/${id}.png`;
  const sourceBytes = await readFile(source);
  const { data: original, info } = await sharp(sourceBytes).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (width !== 941 || height !== 1672 || channels !== 3) throw new Error(`Unexpected master ${id}`);
  const wall = await sharp(patch).raw().toBuffer();
  const smoothWall = await sharp(patch).blur(3).raw().toBuffer();
  const mask = Buffer.alloc(width * height);
  const letters = [];
  for (let y = 124; y < 279; y++) for (let x = 51; x < 492; x++) {
    const i = (y * width + x) * 3;
    const [r, g, b] = original.subarray(i, i + 3);
    const main = y < 215 && Math.max(r, g, b) < 180;
    const subtitle = y >= 240 && x < 220 && r - g > 25 && g - b > 8 && g < 190;
    if (main || subtitle) letters.push([x, y]);
  }
  // Two native pixels include antialiasing; the surrounding wall remains original.
  for (const [x, y] of letters) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mask[(y + dy) * width + x + dx] = 255;
  const clean = Buffer.from(original);
  let maskedPixels = 0;
  const bounds = { left: width, top: height, right: 0, bottom: 0 };
  for (let y = 122; y < 281; y++) for (let x = 49; x < 494; x++) {
    if (!mask[y * width + x]) continue;
    maskedPixels++;
    bounds.left = Math.min(bounds.left, x); bounds.right = Math.max(bounds.right, x + 1);
    bounds.top = Math.min(bounds.top, y); bounds.bottom = Math.max(bounds.bottom, y + 1);
    const correction = [0, 0, 0]; let samples = 0;
    // Match the reconstruction to the untouched nearby source lighting/color.
    for (let dy = -14; dy <= 14; dy += 2) for (let dx = -14; dx <= 14; dx += 2) {
      const sx = x + dx, sy = y + dy;
      if (mask[sy * width + sx]) continue;
      const s = (sy * width + sx) * 3;
      const p = ((sy - crop.top) * crop.width + sx - crop.left) * 3;
      for (let c = 0; c < 3; c++) correction[c] += original[s + c] - wall[p + c];
      samples++;
    }
    if (!samples) throw new Error(`No source color samples ${id}:${x},${y}`);
    const p = ((y - crop.top) * crop.width + x - crop.left) * 3;
    const s = (y * width + x) * 3;
    for (let c = 0; c < 3; c++) {
      let value = wall[p + c] + correction[c] / samples;
      if (id === '03') {
        // This wall has narrow grooves: retain their original X phase. Sampling
        // the untouched column above/below the glyph prevents a ghost outline
        // when generated groove positions differ by even one native pixel.
        let top = y - 1, bottom = y + 1;
        while (mask[top * width + x]) top--;
        while (mask[bottom * width + x]) bottom++;
        top -= 2; bottom += 2;
        const t = (y - top) / (bottom - top);
        const a = original[(top * width + x) * 3 + c];
        const b = original[(bottom * width + x) * 3 + c];
        const texture = Math.max(-2, Math.min(2, wall[p + c] - smoothWall[p + c]));
        value = a * (1 - t) + b * t + texture;
      }
      clean[s + c] = Math.max(0, Math.min(255, Math.round(value)));
    }
  }
  await sharp(clean, { raw: { width, height, channels } }).png({ compressionLevel: 0 }).toFile(output);
  await sharp(mask, { raw: { width, height, channels: 1 } }).png().toFile(`${evidence}/mask-${id}.png`);
  await sharp(sourceBytes).extract(crop).png().toFile(`${evidence}/source-${id}-title.png`);
  await sharp(output).extract(crop).png().toFile(`${evidence}/clean-${id}-title.png`);
  const decoded = await sharp(output).raw().toBuffer();
  let outsideChanged = 0, maxOutsideError = 0;
  for (let i = 0; i < mask.length; i++) if (!mask[i]) for (let c = 0; c < 3; c++) {
    const error = Math.abs(decoded[i * 3 + c] - original[i * 3 + c]);
    if (error) outsideChanged++;
    maxOutsideError = Math.max(maxOutsideError, error);
  }
  if (outsideChanged) throw new Error(`Original pixels changed outside text: ${id}`);
  const metadata = await sharp(output).metadata();
  if (metadata.width !== width || metadata.height !== height || metadata.icc) throw new Error(`Output metadata changed ${id}`);
  items.push({ id, source, output, patch, sourceSha256: sha(sourceBytes), outputSha256: sha(await readFile(output)), patchSha256: sha(await readFile(patch)), width, height, channels, icc: null, outputBytes: (await readFile(output)).length, mask: `${evidence}/mask-${id}.png`, maskedPixels, maskBounds: bounds, outsideChangedChannels: outsideChanged, maxOutsideRgbError: maxOutsideError });
}
await writeFile(`${evidence}/assets.json`, JSON.stringify({ method: 'Local imagegen wall reconstruction; sharp source-preserving glyph-mask composite; 03 uses original column interpolation plus bounded reconstructed texture to preserve groove phase; PNG compressionLevel 0; no master resize/color/profile change', crop, glyphMask: 'main max RGB <180; subtitle warm brown; two-pixel dilation; local source color correction', items }, null, 2) + '\n');
console.log(JSON.stringify(items.map(({ id, maskedPixels, outsideChangedChannels, outputBytes }) => ({ id, maskedPixels, outsideChangedChannels, outputBytes }))));
