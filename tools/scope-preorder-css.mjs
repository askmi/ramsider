/** Scope a supplied HTML document with separate html/body proxies and unchanged selector specificity. */
import fs from 'node:fs/promises';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
const source='design/комплект_для_Александра_r6.9j/site/';
const styles=JSON.parse(await fs.readFile('lib/preorder/source-styles.json','utf8'));
function nodes(value){return selectorParser().astSync(value).first.nodes.map(n=>n.clone());}
function scopeSelectors(value,routes){
 const all=routes.length===Object.keys(styles).length;
 const html=all?'.uno-package-root':`.uno-package-root:is(${routes.map(route=>`.up-root-${route}`).join(',')})`;
 const body=`${html} .uno-package`;
 return selectorParser(root=>{
  root.walkClasses(node=>{node.value=`up-${node.value}`;});
  for(const selector of [...root.nodes]){
   let anchored=false;
   selector.walkTags(node=>{if(node.value==='html'||node.value==='body'){anchored=true;node.replaceWith(...nodes(`div:where(${node.value==='html'?html:body})`));}});
   selector.walkPseudos(node=>{if(node.value===':root'){anchored=true;node.replaceWith(...nodes(`.uno-package-root:where(${html})`));}});
   if(anchored)continue;
   // Unqualified language selectors originally match html itself, as well as nested language islands.
   if(selector.first?.type==='attribute'&&['lang','dir'].includes(selector.first.attribute)){
    const self=selector.clone();self.prepend(...nodes(`:where(${html})`));root.insertBefore(selector,self);
   }
   if(selector.nodes.length===1&&selector.first.type==='universal')root.insertBefore(selector,selectorParser().astSync(`:where(${html})`).first);
   selector.prepend(selectorParser.combinator({value:' '}));selector.prepend(...nodes(`:where(${html})`));
  }
 }).processSync(value);
}
// A shared stylesheet is emitted once. A DAG preserves its position relative to every page's inline CSS.
const groups=new Map(),sequences={};
for(const[route,files]of Object.entries(styles)){
 const sequence=files.map((file,index)=>{
  const id=file.file??`${route}:inline:${index}`;
  if(!groups.has(id))groups.set(id,{file,routes:[],after:new Set()});
  groups.get(id).routes.push(route);return id;
 });
 sequences[route]=sequence;
 for(let i=1;i<sequence.length;i++)groups.get(sequence[i]).after.add(sequence[i-1]);
}
const order=[];
while(order.length<groups.size){
 const next=[...groups].find(([id,group])=>!order.includes(id)&&[...group.after].every(previous=>order.includes(previous)));
 if(!next)throw Error('Source page cascades conflict; do not reorder styles silently');
 order.push(next[0]);
}
let output='/* Generated R6.9j: shared styles deduplicated by verified page-cascade DAG; :where scope adds no specificity. */\n';
for(const id of order){
 const{file,routes}=groups.get(id);
 const text=file.inline??await fs.readFile(source+file.file,'utf8');const ast=postcss.parse(text);
 ast.walkAtRules('font-face',rule=>rule.remove());const animations=new Map();
 ast.walkAtRules(rule=>{if(/keyframes$/.test(rule.name)){const old=rule.params;const name=`up-r69-${old}`;animations.set(old,name);rule.params=name;}});
 ast.walkRules(rule=>{if(rule.parent.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;rule.selector=scopeSelectors(rule.selector,routes);});
 const animationTokens=new RegExp(`\\b(?:${[...animations.keys()].sort((a,b)=>b.length-a.length).join('|')})\\b`,'g');
 ast.walkDecls(decl=>{if(animations.size&&/^animation(?:-name)?$/.test(decl.prop))decl.value=decl.value.replace(animationTokens,token=>animations.get(token));});
 output+=ast.toString()+'\n';
}
for(const sequence of Object.values(sequences))for(let i=1;i<sequence.length;i++)if(order.indexOf(sequence[i-1])>=order.indexOf(sequence[i]))throw Error('Source cascade not preserved');
await fs.writeFile('components/preorder/package.css',output.trim()+'\n');
await fs.writeFile('docs/evidence/r69j/source-cascade.json',JSON.stringify({order,sequences,specificity:'Original html/body tags represented by div:where proxies; shared stylesheet emitted only on its supplied routes',allPageOrdersPreserved:true},null,2)+'\n');
console.log('Scoped',Object.keys(styles).length,'source cascades using',groups.size,'ordered shared/inline styles');
