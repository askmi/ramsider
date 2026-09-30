/** Build small, deterministic Arabic/CJK fallback fonts for localized CTA text. */
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadStoryData } from './load-story-data.mjs';

const root = new URL('../', import.meta.url);
const source = new URL('design/assets/Button_Font_Fallbacks/', root);
const output = new URL('public/fonts/button-fallback/', root);
const families = { ar: 'arabic', zh: 'zh', ja: 'ja', ko: 'ko' };
const { t, storyNodes } = await loadStoryData();
await mkdir(output, { recursive: true });

for (const [locale, family] of Object.entries(families)) {
  const labels = storyNodes.filter(node => node.style === 'button').map(node => t(locale, node.key)).join('');
  const fontSource = fileURLToPath(new URL(`noto-${family}-regular.woff2`, source));
  const target = fileURLToPath(new URL(`noto-${family}-buttons.woff2`, output));
  const command = process.env.PYFTSUBSET ?? 'pyftsubset';
  const run = spawnSync(command, [fontSource, `--output-file=${target}`, `--text=${labels}`, '--flavor=woff2', '--layout-features=*'], { encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`${command} failed for ${locale}: ${run.stderr || run.error}`);
  await copyFile(new URL(`LICENSE-${family}.txt`, source), new URL(`LICENSE-${family}.txt`, output));
  console.log(`${locale}: ${(await stat(target)).size} bytes`);
}
