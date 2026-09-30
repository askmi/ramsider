/** Measure translations in WebKit without depending on a built app or width map. */
import { webkit } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { loadStoryData } from './load-story-data.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const { t, locales, storyNodes } = await loadStoryData();
const mapping = JSON.parse(await read('lib/button-map.json'));
const buttonFont = (await readFile(new URL('public/fonts/opensans-button.ttf', root))).toString('base64');
const regularFont = (await readFile(new URL('public/fonts/opensans-regular.ttf', root))).toString('base64');
const fallbackFamilies = { ar: 'NotoButtonArabic', zh: 'NotoButtonSC', ja: 'NotoButtonJP', ko: 'NotoButtonKR' };
const fallbackFiles = { ar: 'arabic', zh: 'zh', ja: 'ja', ko: 'ko' };
const fallbackFonts = await Promise.all(Object.entries(fallbackFamilies).map(async ([locale, family]) => {
  const data = (await readFile(new URL(`public/fonts/button-fallback/noto-${fallbackFiles[locale]}-buttons.woff2`, root))).toString('base64');
  return { family, data };
}));
const browser = await webkit.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.setContent(`<style>
  @font-face{font-family:OpenSansButton;src:url(data:font/truetype;base64,${buttonFont}) format('truetype')}
  @font-face{font-family:OpenSans;src:url(data:font/truetype;base64,${regularFont}) format('truetype')}
  ${fallbackFonts.map(({ family, data }) => `@font-face{font-family:${family};src:url(data:font/woff2;base64,${data}) format('woff2')}`).join('\n')}
</style>`);
await page.evaluate(async () => {
  await Promise.all(['OpenSansButton','OpenSans','NotoButtonArabic','NotoButtonSC','NotoButtonJP','NotoButtonKR'].map(family => document.fonts.load(`12px ${family}`)));
  await document.fonts.ready;
});

const result = {};
for (const locale of locales.filter(locale => locale !== 'en')) {
  const labels = Object.entries(mapping).filter(([, spec]) => spec.kind === 'pill').map(([id, spec]) => {
    const node = storyNodes.find(node => node.id === id);
    if (!node) throw new Error(`Missing story node: ${id}`);
    return { id, text: t(locale, node.key), fontSize: spec.size / 941 * 402 * .9, fallbackFamily: fallbackFamilies[locale] };
  });
  const measurements = await page.evaluate(labels => {
    const context = document.createElement('canvas').getContext('2d');
    return Object.fromEntries(labels.map(({ id, text, fontSize, fallbackFamily }) => {
      context.font = `400 ${fontSize}px OpenSansButton, ${fallbackFamily ?? 'OpenSans'}, OpenSans, Arial, sans-serif`;
      return [id, context.measureText(text).width * 941 / 402];
    }));
  }, labels);
  result[locale] = {};
  for (const [id, textWidth] of Object.entries(measurements)) {
    const spec = mapping[id];
    const hasArrow = !['Reserve_Now', 'Learn_More'].includes(spec.asset);
    const width = Math.ceil(Math.max(spec.h * 2, textWidth + (hasArrow ? 90 : 45)));
    if (width > 861) throw new Error(`Translation too long for one pill: ${locale}/${id} (${width} source px)`);
    const leftAnchor = id === 'hero-reserve' || id === 'fire-learn';
    const preferredX = leftAnchor ? spec.x : spec.x + (spec.w - width) / 2;
    const x = Math.round(Math.min(Math.max(40, preferredX), 901 - width));
    result[locale][id] = { x, w: width };
  }
}

await browser.close();
await writeFile(new URL('lib/button-localized-widths.json', root), JSON.stringify(result, null, 2) + '\n');
console.log(`Calibrated ${Object.values(result).reduce((count, value) => count + Object.keys(value).length, 0)} localized pill surfaces from source dictionaries and fonts.`);
