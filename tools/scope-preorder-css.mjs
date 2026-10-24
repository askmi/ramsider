/** Scope supplied package CSS without touching its source files. */
import fs from 'node:fs/promises';
import postcss from 'postcss';
const root='design/references/пакет_сайт_v2.1/';
const scope=(css,scope)=>{
 const ast=postcss.parse(css);
 ast.walkRules(rule=>{
  if(rule.parent.type==='atrule'&&/keyframes/.test(rule.parent.name))return;
  rule.selector=rule.selector.split(',').map(selector=>{
   let s=selector.trim().replace(/\.([a-zA-Z_][\w-]*)/g,(_,c)=>`.up-${c}`);
   s=s.replace(/\bbody(?=[:\s.#[]|$)/g,scope).replace(/:root/g,scope);
   return s.startsWith(scope)?s:`${scope} ${s}`;
  }).join(',');
 });
 return ast.toString().replaceAll('.uno-package .up-legal-page', '.uno-package.up-legal-page');
};
let output='/* Generated from supplied v2.1 CSS; run tools/scope-preorder-css.mjs. */\n';
for(const route of ['reserve','pro','gold','compare','terms','returns','privacy','privacy-ru','product-info']){
 output+=scope(await fs.readFile(`lib/preorder/${route}.source.css`,'utf8'),`.uno-package.up-page-${route}`)+'\n';
 await fs.unlink(`lib/preorder/${route}.source.css`);
}
for(const f of ['common.css','legal.css']){
 let css=await fs.readFile(root+f,'utf8');css=css.replace(/@font-face\{[^}]+\}/g,'');
 output+=scope(css,'.uno-package')+'\n';
}
await fs.writeFile('components/preorder/package.css',output.trim()+'\n');
