import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const source = new URL('node_modules/pdfjs-dist/', root);
const destination = new URL('public/pdfjs/', root);
await mkdir(destination, {recursive:true});
await cp(new URL('build/pdf.worker.min.mjs', source), new URL('pdf.worker.min.mjs', destination));
for (const folder of ['cmaps', 'standard_fonts', 'wasm']) await cp(fileURLToPath(new URL(folder, source)), fileURLToPath(new URL(folder, destination)), {recursive:true});
