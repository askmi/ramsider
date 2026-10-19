import type { PDFPageProxy } from 'pdfjs-dist';

// The six non-XFA certificates only need plain text for the accessible disclosure.
// Consume chunks directly: shipping Safari may lack ReadableStream async iteration.
export async function readCertificateText(page: Pick<PDFPageProxy, 'streamTextContent'>, signal: AbortSignal): Promise<string> {
 if (signal.aborted) throw new DOMException('Text extraction cancelled', 'AbortError');
 const reader = page.streamTextContent().getReader();
 let cancelled = false;
 const abort = () => {if (!cancelled) {cancelled = true;void reader.cancel(new Error('Text extraction cancelled')).catch(() => {});}};
 signal.addEventListener('abort', abort, {once:true});
 const parts: string[] = [];
 try {
  while (true) {
   if (signal.aborted) throw new DOMException('Text extraction cancelled', 'AbortError');
   const {done, value} = await reader.read();
   if (signal.aborted) throw new DOMException('Text extraction cancelled', 'AbortError');
   if (done) return parts.join(' ');
   for (const item of value.items) parts.push('str' in item ? item.str : '');
  }
 } finally {
  signal.removeEventListener('abort', abort);
  reader.releaseLock();
 }
}
