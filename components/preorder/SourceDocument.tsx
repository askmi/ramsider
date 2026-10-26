import {createElement,type CSSProperties,type ReactNode} from 'react';
import {documentData,sourceCopy,type DocumentName,type SourceLanguage,type SourceNode} from '@/lib/preorder/content';
import {documentHref} from '@/lib/preorder/routes';
import type {Locale} from '@/lib/i18n';
const attributes: Record<string,string>={class:'className',for:'htmlFor',tabindex:'tabIndex',colspan:'colSpan',rowspan:'rowSpan',maxlength:'maxLength',autocomplete:'autoComplete',inputmode:'inputMode',spellcheck:'spellCheck',autocapitalize:'autoCapitalize',novalidate:'noValidate',readonly:'readOnly',srcset:'srcSet'};
function inlineStyle(value: string): CSSProperties {
  return Object.fromEntries(value.split(';').filter(Boolean).map(declaration=>{const at=declaration.indexOf(':');const name=declaration.slice(0,at).trim();return[name.startsWith('--')?name:name.replace(/-([a-z])/g,(_,c:string)=>c.toUpperCase()),declaration.slice(at+1).trim()];}));
}
/** Trusted import only: scripts, event attributes and unpublished contact URL were removed at build time. */
export function SourceDocument({name,locale,language}:{name:DocumentName;locale:Locale;language:SourceLanguage}) {
  function render(node:SourceNode,key:number):ReactNode {
    if(typeof node==='string')return node.replaceAll('RS-2026-00001','PREVIEW');
    const props:Record<string,unknown>={key};
    for(const[attr,value]of Object.entries(node.attrs)){
      if(attr.startsWith('on')||attr==='selected')continue;
      if(attr==='style'){props.style=inlineStyle(value??'');continue;}
      if(attr==='checked'){props.defaultChecked=true;continue;}
      if(['disabled','required','hidden','multiple','novalidate','readonly'].includes(attr)){props[attributes[attr]??attr]=true;continue;}
      if(attr==='value'&&['input','select','textarea'].includes(node.tag)){props.defaultValue=value??'';continue;}
      let resolved=value??'';
      if(attr==='href'){
        props['data-source-href']=resolved;
        resolved=documentHref(resolved,locale,name,language);
      }
      props[attributes[attr]??attr]=resolved;
    }
    for(const attr of ['aria-label','alt','placeholder','title','content','data-label']){
      const key=node.attrs[`data-i18n-${attr}`];if(key)props[attr]=sourceCopy(key,language);
    }
    if(node.attrs['data-language'])props['aria-pressed']=node.attrs['data-language']===language;
    const translation=node.attrs['data-i18n'];
    const children=translation?[sourceCopy(translation,language)]:node.children.map(render);
    if(node.tag==='textarea'){props.defaultValue=children.join('');return createElement(node.tag,props);}
    return createElement(node.tag,props,...children);
  }
  return <>{documentData[name].children.map(render)}</>;
}
