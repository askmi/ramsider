'use client';

import { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist';
import type { Locale } from '@/lib/i18n';
import type { CertificateCopy } from '@/lib/certificate-copy';
import { LoadingStatus } from './MediaLoading';

GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

type Source = {href: string; pages: number; rotation: number; pageRotations?: Record<number, number>};
export type CertificateDocumentProps = {source: Source; title: string; locale: Locale; copy: CertificateCopy; onReload: () => void};

export default function CertificateDocument({ source, title, locale, copy, onReload }: CertificateDocumentProps) {
 const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
 const [error, setError] = useState(false);
 const [reloadRequired, setReloadRequired] = useState(false);
 const [attempt, setAttempt] = useState(0);
 const [pageNumber, setPageNumber] = useState(1);
 const [zoom, setZoom] = useState(1);
 const [rotation, setRotation] = useState(source.rotation);
 const [ready, setReady] = useState(false);
 const [width, setWidth] = useState(0);
 const [text, setText] = useState('');
 const canvas = useRef<HTMLCanvasElement>(null);
 const scroller = useRef<HTMLDivElement>(null);
 useEffect(() => {
  const node = scroller.current;
  if (!node) return;
  let previous = 0;
  const observer = new ResizeObserver(() => {if (node.clientWidth !== previous) {previous = node.clientWidth;setReady(false);setWidth(previous);}});
  observer.observe(node);
  return () => observer.disconnect();
 }, []);
 useEffect(() => {
  const controller = new AbortController();
  let disposed = false;
  let task: ReturnType<typeof getDocument> | undefined;
  const timeout = setTimeout(() => {controller.abort();setError(true);void task?.destroy();}, 30000);
  (async () => {
   try {
    const response = await fetch(source.href, {signal:controller.signal});
    if (!response.ok) throw new Error('PDF response failed');
    const data = new Uint8Array(await response.arrayBuffer());
    if (disposed) return;
    task = getDocument({data, cMapUrl:'/pdfjs/cmaps/', cMapPacked:true, standardFontDataUrl:'/pdfjs/standard_fonts/', wasmUrl:'/pdfjs/wasm/'});
    const document = await task.promise;
    if (!disposed) setPdf(document);
   } catch (reason) {
    if (!disposed) {setError(true);if (/worker/i.test(reason instanceof Error ? reason.message : String(reason))) setReloadRequired(true);}
   } finally {clearTimeout(timeout);}
  })();
  return () => {disposed = true;clearTimeout(timeout);controller.abort();void task?.destroy();};
 }, [source.href, attempt]);
 useEffect(() => {
  if (!pdf || !width) return;
  let cancelled = false;
  let task: RenderTask | undefined;
  const timeout = setTimeout(() => {if (!cancelled) {task?.cancel();setError(true);}}, 30000);
  (async () => {
   try {
    const page = await pdf.getPage(pageNumber);
    if (cancelled || !canvas.current) return;
    const angle = (page.rotate + rotation + (source.pageRotations?.[pageNumber] ?? 0)) % 360;
    const natural = page.getViewport({scale:1, rotation:angle});
    const viewport = page.getViewport({scale:width * zoom / natural.width, rotation:angle});
    const outputScale = Math.min(devicePixelRatio || 1, 3, 6000 / Math.max(viewport.width,viewport.height));
    const node = canvas.current;
    node.width = Math.floor(viewport.width * outputScale);
    node.height = Math.floor(viewport.height * outputScale);
    node.style.width = `${viewport.width}px`;
    node.style.height = `${viewport.height}px`;
    task = page.render({canvas:node, viewport, transform:[outputScale,0,0,outputScale,0,0]});
    await task.promise;
    if (cancelled) return;
    scroller.current?.scrollTo({top:0,left:0,behavior:'instant'});
    setReady(true);
    clearTimeout(timeout);
    const content = await page.getTextContent();
    if (!cancelled) setText(content.items.map(item => 'str' in item ? item.str : '').join(' '));
   } catch {if (!cancelled) setError(true);}
   finally {clearTimeout(timeout);}
  })();
  return () => {cancelled = true;clearTimeout(timeout);task?.cancel();};
 }, [pdf, pageNumber, width, zoom, rotation, source.pageRotations]);
 const retry = () => {if (reloadRequired) {onReload();return;}setError(false);setReady(false);setPdf(null);setAttempt(value => value+1);};
 const navigate = (page: number) => {setReady(false);setPageNumber(page);};
 return <div className="certificate-document" aria-busy={!ready && !error}>
  <div ref={scroller} className="certificate-scroll" tabIndex={0} role="region" aria-label={title}>
   <canvas ref={canvas} style={{visibility:ready && !error ? 'visible' : 'hidden'}} role="img" aria-label={`${title} — ${copy.page} ${pageNumber} / ${pdf?.numPages ?? source.pages}`} />
   {ready && text && <details className="certificate-text" dir="auto"><summary>{copy.text}</summary><p>{text}</p></details>}
  </div>
  {(!ready || error) && <LoadingStatus locale={locale} labels={copy} spinner error={error} onRetry={retry} />}
  <footer className="certificate-controls">
   <button type="button" aria-label={copy.previous} aria-disabled={!ready || error || pageNumber === 1} onClick={() => {if (ready && !error && pageNumber>1) navigate(pageNumber-1);}}>‹</button>
   <output aria-live="polite">{copy.page} <bdi>{pageNumber} / {pdf?.numPages ?? source.pages}</bdi></output>
   <button type="button" aria-label={copy.next} aria-disabled={!ready || error || pageNumber === (pdf?.numPages ?? source.pages)} onClick={() => {if (ready && !error && pageNumber<(pdf?.numPages ?? source.pages)) navigate(pageNumber+1);}}>›</button>
   <button type="button" aria-label={`${copy.zoom}: ${zoom*100}%`} aria-disabled={!ready || error} onClick={() => {if (!ready || error) return;setReady(false);setZoom(value => value === 2 ? 1 : value + .5);}}>{zoom*100}%</button>
   <button type="button" aria-label={copy.rotate} aria-disabled={!ready || error} onClick={() => {if (!ready || error) return;setReady(false);setRotation(value => (value+90)%360);}}>↻</button>
  </footer>
 </div>;
}
