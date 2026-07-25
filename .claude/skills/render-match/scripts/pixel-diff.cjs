#!/usr/bin/env node
/*
 * PerfectPixel-style comparison for render-match.
 * Produces (1) an overlay of the render at 50% opacity over the screenshot,
 * and (2) a pixel-diff heatmap + a numeric difference percentage.
 *
 * Run without installing anything into the repo:
 *   npx -y -p jimp@0.22 node pixel-diff.cjs <render> <screenshot> [outDir]
 *
 * Prints JSON: { diffPercent, width, height, diff, overlay }
 * Lower diffPercent = closer match. Iterate until it stops dropping.
 */
const Jimp = require('jimp');
const path = require('path');

async function main() {
  const [, , renderPath, shotPath, outDir = '.'] = process.argv;
  if (!renderPath || !shotPath) {
    console.error('Usage: node pixel-diff.cjs <render> <screenshot> [outDir]');
    process.exit(2);
  }

  const render = await Jimp.read(renderPath);
  const shot = await Jimp.read(shotPath);

  // Normalize the screenshot to the render's exact dimensions so the
  // comparison is aligned pixel-for-pixel (as PerfectPixel expects).
  const w = render.getWidth();
  const h = render.getHeight();
  shot.resize(w, h);

  // Quantified diff heatmap.
  const { percent, image } = Jimp.diff(render, shot, 0.1);
  const diffPath = path.join(outDir, 'diff.png');
  await image.writeAsync(diffPath);

  // PerfectPixel-style overlay: render ghosted at 50% over the built page.
  const overlay = shot.clone();
  overlay.composite(render.clone().opacity(0.5), 0, 0);
  const overlayPath = path.join(outDir, 'overlay.png');
  await overlay.writeAsync(overlayPath);

  console.log(JSON.stringify({
    diffPercent: +(percent * 100).toFixed(2),
    width: w,
    height: h,
    diff: diffPath,
    overlay: overlayPath,
  }));
}

main().catch((e) => { console.error(e); process.exit(1); });
