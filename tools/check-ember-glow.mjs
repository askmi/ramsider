import { webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const phase=process.argv[2]??'after';
if(!['before','after'].includes(phase))throw Error('Use before or after');
const dir='screenshots/ember/glow-correction';
await mkdir(dir,{recursive:true});
const browser=await webkit.launch();
const results=[];
for(const [name,width,height] of [['pro',402,874],['max',440,956]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Freeze only the actual shader's time uniform. Other browser animation/lifecycle stays native.
  await page.addInitScript(()=>{
    window.__emberSampleTime=13.7;
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(...args){
      const gl=Reflect.apply(getContext,this,args);
      if(args[0]==='webgl'&&this.classList.contains('ember-scene__canvas')&&gl){
        const uniforms=new Set(),getUniform=gl.getUniformLocation.bind(gl),setUniform=gl.uniform1f.bind(gl);
        gl.getUniformLocation=(program,name)=>{const location=getUniform(program,name);if(name==='uTime')uniforms.add(location);return location;};
        gl.uniform1f=(location,value)=>setUniform(location,uniforms.has(location)?window.__emberSampleTime:value);
      }
      return gl;
    };
  });
  await page.goto('http://127.0.0.1:3072/en',{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>[...document.querySelectorAll('.art img')].slice(0,2).every(i=>i.hasAttribute('data-media-ready')));
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,2048*Math.min(innerWidth,941)/941-24);});
  await page.waitForFunction(()=>document.querySelector('.ember-scene__canvas')?.dataset.state==='running');
  await page.waitForTimeout(400);
  const box=await page.locator('.ember-scene').boundingBox();
  for(const time of [13.7,16.1,18.5]){
    await page.evaluate(t=>{window.__emberSampleTime=t;},time);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:`${dir}/${phase}-${name}-${time}.png`,scale:'css'});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('.ember-scene')?.dataset.motion==='reduced');
  await page.waitForTimeout(350);
  await page.screenshot({path:`${dir}/${phase}-${name}-static.png`,scale:'css'});
  results.push({name,width,height,dpr:3,box,scrollY:await page.evaluate(()=>scrollY),times:[13.7,16.1,18.5],errors});
  await context.close();
}
await browser.close();
await mkdir('docs/evidence/ember',{recursive:true});
await writeFile(`docs/evidence/ember/glow-${phase}.json`,JSON.stringify({method:'real WebKit with fixed uTime uniform, native rendering',results},null,2)+'\n');
console.log(JSON.stringify(results.map(({name,errors})=>({name,errors}))));
