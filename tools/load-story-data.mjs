/** Load the source TypeScript dictionaries in Node without a Next build. */
import ts from 'typescript';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const asModule = source => {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
};

export async function loadStoryData() {
  const narrative = asModule(await read('lib/narrative-translations.ts'));
  const technical = asModule(await read('lib/technical-translations.ts'));
  const i18nSource = (await read('lib/i18n.ts'))
    .replace("'./narrative-translations'", `'${narrative}'`)
    .replace("'./technical-translations'", `'${technical}'`);
  const { t, locales } = await import(asModule(i18nSource));
  const { storyNodes } = await import(asModule(await read('lib/story.ts')));
  return { t, locales, storyNodes };
}
