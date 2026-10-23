import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { copyFile, mkdir, rename, rm, stat } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const size = 344657039;
const oid = '71891983591abac3e44a076bf58a031ec8d6aa070a2e1acf046d3bb58c44bf25';
const destination = new URL('../public/films/uno-introduction.mp4', import.meta.url);
const source = new URL('../design/video/english ramsider uno (product introduction).mp4', import.meta.url);
const temporary = new URL(`../public/films/.uno-${randomUUID()}.partial`, import.meta.url);
class FilmError extends Error {}

async function verified(file) {
  if (await stat(file).then(value => value.size).catch(() => 0) !== size) return false;
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex') === oid;
}

async function prepare() {
  await mkdir(new URL('../public/films/', import.meta.url), { recursive: true });
  if (!process.argv.includes('--from-lfs')) {
    if (await verified(destination)) return;
    if (await verified(source)) {
      await copyFile(source, temporary);
      if (!await verified(temporary)) throw new FilmError('Local film copy failed integrity validation.');
      await rename(temporary, destination);
      return;
    }
  }
  // Public-repository LFS hydration also works when Vercel's optional LFS setting is off.
  // Signed action URLs/headers stay in memory; never print them in build logs.
  const batch = await fetch('https://github.com/askmi/ramsider.git/info/lfs/objects/batch', {
    method: 'POST',
    headers: { Accept: 'application/vnd.git-lfs+json', 'Content-Type': 'application/vnd.git-lfs+json' },
    body: JSON.stringify({ operation: 'download', transfers: ['basic'], objects: [{ oid, size }] }),
    signal: AbortSignal.timeout(30000),
  });
  if (!batch.ok) throw new FilmError(`Public Git LFS lookup failed (HTTP ${batch.status}).`);
  const object = (await batch.json()).objects?.find(value => value.oid === oid && value.size === size);
  const action = object?.actions?.download;
  if (!action?.href || new URL(action.href).protocol !== 'https:') throw new FilmError('Approved film is unavailable from public Git LFS.');
  const response = await fetch(action.href, { headers: action.header ?? {}, signal: AbortSignal.timeout(600000) });
  if (!response.ok || !response.body) throw new FilmError(`Git LFS film download failed (HTTP ${response.status}).`);
  const hash = createHash('sha256');
  let received = 0;
  const check = new Transform({ transform(chunk, encoding, callback) {
    received += chunk.length;
    if (received > size) return callback(new FilmError('Git LFS film exceeds approved size.'));
    hash.update(chunk);
    callback(null, chunk);
  } });
  await pipeline(Readable.fromWeb(response.body), check, createWriteStream(temporary, { flags: 'wx' }));
  if (received !== size || hash.digest('hex') !== oid) throw new FilmError('Git LFS film failed size/SHA-256 validation.');
  await rename(temporary, destination);
}

try {
  await prepare();
  console.log(`Product film verified: ${size} bytes, SHA-256 ${oid}.`);
} catch (error) {
  // A network exception may contain a signed URL. Report only controlled diagnostics.
  console.error(error instanceof FilmError ? error.message : 'Film preparation failed: network or file operation error.');
  process.exitCode = 1;
} finally {
  await rm(temporary, { force: true });
}
