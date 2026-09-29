#!/usr/bin/env node
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';

const [referencePath, actualPath, diffPath, maximumPercent = '1'] = process.argv.slice(2);
if (!referencePath || !actualPath || !diffPath || !Number.isFinite(Number(maximumPercent))) {
  console.error('Usage: npm run visual:diff -- reference.png actual.png diff.png [max-difference-percent]');
  process.exit(2);
}

const [reference, actual] = await Promise.all(
  [referencePath, actualPath].map((path) => sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })),
);

const { width, height, channels } = reference.info;
if (width !== actual.info.width || height !== actual.info.height || channels !== actual.info.channels) {
  console.error(`Image dimensions differ: reference ${width}x${height}, actual ${actual.info.width}x${actual.info.height}. Align crops and viewport before comparing.`);
  process.exit(2);
}

const diff = Buffer.alloc(width * height * channels);
const differingPixels = pixelmatch(reference.data, actual.data, diff, width, height, {
  threshold: 0.1,
  includeAA: false,
});
await sharp(diff, { raw: { width, height, channels } }).png().toFile(diffPath);

const differencePercent = (differingPixels / (width * height)) * 100;
console.log(JSON.stringify({ width, height, differingPixels, differencePercent, maximumPercent: Number(maximumPercent), diffPath }, null, 2));
if (differencePercent > Number(maximumPercent)) process.exitCode = 1;
