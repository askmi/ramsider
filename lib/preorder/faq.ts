import 'server-only';
import faq from './faq.json';
import type { Locale } from '@/lib/i18n';
// The supplied FAQ feed is English. Never present retired v2.1 translations as R6.9j.
const ids: Record<string,string> = {preorder:'preordering',set:'included-set',shipping:'shipping',tracking:'tracking'};
export function preorderFaqAnswer(id: string) {
 const answer=faq.find(item=>item.id===ids[id]);
 if(!answer) throw new Error(`Unmapped preorder FAQ: ${id}`);
 return answer.answer.replace('See Terms of Sale v9 §6.3 (full text pending).', 'See Terms and Conditions of Sale §6.3.');
}
export function preorderFaqHref(id:string,locale:Locale){
 return `/${locale}/${({preorder:'terms-of-sale',set:'product-info',shipping:'delivery-policy',tracking:'contact'} as Record<string,string>)[id]}`;
}
