import 'server-only';
import faq from './faq.json';
import type { Locale } from '@/lib/i18n';
// The package supplies an English FAQ feed only. Arabic below translates the current
// short answers; retain every number, restriction and preview qualification.
const arabicAnswers: Record<string,string> = {
 preorder: 'يُقدَّم الطلب عند سداد الدفعة الأولى بالبطاقة على الموقع وفقاً لشروط وأحكام البيع. هذه النسخة للمعاينة فقط. يستغرق التصنيع 4 أشهر من الدفعة الأولى. لا تُفرض ضريبة القيمة المضافة. UNO PRO: 3,670 درهم إماراتي (999 دولاراً أمريكياً للاستدلال)؛ الدفعة الأولى 2,200 درهم إماراتي (599 دولاراً للاستدلال)، والدفعة الثانية 1,470 درهم إماراتي (400 دولار للاستدلال). UNO GOLD: 7,340 درهم إماراتي (1,999 دولاراً أمريكياً للاستدلال)؛ الدفعة الأولى 3,700 درهم إماراتي (999 دولاراً للاستدلال)، والدفعة الثانية 3,640 درهم إماراتي (1,000 دولار للاستدلال). سعر الملحقات بالدرهم عند الطلب، والأسعار بالدولار للاستدلال فقط.',
 set: 'يتضمن UNO خزاناً مضاءً بسعة 1 لتر وبطارية وشاحناً وكبسولة قابلة لإعادة الاستخدام وملحقات. PRO: خزان داكن؛ GOLD: خزان شفاف. تتضمن المجموعة مجاناً مجموعة تجريبية من كبسولات التعبئة الذاتية ذات الاستخدام الواحد (بضع قطع). راجع معلومات المنتج للاطلاع على المجموعة الكاملة والخيارات.',
 shipping: 'يستغرق التصنيع 4 أشهر من الدفعة الأولى؛ مدة التوصيل منفصلة. يتوفر التوصيل داخل الإمارات ودولياً، باستثناء الهند (IN) وتايلاند (TH) وتركيا (TR) وقطر (QA)، وهي مستبعدة. راجع شروط وأحكام البيع، القسم 6.3. يتم الشحن بعد السداد الكامل.',
 tracking: 'سيكون الحساب الشخصي متاحاً قريباً. رسائل تأكيد الطلب عبر البريد الإلكتروني وتتبع الشحنة بانتظار التفعيل. لا ترسل معاينة الحجز الحالية طلباً. للاستفسار عن حالة الطلب، تواصل مع support@ramsider.com.',
};
const arabicLinks: Record<string,string> = {preorder:'شروط وأحكام البيع',set:'معلومات المنتج',shipping:'سياسة التوصيل',tracking:'التواصل'};
const ids: Record<string,string> = {preorder:'preordering',set:'included-set',shipping:'shipping',tracking:'tracking'};
export function preorderFaqAnswer(id: string, locale?: Locale) {
 if(locale==='ar' && arabicAnswers[id]) return arabicAnswers[id];
 const answer=faq.find(item=>item.id===ids[id]);
 if(!answer) throw new Error(`Unmapped preorder FAQ: ${id}`);
 return answer.answer.replace('See Terms of Sale v9 §6.3 (full text pending).', 'See Terms and Conditions of Sale §6.3.');
}
export function preorderFaqHref(id:string,locale:Locale){
 return `/${locale}/${({preorder:'terms-of-sale',set:'product-info',shipping:'delivery-policy',tracking:'contact'} as Record<string,string>)[id]}`;
}

export function preorderFaqLinkLabel(id: string, locale: Locale) {
 if(locale==='ar') return arabicLinks[id];
 return ({preorder:'Terms and Conditions of Sale',set:'Product Information',shipping:'Delivery Policy',tracking:'Contact'} as Record<string,string>)[id];
}
