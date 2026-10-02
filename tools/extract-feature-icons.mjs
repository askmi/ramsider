import sharp from 'sharp';

// Preserve only the reference dividers. Designer icons now come directly from
// ICON_Kit and must never be copied out of the text composite again.
const layers = [
  { name: 'control', x: 340, y: 5150, width: 100, height: 154, bands: [[5299, 5302]] },
  { name: 'draw', x: 340, y: 5352, width: 100, height: 161, bands: [[5507, 5510]] },
  { name: 'intensity', x: 340, y: 5565, width: 100, height: 158, bands: [[5716, 5719]] },
];

for (const layer of layers) {
  const box = { left: layer.x, top: layer.y, width: layer.width, height: layer.height };
  const [composite, clean] = await Promise.all(['background_text', 'background'].map(name =>
    sharp(`design/references/${name}.png`).extract(box).removeAlpha().raw().toBuffer(),
  ));
  const rgba = Buffer.alloc(layer.width * layer.height * 4);
  for (let y = 0; y < layer.height; y++) {
    const sourceY = layer.y + y;
    if (!layer.bands.some(([start, end]) => sourceY >= start && sourceY <= end)) continue;
    for (let x = 0; x < layer.width; x++) {
      const rgb = (y * layer.width + x) * 3;
      const out = (y * layer.width + x) * 4;
      const difference = Math.max(...[0, 1, 2].map(channel =>
        Math.abs(composite[rgb + channel] - clean[rgb + channel]),
      ));
      if (difference <= 1) continue;
      rgba[out] = composite[rgb];
      rgba[out + 1] = composite[rgb + 1];
      rgba[out + 2] = composite[rgb + 2];
      rgba[out + 3] = 255;
    }
  }
  await sharp(rgba, { raw: { width: layer.width, height: layer.height, channels: 4 } })
    .png().toFile(`public/art/feature-divider-${layer.name}.png`);
}
