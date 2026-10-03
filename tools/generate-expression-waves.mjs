import sharp from 'sharp';

// The composite contains the ornament and baked English copy. Keep only the
// isolated arcs and glints so all live localized HTML remains unobstructed.
const box = { left: 120, top: 14665, width: 700, height: 400 };
const source = 'design/references/';
const [composite, clean] = await Promise.all(['background_text', 'background'].map(name =>
  sharp(`${source}${name}.png`).extract(box).removeAlpha().raw().toBuffer(),
));

function inside(x, y) {
  const leftArc = (y >= 14665 && y <= 14718 && x >= 130 && x <= 365)
    || (y >= 14705 && y <= 14890 && x >= 125 && x <= 225);
  const rightArc = (y >= 14815 && y < 14840 && x >= 730 && x <= 810)
    || (y >= 14840 && y <= 15020 && x >= 700 && x <= 810)
    || (y >= 14975 && y <= 15020 && x >= 680 && x <= 810)
    || (y > 15020 && y <= 15060 && x >= 635 && x <= 810);
  const glint = (y >= 14700 && y <= 14718 && x >= 390 && x <= 565)
    || (y >= 14846 && y <= 14868 && x >= 380 && x <= 565)
    || (y >= 14904 && y <= 14930 && x >= 380 && x <= 565)
    || (y >= 15035 && y <= 15060 && x >= 390 && x <= 565);
  return leftArc || rightArc || glint;
}

const rgba = Buffer.alloc(box.width * box.height * 4);
let changed = 0;
for (let y = 0; y < box.height; y++) {
  for (let x = 0; x < box.width; x++) {
    if (!inside(x + box.left, y + box.top)) continue;
    const rgb = (y * box.width + x) * 3;
    const delta = Math.max(...[0, 1, 2].map(channel => Math.abs(composite[rgb + channel] - clean[rgb + channel])));
    if (delta <= 1) continue;
    const out = (y * box.width + x) * 4;
    rgba[out] = composite[rgb];
    rgba[out + 1] = composite[rgb + 1];
    rgba[out + 2] = composite[rgb + 2];
    rgba[out + 3] = 255;
    changed++;
  }
}
await sharp(rgba, { raw: { width: box.width, height: box.height, channels: 4 } })
  .png().toFile('public/art/expression-waves.png');
console.log(`Extracted ${changed} ornament pixels from the source composite.`);
