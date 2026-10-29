import { NextResponse, type NextRequest } from 'next/server';

const originalBytes = 207457344;
const rangeBytes = 2 * 1024 * 1024;

/** Keep the original file intact while bounding native open-ended downloads. */
export function proxy(request: NextRequest) {
  if (request.method !== 'GET') return NextResponse.next();
  const match = /^bytes=(\d+)-$/.exec(request.headers.get('range') ?? '');
  if (!match) return NextResponse.next();
  const start = Number(match[1]);
  if (!Number.isSafeInteger(start)) return NextResponse.next();
  if (start >= originalBytes) return new NextResponse(null, {
    status: 416, headers: { 'Content-Range': `bytes */${originalBytes}`, 'Accept-Ranges': 'bytes' },
  });
  const headers = new Headers(request.headers);
  headers.set('range', `bytes=${start}-${Math.min(start + rangeBytes, originalBytes) - 1}`);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: '/films/evolution/original-v1/original.mp4' };
