'use client';
import {useEffect} from 'react';
import type {DocumentName,SourceLanguage} from '@/lib/preorder/content';
import type {AccessoryOption,Translate} from '@/lib/preorder/types';
import type {Locale} from '@/lib/i18n';
import {contractHash,documentHref} from '@/lib/preorder/routes';
import {enhanceReservation} from './ReservationController';
type Props={name:DocumentName;locale:Locale;initialLanguage:SourceLanguage;translations:Record<SourceLanguage,Record<string,string>>;titleKey:string;options?:AccessoryOption[];previewCopy:Record<SourceLanguage,string>};
const ageKey='ramsider.age18.session.v3';
const protectedNames=new Set(['reserve','pro','gold','compare','product-info','capsules']);
export function PackageController({name,locale,initialLanguage,translations,titleKey,options,previewCopy}:Props){
 useEffect(()=>{
  const root=document.getElementById('uno-document'),wrapper=root?.closest<HTMLElement>('.uno-package');if(!root||!wrapper)return;
  const controller=new AbortController(),{signal}=controller;
  let language=initialLanguage,routeLocale:string=locale;
  const initialNotice=wrapper.querySelector('[data-preview-notice]')?.textContent??'';
  const t:Translate=(key,values={})=>{const template=translations[language][key]??translations.en[key]??key;return template.replace(/\{(\w+)\}/g,(_,key:string)=>String(values[key]??''));};
  const form=name==='reserve'&&options?enhanceReservation(root,options,t,signal):undefined;
  function followHash(){
   let id:string;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
   if(name==='terms-of-sale')id=contractHash('#'+id,language).slice(1);
   const target=document.getElementById(id);if(target&&root!.contains(target))target.scrollIntoView({block:'start',behavior:'instant'});
  }
  function render(){
   const html=wrapper!.parentElement!;html.lang=language;html.dir=language==='ar'?'rtl':'ltr';wrapper!.dataset.locale=language;
   root!.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el=>{const key=el.dataset.i18n!;if(key in translations[language]||key in translations.en)el.textContent=t(key);});
   for(const attr of['aria-label','alt','placeholder','title','content','data-label'])root!.querySelectorAll<HTMLElement>(`[data-i18n-${attr}]`).forEach(el=>{const key=el.getAttribute(`data-i18n-${attr}`)!;if(key in translations[language]||key in translations.en)el.setAttribute(attr,t(key));});
   root!.querySelectorAll<HTMLAnchorElement>('[data-source-href]').forEach(link=>{link.href=documentHref(link.dataset.sourceHref!,routeLocale,name,language);});
   root!.querySelectorAll<HTMLElement>('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
   if(titleKey in translations[language])document.title=`${t(titleKey)} · Beta`;
   form?.refresh();
  }
  function selectLanguage(value:string,restoredLocale?:string){
   if(value!=='en'&&value!=='ar')return;language=value;routeLocale=restoredLocale??value;
   if(!restoredLocale){const url=new URL(location.href);url.pathname=`/${value}/${name}`;if(name==='terms-of-sale')url.hash=contractHash(url.hash,value);history.replaceState(history.state,'',url);}
   try{localStorage.setItem('ramsider.locale',routeLocale);}catch{/* Selection remains usable with blocked storage. */}
   document.documentElement.lang=routeLocale;document.documentElement.dir=value==='ar'?'rtl':'ltr';
   const beta=wrapper!.querySelector<HTMLElement>('.up-beta');if(beta){beta.lang=routeLocale;beta.dir=value==='ar'?'rtl':'ltr';const note=beta.querySelector('[data-preview-notice]');if(note)note.textContent=routeLocale===locale?initialNotice:previewCopy[value];const original=beta.querySelector<HTMLElement>('[data-source-original]');if(original)original.hidden=routeLocale===value;const home=beta.querySelector<HTMLAnchorElement>('[data-package-home]');if(home)home.href=`/${routeLocale}`;}
   render();followHash();
  }
  root.querySelectorAll<HTMLElement>('[data-language]').forEach(button=>button.addEventListener('click',()=>selectLanguage(button.dataset.language??''),{signal}));
  window.addEventListener('storage',event=>{if(event.key==='ramsider.locale'&&(event.newValue==='en'||event.newValue==='ar'))selectLanguage(event.newValue);},{signal});
  window.addEventListener('hashchange',followHash,{signal});
  window.addEventListener('popstate',()=>{const parts=location.pathname.split('/').filter(Boolean);if(parts.length===2&&parts[1]===name){selectLanguage(parts[0]==='ar'?'ar':'en',parts[0]);form?.restoreFromUrl();}},{signal});
  const standalone=name==='age-gate';
  const gate=root.querySelector<HTMLElement>(standalone?'[data-age-gate]':'[data-site-age-gate]');
  const content=root.querySelector<HTMLElement>('[data-age-content]');
  function ageConfirmed(){try{return sessionStorage.getItem(ageKey)==='confirmed';}catch{return false;}}
  function reveal(accepted:boolean){if(gate)gate.hidden=accepted;if(content)content.hidden=!accepted;document.documentElement.toggleAttribute('data-r69-age-session',accepted);}
  function nextTarget(){
   const fallback=`/${routeLocale}/compare`;
   try{
    const url=new URL(new URLSearchParams(location.search).get('next')||'compare.html',location.href);if(url.origin!==location.origin)return fallback;
    const parts=url.pathname.split('/').filter(Boolean);if(parts.length>2||(parts.length===2&&parts[0]!==routeLocale))return fallback;
    let target=(parts.at(-1)??'').replace(/\.html$/,'');if(target==='product-card')target='product-info';
    return protectedNames.has(target)?`/${routeLocale}/${target}${url.search}${url.hash}`:fallback;
   }catch{return fallback;}
  }
  if(gate){
   if(!standalone)reveal(ageConfirmed());
   root.querySelectorAll('[data-age-confirm]').forEach(button=>button.addEventListener('click',()=>{
    try{sessionStorage.setItem(ageKey,'confirmed');}catch{/* Only this document is confirmed without storage. */}
    if(standalone){location.assign(nextTarget());return;}reveal(true);
    const heading=content?.querySelector<HTMLElement>('h1,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}if(location.hash)followHash();
   },{signal}));
   root.querySelectorAll('[data-age-leave]').forEach(button=>button.addEventListener('click',()=>{try{sessionStorage.removeItem(ageKey);}catch{/* No persisted consent. */}document.documentElement.removeAttribute('data-r69-age-session');location.replace('about:blank');},{signal}));
   window.addEventListener('pageshow',()=>{if(!standalone)reveal(ageConfirmed());},{signal});
  }
  if(name==='contact'){
   const form=root.querySelector<HTMLFormElement>('#contact-form'),source=root.querySelector<HTMLInputElement>('#contact-source');
   const updateSource=()=>{const value=new URLSearchParams(location.search).get('src')??'';if(source)source.value=/^[A-Za-z0-9_-]{1,64}$/.test(value)?value:'';};
   updateSource();window.addEventListener('popstate',updateSource,{signal});form?.addEventListener('submit',event=>event.preventDefault(),{signal});
  }
  render();if(!gate||(!standalone&&ageConfirmed()))followHash();root.setAttribute('data-package-ready','');
  return()=>{controller.abort();root.removeAttribute('data-package-ready');root.removeAttribute('data-reservation-ready');};
 },[name,locale,initialLanguage,translations,titleKey,options,previewCopy]);
 return null;
}
