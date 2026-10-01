import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const source = 'design/references/background.png';
const target = 'lib/locale-contrast.json';
const step = 10;
const columns = {
  ltr: {
    narrow: { code: [550, 565, 580, 595], chevron: [613, 621, 630, 638] },
    compact: { code: [545, 558, 572, 585], chevron: [602, 610, 618, 626] },
    standard: { code: [545, 557, 570, 582], chevron: [594, 602, 610, 617] },
  },
  rtl: {
    narrow: { code: [355, 370, 385, 400], chevron: [413, 421, 429, 438] },
    compact: { code: [365, 378, 391, 405], chevron: [420, 428, 436, 444] },
    standard: { code: [375, 386, 398, 410], chevron: [423, 430, 438, 445] },
  },
};
const { data, info } = await sharp(source).raw().toBuffer({ resolveWithObject: true });
const luminance = (x, y) => {
  const offset = (y * info.width + x) * info.channels;
  return data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
};
const profile = xs => {
  const bands = Math.ceil(info.height / step);
  const dark = new Uint8Array(bands);
  for (let index = 0; index < bands; index++) {
    const center = index * step;
    let darkSamples = 0;
    // Cover the full source-height of the rendered code, not a thin scanline.
    for (const x of xs) for (const delta of [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25]) {
      if (luminance(x, Math.max(0, Math.min(info.height - 1, center + delta))) < 120) darkSamples++;
    }
    // A bright patch beside a letter must not hide dark artwork behind its strokes.
    dark[index] = Number(darkSamples >= Math.ceil(xs.length * 11 * 0.125));
  }
  // Texture can still create a one-band island; retain only transitions that
  // persist for at least 40 source pixels (about 17 CSS px on iPhone Pro).
  for (let pass = 0; pass < 2; pass++) {
    for (let start = 0; start < bands;) {
      let end = start + 1;
      while (end < bands && dark[end] === dark[start]) end++;
      if (end - start < 4 && start > 0 && end < bands && dark[start - 1] === dark[end]) {
        dark.fill(dark[end], start, end);
      }
      start = end;
    }
  }
  const bytes = Buffer.alloc(Math.ceil(bands / 8));
  dark.forEach((value, index) => { if (value) bytes[index >> 3] |= 1 << (index & 7); });
  return bytes.toString('base64');
};
const output = { source, sourceWidth: info.width, step, profiles: {} };
for (const [direction, widths] of Object.entries(columns)) {
  output.profiles[direction] = Object.fromEntries(Object.entries(widths).map(([width, parts]) => [
    width,
    Object.fromEntries(Object.entries(parts).map(([part, xs]) => [part, profile(xs)])),
  ]));
}
await writeFile(target, JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote ${target} from ${source}`);
