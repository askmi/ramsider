import type { Locale } from '@/lib/i18n';

// Displayed bottom FAQ copy from beta47dddd, including its shipping wording.
// These answers retain the source preview qualifications; no order service is enabled.
const answers = {
  "en": {
    "preorder": "An order is placed by the first card payment on the website under the Terms and Conditions of Sale. This candidate is a preview only. Manufacturing takes 4 months from the initial payment. No VAT is charged. UNO PRO: AED 3,670 (USD 999 reference); first payment AED 2,200 (USD 599 reference), second payment AED 1,470 (USD 400 reference). UNO GOLD: AED 7,340 (USD 1,999 reference); first payment AED 3,700 (USD 999 reference), second payment AED 3,640 (USD 1,000 reference). Accessories: AED price on request; USD reference only.",
    "set": "UNO includes an illuminated 1 L reservoir, battery, charger, reusable capsule and accessories. PRO: tinted reservoir; GOLD: transparent. A trial set of disposable self-fill capsules (a few pieces) — included free of charge. See Product information for the full set and options.",
    "shipping": "Manufacturing takes 4 months from the initial payment; delivery time is separate. Delivery is available in the UAE and internationally, except India (IN), Thailand (TH), Turkey (TR) and Qatar (QA), which remain excluded. See Terms and Conditions of Sale §6.3. Dispatch follows full payment.",
    "tracking": "Your personal account is coming soon. Order confirmation emails and shipment tracking are awaiting activation. The current reservation preview does not submit an order. For order-status enquiries, contact support@ramsider.com."
  },
  "ar": {
    "preorder": "يُقدَّم الطلب عند سداد الدفعة الأولى بالبطاقة على الموقع وفقاً لشروط وأحكام البيع. هذه النسخة للمعاينة فقط. يستغرق التصنيع 4 أشهر من الدفعة الأولى. لا تُفرض ضريبة القيمة المضافة. UNO PRO: 3,670 درهم إماراتي (999 دولاراً أمريكياً للاستدلال)؛ الدفعة الأولى 2,200 درهم إماراتي (599 دولاراً للاستدلال)، والدفعة الثانية 1,470 درهم إماراتي (400 دولار للاستدلال). UNO GOLD: 7,340 درهم إماراتي (1,999 دولاراً أمريكياً للاستدلال)؛ الدفعة الأولى 3,700 درهم إماراتي (999 دولاراً للاستدلال)، والدفعة الثانية 3,640 درهم إماراتي (1,000 دولار للاستدلال). سعر الملحقات بالدرهم عند الطلب، والأسعار بالدولار للاستدلال فقط.",
    "set": "يتضمن UNO خزاناً مضاءً بسعة 1 لتر وبطارية وشاحناً وكبسولة قابلة لإعادة الاستخدام وملحقات. PRO: خزان داكن؛ GOLD: خزان شفاف. تتضمن المجموعة مجاناً مجموعة تجريبية من كبسولات التعبئة الذاتية ذات الاستخدام الواحد (بضع قطع). راجع معلومات المنتج للاطلاع على المجموعة الكاملة والخيارات.",
    "shipping": "يستغرق التصنيع 4 أشهر من الدفعة الأولى؛ مدة التوصيل منفصلة. يتوفر التوصيل داخل الإمارات ودولياً، باستثناء الهند (IN) وتايلاند (TH) وتركيا (TR) وقطر (QA)، وهي مستبعدة. راجع شروط وأحكام البيع، القسم 6.3. يتم الشحن بعد السداد الكامل.",
    "tracking": "سيكون الحساب الشخصي متاحاً قريباً. رسائل تأكيد الطلب عبر البريد الإلكتروني وتتبع الشحنة بانتظار التفعيل. لا ترسل معاينة الحجز الحالية طلباً. للاستفسار عن حالة الطلب، تواصل مع support@ramsider.com."
  }
} as const;

export function faqAnswer(id: string, locale: Locale) {
  const language = locale === 'ar' ? 'ar' : 'en';
  if (!Object.hasOwn(answers[language], id)) throw new Error(`Unmapped landing FAQ: ${id}`);
  return { language, text: answers[language][id as keyof typeof answers.en] };
}

export const venueFaq = {
  before: 'To view franchise and venue partnership terms, go to the ',
  link: 'Hospitality section',
  after: ' and fill in the form. We will contact you.',
  href: 'https://hospitality.ramsider.com/#enquiry',
} as const;
