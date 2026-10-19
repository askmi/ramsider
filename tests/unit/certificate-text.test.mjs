import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readCertificateText} from '../../lib/certificate-text.ts';

test('plain text preserves chunk/item order and existing marked/empty item spacing',async()=>{
 const stream=new ReadableStream({start(c){c.enqueue({items:[{str:'Hello'},{type:'beginMarkedContent'}]});c.enqueue({items:[]});c.enqueue({items:[{str:'world'},{str:'!'}]});c.close();}});
 assert.equal(await readCertificateText({streamTextContent:()=>stream},new AbortController().signal),'Hello  world !');
 assert.equal(stream.locked,false);
});
test('already aborted extraction never acquires a stream',async()=>{
 const controller=new AbortController();controller.abort();let called=false;
 await assert.rejects(readCertificateText({streamTextContent:()=>{called=true;}},controller.signal),{name:'AbortError'});
 assert.equal(called,false);
});
test('abort cancels a pending read once, releases its lock, and removes listener',async()=>{
 let cancels=0,adds=0,removes=0,source;
 const stream=new ReadableStream({start(c){source=c;},cancel(){cancels++;}});
 const controller=new AbortController(),signal=controller.signal;
 const add=signal.addEventListener.bind(signal),remove=signal.removeEventListener.bind(signal);
 signal.addEventListener=(...args)=>{adds++;return add(...args);};signal.removeEventListener=(...args)=>{removes++;return remove(...args);};
 const pending=readCertificateText({streamTextContent:()=>stream},signal);
 controller.abort();controller.abort();
 await assert.rejects(pending,{name:'AbortError'});
 assert.equal(cancels,1);assert.equal(stream.locked,false);assert.equal(adds,1);assert.equal(removes,1);
 assert.throws(()=>source.enqueue({items:[{str:'late'}]}),TypeError);
});
test('stream error propagates and releases the reader',async()=>{
 const stream=new ReadableStream({pull(c){c.error(new Error('text stream failed'));}});
 await assert.rejects(readCertificateText({streamTextContent:()=>stream},new AbortController().signal),/text stream failed/);
 assert.equal(stream.locked,false);
});
test('actual PDF.js stream accepts cancellation and worker stays usable',async()=>{
 const {getDocument}=await import('pdfjs-dist');
 const task=getDocument({data:new Uint8Array(readFileSync(new URL('../../public/certificates/electrical-safety.pdf',import.meta.url)))});
 try {
  const pdf=await task.promise,page=await pdf.getPage(1),controller=new AbortController();
  const pending=readCertificateText(page,controller.signal);controller.abort();
  await assert.rejects(pending,{name:'AbortError'});
  assert.equal(await readCertificateText(page,new AbortController().signal),'');
  await new Promise(resolve=>setTimeout(resolve,500));
 } finally {await task.destroy();}
});
