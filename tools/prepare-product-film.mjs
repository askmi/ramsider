import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { readFile, writeFile, mkdir, rename, rm, stat, readdir, copyFile } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const registry = JSON.parse(await readFile(new URL('../config/product-films.json', import.meta.url), 'utf8'));
class FilmError extends Error {}
const temporary = new Set();
function relative(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(value) || path.isAbsolute(value) || value.split('/').some(part => !part || part === '.' || part === '..')) throw new FilmError('Unsafe film package path.');
  return value;
}
async function verified(file, expected) {
  if (await stat(file).then(s => s.size).catch(() => 0) !== expected.bytes) return false;
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex') === expected.sha256;
}
async function complete(directory, files) {
  for (const file of files) if (!await verified(path.join(directory, relative(file.path)), file)) return false;
  const count = async dir => { let n = 0; for (const item of await readdir(dir, { withFileTypes: true })) n += item.isDirectory() ? await count(path.join(dir, item.name)) : 1; return n; };
  return await count(directory).catch(() => -1) === files.length;
}
async function hydrate(archive) {
  const oid = archive.sha256;
  if (!/^[a-f0-9]{64}$/.test(oid) || !Number.isSafeInteger(archive.bytes) || archive.bytes <= 0) throw new FilmError('Invalid film archive identity.');
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(registry.repository)) throw new FilmError('Invalid film repository.');
  const destination = path.join(root, relative(archive.path));
  if (!process.argv.includes('--from-lfs') && await verified(destination, archive)) return destination;
  // Official public Git LFS hydration; signed URLs and headers never enter logs.
  const batch = await fetch(`https://github.com/${registry.repository}.git/info/lfs/objects/batch`, {
    method: 'POST', headers: { Accept: 'application/vnd.git-lfs+json', 'Content-Type': 'application/vnd.git-lfs+json' },
    body: JSON.stringify({ operation: 'download', transfers: ['basic'], objects: [{ oid, size: archive.bytes }] }), signal: AbortSignal.timeout(30000),
  });
  if (!batch.ok) throw new FilmError(`Film LFS lookup failed (HTTP ${batch.status}).`);
  const object = (await batch.json()).objects?.find(value => value.oid === oid && value.size === archive.bytes);
  const action = object?.actions?.download;
  if (!action?.href || new URL(action.href).protocol !== 'https:') throw new FilmError('Approved film archive is unavailable.');
  const response = await fetch(action.href, { headers: action.header ?? {}, signal: AbortSignal.timeout(600000) });
  if (!response.ok || !response.body) throw new FilmError(`Film archive download failed (HTTP ${response.status}).`);
  await mkdir(path.dirname(destination), { recursive: true });
  const partial = destination + `.${randomUUID()}.partial`; temporary.add(partial);
  let bytes = 0; const hash = createHash('sha256');
  const check = new Transform({ transform(chunk, encoding, callback) {
    bytes += chunk.length;
    if (bytes > archive.bytes) return callback(new FilmError('Film archive exceeds approved size.'));
    hash.update(chunk); callback(null, chunk);
  } });
  await pipeline(Readable.fromWeb(response.body), check, createWriteStream(partial, { flags: 'wx' }));
  if (bytes !== archive.bytes || hash.digest('hex') !== oid) throw new FilmError('Film archive failed size/SHA validation.');
  await rename(partial, destination); temporary.delete(partial);
  return destination;
}
async function prepare(asset) {
  if (relative(asset.directory).split('/').length !== 2) throw new FilmError('A film directory must be a versioned package.');
  if (!registry.uiLocales?.every(locale => typeof asset.audioLabels?.[locale] === 'string' && asset.audioLabels[locale].trim())) throw new FilmError('Film audio labels are incomplete.');
  if (!asset.files?.length || !asset.files.some(f => f.path === 'master.m3u8') || !asset.files.some(f => f.path === 'fallback.mp4')) throw new FilmError('Incomplete film registry.');
  const destination = path.join(root, 'public/films', relative(asset.directory));
  if (!process.argv.includes('--from-lfs') && await complete(destination, asset.files)) return;
  const archive = await hydrate(asset.archive);
  const listing = spawnSync('tar', ['-tf', archive], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (listing.status !== 0) throw new FilmError('Cannot inspect film archive.');
  const names = listing.stdout.trim().split('\n').map(relative);
  const expected = new Set(asset.files.map(f => relative(f.path)));
  if (names.length !== expected.size || !names.every(name => expected.has(name))) throw new FilmError('Film archive file set differs from approved registry.');
  const types = spawnSync('tar', ['-tvf', archive], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (types.status !== 0 || types.stdout.trim().split('\n').some(line => !line.startsWith('-'))) throw new FilmError('Film archive must contain regular files only.');
  const staging = path.join(root, 'public/films', `.prepare-${randomUUID()}`); temporary.add(staging);
  await mkdir(staging, { recursive: true });
  if (spawnSync('tar', ['-xf', archive, '-C', staging], { stdio: 'pipe' }).status !== 0) throw new FilmError('Film archive extraction failed.');
  if (!await complete(staging, asset.files)) throw new FilmError('Extracted film objects failed integrity verification.');
  // --from-lfs proves remote integrity, not permission to mutate a valid URL.
  if (await complete(destination, asset.files)) return;
  await mkdir(path.dirname(destination), { recursive: true });
  const backup = path.join(root, 'public/films', `.prepare-backup-${randomUUID()}`);
  const existed = await stat(destination).then(() => true).catch(() => false);
  if (existed) await rename(destination, backup);
  try { await rename(staging, destination); temporary.delete(staging); }
  catch (error) { if (existed) await rename(backup, destination); throw error; }
  if (existed) await rm(backup, { recursive: true, force: true });
}
try {
  await mkdir(path.join(root, 'public/vendor'), { recursive: true });
  await copyFile(path.join(root, 'node_modules/hls.js/dist/hls.worker.js'), path.join(root, 'public/vendor/hls-worker-1.7.3.js'));
  // Preserve upstream executable bytes; production does not need its optional debug map.
  // A new URL keeps the previously published immutable worker unchanged.
  const worker = await readFile(path.join(root, 'node_modules/hls.js/dist/hls.worker.js'));
  const mapping = Buffer.from('//# sourceMappingURL=hls.worker.js.map');
  const mappingAt = worker.lastIndexOf(mapping);
  if (mappingAt < 0 || worker.subarray(mappingAt + mapping.length).toString().trim()) throw new FilmError('Unexpected upstream worker source map trailer.');
  await writeFile(path.join(root, 'public/vendor/hls-worker-1.7.3-runtime.js'), worker.subarray(0, mappingAt));
  await rm(path.join(root, 'public/vendor/hls.worker.js.map'), { force: true });
  const active = registry.assets.filter(asset => asset.active).map(asset => `${asset.id}/${asset.audioLocale}`);
  if (new Set(active).size !== active.length) throw new FilmError('Duplicate active film audio version.');
  for (const asset of registry.assets) { await prepare(asset); console.log(`Film package verified: ${asset.id}/${asset.audioLocale}/${asset.version}.`); }
} catch (error) {
  console.error(error instanceof FilmError ? error.message : 'Film preparation failed: network, archive or file operation error.');
  process.exitCode = 1;
} finally {
  for (const file of temporary) await rm(file, { recursive: true, force: true });
}
