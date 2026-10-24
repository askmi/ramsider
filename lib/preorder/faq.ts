import 'server-only';
import type { Locale } from '@/lib/i18n';
const answers = {
  en: {
    preorder: 'Choose PRO or GOLD. Your initial payment counts toward the device price. Manufacturing takes 4 months. After the readiness notice, pay the balance within 10 calendar days; a reminder gives 5 more days. Shipping, taxes and duties are extra. For voluntary cancellation, refund of the initial payment: 100 % if you cancel before production starts, 50 % after production has started. The Beta reservation form is a preview only: no order is sent and no payment is taken.',
    set: 'Your set includes UNO, an illuminated reservoir, one battery, a charger, a reusable self-fill capsule, a hose, mouthpiece and connector, cleaning brushes and tweezers, a spare ceramic bowl, five spare membrane valves, instructions and branded packaging. PRO has a carbon mouthpiece, black hose and tinted reservoir; GOLD has a titanium mouthpiece, white-braided hose and transparent reservoir. Available separately, by agreement when ordering: extra battery; Pro capsule with four zones; separate charger; ceramic bowl; trial set of disposable capsules (several pieces); hose, mouthpiece and connector set.',
    shipping: 'Manufacturing takes 4 months from your initial payment; this is not door-to-door delivery time. We notify you when your UNO is complete and inspected. Shipment follows receipt of the final payment. The route, shipping cost and expected delivery date for your country are confirmed individually before dispatch. Payment is not offered for India (IN), Thailand (TH), Turkey (TR) or Qatar (QA). We will contact you about delivery options.',
    tracking: 'After your initial payment, you receive an order confirmation and order number by email. We email you when your UNO is ready. After your final payment, we ship your order and email your tracking number. Your personal account is coming soon. Basic operation starts from the device screen without a phone. This describes the planned order process; the Beta preview does not send orders or emails.',
  },
  ru: {
    preorder: 'Выберите PRO или GOLD. Первый платёж засчитывается в стоимость устройства. Изготовление занимает 4 месяца. После уведомления о готовности остаток оплачивается в течение 10 календарных дней; напоминание даёт ещё 5 дней. Доставка, налоги и пошлины оплачиваются отдельно. При добровольной отмене возврат первоначального платежа: 100 % до начала производства, 50 % после его начала. Форма Beta — только предпросмотр: заявки не отправляются, оплата не принимается.',
    set: 'В комплекте: UNO, колба с подсветкой, одна батарея, зарядное устройство, многоразовая капсула для самостоятельной заправки, шланг, мундштук и коннектор, щётки и пинцет, запасная керамическая чашка, пять мембранных клапанов, инструкция и фирменная упаковка. PRO: карбоновый мундштук, чёрный шланг, тонированная колба. GOLD: титановый мундштук, белый шланг, прозрачная колба. Отдельно по согласованию: дополнительная батарея; капсула Pro с четырьмя зонами; отдельное зарядное; керамическая чашка; пробный набор одноразовых капсул (несколько штук); комплект шланг, мундштук и коннектор.',
    shipping: 'Изготовление занимает 4 месяца с первого платежа — это не срок доставки до двери. Мы сообщим, когда UNO будет готов и проверен. Отправка после окончательной оплаты. Маршрут, стоимость и ожидаемая дата доставки согласовываются для вашей страны отдельно. Для Индии (IN), Таиланда (TH), Турции (TR) и Катара (QA) оплата не предлагается. Мы свяжемся с вами по поводу вариантов доставки.',
    tracking: 'После первого платежа вы получаете подтверждение и номер заказа по почте. Мы сообщим о готовности UNO. После окончательной оплаты отправим заказ и трек-номер. Личный кабинет появится позже. Основные функции запускаются с экрана устройства без телефона. Это описание планируемого процесса: предпросмотр Beta не отправляет заявки или письма.',
  },
};
export function preorderFaqAnswer(id: string, locale: Locale) {
  const copy = answers[locale === 'ru' ? 'ru' : 'en'];
  if (!(id in copy)) throw new Error(`Unmapped preorder FAQ: ${id}`);
  return copy[id as keyof typeof copy];
}
