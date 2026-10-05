import { copyFile, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const source = 'design/references/01_Compare_Overlay.png';
const output = 'public/art/expression-waves.png';
const sourceBytes = await readFile(source);
const metadata = await sharp(sourceBytes).metadata();

if (metadata.format !== 'png' || metadata.width !== 701 || metadata.height !== 401 || !metadata.hasAlpha) {
  throw new Error(`${source} must be a 701×401 transparent PNG; inspect a changed designer export before updating its placement.`);
}

// Keep the designer's RGBA pixels and metadata byte-for-byte. No raster re-export.
await copyFile(source, output);
console.log(`Copied the designer overlay unchanged to ${output}.`);
