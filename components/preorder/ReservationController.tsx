import type {AccessoryOption,Translate} from '@/lib/preorder/types';
const models={
 pro:{name:'UNO Pro Line',initial:599,final:400,total:999,aedInitial:2200,aedFinal:1470,aedTotal:3670},
 gold:{name:'UNO Gold Line',initial:999,final:1000,total:1999,aedInitial:3700,aedFinal:3640,aedTotal:7340},
}as const;
type Model=keyof typeof models;
const euroMarkets=new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO CH'.split(' '));
const prohibited=new Set(['IN','TH','TR','QA']);
/** Only enhances this page's semantic form. No sender, payment, personal-data persistence or fake order ID. */
export function enhanceReservation(root:HTMLElement,options:AccessoryOption[],t:Translate,signal:AbortSignal){
 const get=<T extends HTMLElement=HTMLElement>(id:string):T=>{const el=root.querySelector<T>(`[id="${id}"]`);if(!el)throw Error(`Missing configuration element: ${id}`);return el;};
 const input=(id:string)=>get<HTMLInputElement>(id);
 const form=get<HTMLFormElement>('reservation-form'),country=get<HTMLSelectElement>('country');
 const radios=[...root.querySelectorAll<HTMLInputElement>('input[name=model]')];
 const accessoryInputs=[...root.querySelectorAll<HTMLInputElement>('input[name=accessories]')];
 const countryCodes=new Set([...country.options].map(o=>o.value).filter(code=>/^[A-Z]{2}$/.test(code)));
 const eligible=()=>countryCodes.has(country.value)&&!prohibited.has(country.value);
 let selected:Model=radios.find(r=>r.checked)?.value==='gold'?'gold':'pro';
 const requested=new URLSearchParams(location.search).get('model');if(requested==='pro'||requested==='gold')selected=requested;
 radios.forEach(r=>{r.checked=r.value===selected;});
 let submitted=false,copyVersion=0;
 const set=(id:string,value:string)=>{get(id).textContent=value;};
 const number=(value:number)=>value.toLocaleString('en-US',{maximumFractionDigits:2});
 const aed=(value:number)=>t('reserve.price.aed',{amount:number(value)});
 const usd=(value:number)=>t('reserve.reference.usd',{amount:number(value)});
 const reference=(value:number)=>euroMarkets.has(country.value)?t('reserve.reference.eur',{usd:usd(value)}):usd(value);
 const optionPrice=(option:AccessoryOption)=>typeof option.price==='object'&&option.price!==null?option.price[selected]:option.price;
 const optionName=(option:AccessoryOption)=>t(`options.${option.id}.name`)+(option.id==='hose-mouthpiece-connector-set'?` (${selected.toUpperCase()})`:'');
 const chosen=()=>options.filter(o=>input(`option-${o.id}`).checked);
 const pricing=()=>{const model=models[selected],items=chosen(),extra=items.reduce((sum,o)=>sum+Math.round((optionPrice(o)??0)*100),0)/100;return{model,items,extra,initial:model.initial+extra,final:model.final,total:model.total+extra};};
 const deviceAmount=(field:'initial'|'final'|'total')=>{const {model,items}=pricing();const value=aed(model[field==='initial'?'aedInitial':field==='final'?'aedFinal':'aedTotal']);return field!=='final'&&items.length?t('reserve.price.with_accessories',{amount:value}):value;};
 const lines=()=>chosen().map(o=>`${optionName(o)} — ${t('reserve.price.request')} · ${reference(optionPrice(o)??0)}`);
 function paintModel(announce=false){
  const p=pricing();const values:Record<string,string>={name:p.model.name,finish:t(`reserve.model.${selected}.finish`),reservoir:t(`reserve.model.${selected}.reservoir`),hose:t(`reserve.model.${selected}.hose`),initial:deviceAmount('initial'),final:deviceAmount('final'),total:deviceAmount('total'),initialAed:reference(p.initial),finalAed:reference(p.final)};
  root.querySelectorAll<HTMLElement>('[data-bind]').forEach(el=>{const key=el.dataset.bind!;if(!(key in values))throw Error(`Unmapped configuration binding: ${key}`);el.textContent=values[key];});
  for(const[id,value]of Object.entries({'pro-reference':models.pro.total,'gold-reference':models.gold.total,'accessories-total-reference':p.extra,'order-final-reference':p.final,'order-total-reference':p.total,'confirmation-total-reference':p.total}))set(id,reference(value));
  for(const option of options){set(`option-name-${option.id}`,optionName(option));set(`option-price-${option.id}`,`${t('reserve.price.request')} · ${reference(optionPrice(option)??0)}`);}
  set('next-payment-copy',t('reserve.order.checkEmail',{initial:`${deviceAmount('initial')} ${reference(p.initial)}`}));
  set('accessories-total',p.items.length?t('reserve.price.request'):aed(0));set('order-final',deviceAmount('final'));set('order-total',deviceAmount('total'));
  get('accessories-price-note').hidden=!p.items.length;get('confirmation-price-note').hidden=!p.items.length;
  set('confirmation-accessories',lines().join('\n')||t('reserve.accessories.none'));
  if(announce)set('model-announcement',t('reserve.model.updated',{name:p.model.name,initial:deviceAmount('initial'),total:deviceAmount('total')})+(p.items.length?' '+t('reserve.accessories.excluded'):''));
 }
 function paintMarket(){
  get('market-notice').hidden=eligible();set('market-notice',t(countryCodes.has(country.value)?'reserve.market.restricted':'audit.country.unknown'));
  get('payment-option').hidden=false;get('invoice-note').hidden=false;
  set('reserve-title',t('reserve.order.title'));set('reserve-button',t('reserve.order.button'));set('submission-note',t('reserve.preview.note'));set('next-payment-title',t('reserve.order.next'));
  get<HTMLButtonElement>('pay-now').disabled=true;get<HTMLButtonElement>('reserve-button').disabled=!eligible();paintModel();
 }
 function reset(){copyVersion++;if(!submitted)return;submitted=false;get('confirmation').hidden=true;get('reservation-actions').hidden=false;set('copy-status','');set('copy-number',t('reserve.copy.button'));}
 const fields=[
  {id:'full-name',error:'name-error',valid:()=>!input('full-name').value.trim()||input('full-name').value.trim().length>0,key:'reserve.error.name'},
  {id:'email',error:'email-error',valid:()=>!input('email').value.trim()||(input('email').validity.valid&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input('email').value.trim())),key:'reserve.error.email'},
  {id:'country',error:'country-error',valid:eligible,key:'reserve.error.country'},
  {id:'age',error:'age-error',valid:()=>input('age').checked,key:'reserve.error.age'},
  {id:'terms',error:'terms-error',valid:()=>input('terms').checked,key:'reserve.error.terms'},
 ];
 function validate(field:typeof fields[number]){const valid=field.valid();set(field.error,valid?'':t(field.key));if(valid)get(field.id).removeAttribute('aria-invalid');else get(field.id).setAttribute('aria-invalid','true');return valid;}
 function paintConfirmation(){set('confirmation-title',t('reserve.preview.title'));set('confirmation-status',t('reserve.preview.unsent'));set('confirmation-email-label',t('reserve.email.preview'));set('confirmation-email',input('email').value||t('audit.noContact'));set('confirmation-country',country.selectedOptions[0]?.textContent??'');set('reservation-number','PREVIEW');}
 function refresh(){paintMarket();fields.forEach(field=>{if(get(field.id).hasAttribute('aria-invalid'))validate(field);});if(!get('form-error').hidden)set('form-error',t('reserve.error.review'));if(submitted)paintConfirmation();set('copy-status','');set('copy-number',t('reserve.copy.button'));set('model-announcement','');}
 radios.forEach(radio=>radio.addEventListener('change',()=>{if(!radio.checked)return;selected=radio.value==='gold'?'gold':'pro';reset();paintModel(true);const url=new URL(location.href);url.searchParams.set('model',selected);history.replaceState(history.state,'',url);},{signal}));
 accessoryInputs.forEach(el=>el.addEventListener('change',()=>{const option=options.find(o=>o.id===el.value);if(el.checked&&option?.group==='self-fill-capsules')for(const other of options)if(other.group===option.group&&other.id!==option.id)input(`option-${other.id}`).checked=false;reset();paintModel(true);},{signal}));
 country.addEventListener('change',()=>{reset();paintMarket();},{signal});
 form.addEventListener('input',event=>{reset();const target=event.target;if(!(target instanceof HTMLElement))return;const field=fields.find(f=>f.id===target.id);if(field&&target.hasAttribute('aria-invalid'))validate(field);if(!fields.some(f=>get(f.id).hasAttribute('aria-invalid')))get('form-error').hidden=true;},{signal});
 form.addEventListener('change',reset,{signal});
 form.addEventListener('submit',event=>{event.preventDefault();if(!eligible())return;input('full-name').value=input('full-name').value.trim();input('email').value=input('email').value.trim();const invalid=fields.filter(field=>!validate(field));get('form-error').hidden=!invalid.length;if(invalid.length){set('form-error',t('reserve.error.review'));get(invalid[0].id).focus();return;}if(submitted)return;paintConfirmation();paintModel();submitted=true;get('reservation-actions').hidden=true;get('confirmation').hidden=false;get('confirmation-title').focus({preventScroll:true});get('confirmation-title').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},{signal});
 get('copy-number').addEventListener('click',async()=>{const version=++copyVersion;let copied=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText('PREVIEW');copied=true;}}catch{/* Selectable fallback remains available. */}if(signal.aborted||version!==copyVersion)return;if(!copied){const range=document.createRange();range.selectNodeContents(get('reservation-number'));const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);try{copied=document.execCommand('copy');}catch{copied=false;}}set('copy-number',t(copied?'reserve.copy.done':'reserve.copy.selected'));set('copy-status',t(copied?'reserve.copy.success':'reserve.copy.fallback',{number:'PREVIEW'}));},{signal});
 window.addEventListener('pageshow',()=>{selected=radios.find(r=>r.checked)?.value==='gold'?'gold':'pro';paintMarket();},{signal});
 for(const id of['model-controls','accessory-controls','reservation-controls'])get<HTMLFieldSetElement>(id).disabled=false;
 get('accessories-load-status').hidden=true;set('accessories-load-status','');paintMarket();root.setAttribute('data-reservation-ready','');
 function restoreFromUrl(){const value=new URLSearchParams(location.search).get('model')==='gold'?'gold':'pro';if(value===selected)return;selected=value;radios.forEach(r=>{r.checked=r.value===selected;});reset();paintModel(true);}
 return{refresh,restoreFromUrl};
}
