import { test, expect } from '@playwright/test';
import { open } from 'node:fs/promises';

const original = '/films/evolution/original-v1/original.mp4';
test('original delivery bounds open ranges and preserves exact bytes, finite ranges and HEAD', async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One HTTP protocol owner; no browser substitution');
  const source = await open(`public${original}`, 'r');
  try {
    for (const [range, start, end] of [
      ['bytes=0-', 0, 2097151],
      ['bytes=294912-', 294912, 2392063],
      ['bytes=207457340-', 207457340, 207457343],
      ['bytes=1000000-1001023', 1000000, 1001023],
    ] as const) {
      const response = await request.get(original, { headers: { Range: range } });
      expect(response.status()).toBe(206);
      expect(response.headers()['content-range']).toBe(`bytes ${start}-${end}/207457344`);
      const expected = Buffer.alloc(end - start + 1);
      await source.read(expected, 0, expected.length, start);
      expect((await response.body()).equals(expected)).toBe(true);
    }
    const head = await request.head(original);
    expect(head.status()).toBe(200); expect(head.headers()['content-length']).toBe('207457344');
    const invalid = await request.get(original, { headers: { Range: 'bytes=207457344-' } });
    expect(invalid.status()).toBe(416);
  } finally { await source.close(); }
});
