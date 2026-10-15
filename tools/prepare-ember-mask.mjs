import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

// Non-color data only. The photographic background and its ICC are never exported or modified.
const source = 'design/references/background.png';
const box = { left: 260, top: 2360, width: 480, height: 760 };
const input = await readFile(source);
const meta = await sharp(input).metadata();
const pixels = await sharp(input).extract(box).removeAlpha().toColourspace('srgb').raw().toBuffer();
const outline = '109,390 112,360 119,347 143,337 169,335 182,326 211,326 233,316 251,326 274,320 296,327 324,326 345,338 380,341 388,363 390,425 386,573 372,609 313,642 275,651 226,642 137,634 115,618 109,592';
const silhouette = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="760"><polygon points="${outline}" fill="white"/></svg>`)).ensureAlpha().raw().toBuffer();
const emission = Buffer.alloc(box.width * box.height);
for (let i = 0; i < emission.length; i++) {
  const [r, g, b] = pixels.subarray(i * 3, i * 3 + 3);
  // Warm background pixels never pass the silhouette and saturated-red criteria together.
  const chroma = Math.max(0, Math.min(1, (r - Math.max(g * 1.18, b * 1.4) - 15) / 130));
  emission[i] = Math.round(255 * chroma * silhouette[i * 4 + 3] / 255);
}
const halo = await sharp(emission, { raw: { width: 480, height: 760, channels: 1 } }).blur(4).extractChannel(0).raw().toBuffer();
if (halo.length !== emission.length) throw new Error('Unexpected mask channel stride');
const data = Buffer.alloc(480 * 760 * 4);
let active = 0;
for (let i = 0; i < emission.length; i++) {
  data[i * 4] = emission[i];
  data[i * 4 + 1] = halo[i];
  data[i * 4 + 2] = silhouette[i * 4 + 3];
  data[i * 4 + 3] = 255;
  if (emission[i]) active++;
}
await mkdir('public/art/ember', { recursive: true });
const file = 'public/art/ember/mask.png';
await sharp(data, { raw: { width: 480, height: 760, channels: 4 } }).png({ compressionLevel: 9 }).toFile(file);
const decoded = await sharp(file).raw().toBuffer();
if (!decoded.equals(data)) throw new Error('Ember data texture is not lossless');
const report = { source, sourceSHA256: createHash('sha256').update(input).digest('hex'), sourceICCBytes: meta.icc?.length ?? 0, sourceProfile: 'Adobe RGB (1998), existing source; sharp color-managed extraction for chroma selection only', box, channels: { r: 'emission', g: '4px halo', b: 'occlusion silhouette', a: 'opaque data texture' }, colorSpace: 'non-color data, deliberately no ICC', emissionPixels: active, bytes: (await readFile(file)).length, decodedExact: true, photographicAssetsChanged: false };
await mkdir('docs/evidence/ember', { recursive: true });
await writeFile('docs/evidence/ember/mask.json', JSON.stringify(report, null, 2) + '\n');
console.log(report);
