import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {locales,type Locale} from '@/lib/i18n';
import {contentLanguage,documentData,documentNames,pageTranslations,sourceCopy,accessoryOptions,type DocumentName} from '@/lib/preorder/content';
import {preorderChrome} from '@/lib/preorder/chrome';
import {SourceDocument} from '@/components/preorder/SourceDocument';
import {PackageController} from '@/components/preorder/PackageController';
import '@/components/preorder/package.css';
import '@/components/preorder/adaptation.css';
type Params={locale:string;document:string};
export const dynamicParams=false;
export function generateStaticParams(){return documentNames.map(document=>({document}));}
export async function generateMetadata({params}:{params:Promise<Params>}):Promise<Metadata>{
 const{locale,document}=await params;const data=documentData[document as DocumentName];
 return{title:data?`${sourceCopy(data.titleKey,contentLanguage(locale as Locale))} · Beta`: 'RAMSIDER Beta',robots:{index:false,follow:false},other:{'r69-document':'true'}};
}
export default async function DocumentPage({params}:{params:Promise<Params>}){
 const{locale:value,document}=await params;
 if(!locales.includes(value as Locale)||!documentNames.includes(document as DocumentName))notFound();
 const locale=value as Locale,name=document as DocumentName,language=contentLanguage(locale),copy=preorderChrome[locale],data=documentData[name];
 const ageBootstrap="try{if(sessionStorage.getItem('ramsider.age18.session.v3')==='confirmed')document.documentElement.setAttribute('data-r69-age-session','')}catch{}";
 return <><script dangerouslySetInnerHTML={{__html:ageBootstrap}}/><div className={`uno-package-root up-root-${name}`} lang={language} dir={language==='ar'?'rtl':'ltr'}><div className={`uno-package up-page-${name} ${data.bodyClass}`} data-locale={language} data-page={data.page}>
  <aside className="up-beta" lang={locale} dir={locale==='ar'?'rtl':'ltr'} aria-label="Beta"><p data-preview-notice>{copy.preview}</p><a data-package-home href={`/${locale}`}>RAMSIDER UNO</a>{language!==locale&&<p data-source-original>{copy.original}</p>}</aside>
  <div id="uno-document" data-document={name}><SourceDocument name={name} locale={locale} language={language}/></div>
  <PackageController name={name} locale={locale} initialLanguage={language} translations={pageTranslations(name)} titleKey={data.titleKey} options={name==='reserve'?accessoryOptions:undefined} previewCopy={{en:preorderChrome.en.preview,ar:preorderChrome.ar.preview}}/>
 </div></div></>;
}
