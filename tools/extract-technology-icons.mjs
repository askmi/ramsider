import sharp from 'sharp';

// Exact annotations from the approved composite. Bounds are in the 941px source.
// Separate icon/path masks keep all nearby words as live, localized HTML.
const groups = [
  { name: 'triple', box: [165, 7118, 240, 60], masks: [[168, 7120, 28, 31], [238, 7165, 164, 11]] },
  { name: 'core', box: [165, 7354, 210, 52], masks: [[165, 7355, 32, 32], [238, 7388, 134, 16]] },
  { name: 'touch', box: [165, 7500, 265, 130], masks: [[165, 7572, 30, 37], [238, 7500, 188, 128]] },
  { name: 'water', box: [165, 7808, 260, 65], masks: [[168, 7810, 25, 34], [238, 7854, 187, 17]] },
  { name: 'light', box: [600, 7321, 150, 155], masks: [[707, 7322, 37, 36], [600, 7369, 79, 105]] },
  { name: 'armor', box: [595, 7565, 152, 145], masks: [[709, 7567, 32, 31], [595, 7614, 85, 94]] },
  { name: 'flow', box: [460, 7814, 290, 145], masks: [[704, 7816, 38, 32], [460, 7809, 220, 124]] },
];

for (const group of groups) {
  const [left, top, width, height] = group.box;
  const box = { left, top, width, height };
  const [composite, clean] = await Promise.all(['background_text', 'background'].map(name =>
    sharp(`design/references/${name}.png`).extract(box).removeAlpha().raw().toBuffer(),
  ));
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceX = left + x;
      const sourceY = top + y;
      if (!group.masks.some(([mx, my, mw, mh]) => sourceX >= mx && sourceX < mx + mw && sourceY >= my && sourceY < my + mh)) continue;
      const rgb = (y * width + x) * 3;
      const delta = Math.max(...[0, 1, 2].map(channel => Math.abs(composite[rgb + channel] - clean[rgb + channel])));
      if (delta <= 1) continue;
      const out = (y * width + x) * 4;
      rgba[out] = composite[rgb];
      rgba[out + 1] = composite[rgb + 1];
      rgba[out + 2] = composite[rgb + 2];
      rgba[out + 3] = 255;
    }
  }
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png().toFile(`public/art/technology-${group.name}.png`);
}
