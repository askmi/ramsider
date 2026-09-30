import { webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const stage = process.argv[2];
if (!stage) throw new Error('Pass an explicit matrix stage, for example before or final.');
const locales = ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko'];
const widths = [375, 402, 440, 768, 1440];
await mkdir('screenshots/actual/document-cards', { recursive: true });
const browser = await webkit.launch();
const rows = [];
for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: width <= 440 ? 956 : 900 }, deviceScaleFactor: width <= 440 ? 3 : 1, isMobile: width <= 440, hasTouch: width <= 440 });
  const page = await context.newPage();
  for (const locale of locales) {
    const response = await page.goto(`${baseURL}/${locale}`);
    if (!response?.ok()) throw new Error(`Failed route ${locale} at ${width}px: ${response?.status() ?? 'no response'}`);
    await page.evaluate(() => document.fonts.ready);
    const cards = await page.locator('.doc-card').evaluateAll(nodes => nodes.map(node => {
      const rect = element => element.getBoundingClientRect();
      const contentRect = element => { const range = document.createRange(); range.selectNodeContents(element); return range.getBoundingClientRect(); };
      const button = node.querySelector('button');
      const labelNode = button.querySelector('.doc-action-label');
      const card = rect(node), title = contentRect(node.querySelector('strong')),
        detail = contentRect(node.querySelector('small')), thumbNode = node.querySelector('.doc-thumb'), thumb = thumbNode ? rect(thumbNode) : null,
        label = contentRect(labelNode), arrow = rect(button.querySelector('svg'));
      const canvasWidth = document.querySelector('.canvas').getBoundingClientRect().width;
      const dividerY = card.bottom - 55 * canvasWidth / 941;
      return {
        id: button.id, card: [card.left, card.top, card.right, card.bottom],
        title: [title.left, title.top, title.right, title.bottom], detail: [detail.left, detail.top, detail.right, detail.bottom],
        thumbRight: thumb?.right ?? null, dividerY, label: [label.left, label.top, label.right, label.bottom],
        arrow: [arrow.left, arrow.top, arrow.right, arrow.bottom],
        titleRightExcess: Math.max(0, title.right - card.right + 4),
        detailRightExcess: Math.max(0, detail.right - card.right + 4),
        titleLeftExcess: Math.max(0, card.left + 4 - title.left),
        detailLeftExcess: Math.max(0, card.left + 4 - detail.left),
        contentDividerExcess: Math.max(0, Math.max(title.bottom, detail.bottom) - dividerY + 2),
        footerOffset: (label.top + label.bottom - arrow.top - arrow.bottom) / 2,
        footerGap: getComputedStyle(node).direction === 'rtl' ? label.left - arrow.right : arrow.left - label.right,
      };
    }));
    if (cards.length !== 6) throw new Error(`Expected six document cards for ${locale} at ${width}px, found ${cards.length}`);
    rows.push(...cards.map(card => ({ locale, width, ...card })));
  }
  await context.close();
}
await browser.close();
if (rows.length !== locales.length * widths.length * 6) throw new Error(`Incomplete document-card matrix: ${rows.length} states`);
await writeFile(`screenshots/actual/document-cards/${stage}-matrix.json`, JSON.stringify(rows, null, 2));
const worst = rows.filter(row => row.titleRightExcess > 0 || row.detailRightExcess > 0 || row.titleLeftExcess > 0 || row.detailLeftExcess > 0 || row.contentDividerExcess > 0 || row.footerGap < 0 || Math.abs(row.footerOffset) > 1)
  .sort((a, b) => (b.titleRightExcess + b.detailRightExcess + b.contentDividerExcess) - (a.titleRightExcess + a.detailRightExcess + a.contentDividerExcess));
console.log(JSON.stringify({ states: rows.length, affected: worst.length, worst: worst.slice(0, 12).map(({ locale, width, id, titleRightExcess, detailRightExcess, contentDividerExcess, footerOffset, footerGap }) => ({ locale, width, id, titleRightExcess, detailRightExcess, contentDividerExcess, footerOffset, footerGap })) }));
if (worst.length) process.exitCode = 1;
