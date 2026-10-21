import type { Locale } from './i18n';

/** Official company facts supplied by the owner on 2026-10-21. */
export const company = {
  name: 'RAMSIDER SMOKING & TOBACCO HEATING DEVICES TRADING CO. L.L.C',
  licence: 'License No. 1050925',
  address: 'Office No. D-28, Mohamed Hashem Alawi Al Saf Building, Al Murar, Dubai, UAE.',
  email: 'support@ramsider.com',
  emailHref: 'mailto:support@ramsider.com',
  partnersEmail: 'partners@ramsider.com',
  partnersEmailHref: 'mailto:partners@ramsider.com',
  instagram: 'https://instagram.com/ramsider_official',
  youtube: 'https://youtube.com/@ramsider_official',
} as const;

type CompanyCopy = {
  company: string;
  contact: string;
  channels: string;
  support: string;
  business: string;
};

export const companyCopy: Record<Locale, CompanyCopy> = {
  en: { company: 'Company', contact: 'Contact', channels: 'Official Channels', support: 'For support, email', business: 'For business enquiries, email' },
  ru: { company: 'Компания', contact: 'Контакты', channels: 'Официальные каналы', support: 'По вопросам поддержки пишите на', business: 'По вопросам сотрудничества пишите на' },
  de: { company: 'Unternehmen', contact: 'Kontakt', channels: 'Offizielle Kanäle', support: 'Für Unterstützung schreiben Sie an', business: 'Für geschäftliche Anfragen schreiben Sie an' },
  fr: { company: 'Société', contact: 'Contact', channels: 'Canaux officiels', support: 'Pour toute assistance, écrivez à', business: 'Pour les demandes professionnelles, écrivez à' },
  es: { company: 'Empresa', contact: 'Contacto', channels: 'Canales oficiales', support: 'Para recibir asistencia, escriba a', business: 'Para consultas comerciales, escriba a' },
  it: { company: 'Società', contact: 'Contatti', channels: 'Canali ufficiali', support: 'Per assistenza, scrivi a', business: 'Per richieste commerciali, scrivi a' },
  tr: { company: 'Şirket', contact: 'İletişim', channels: 'Resmî Kanallar', support: 'Destek için e-posta adresimiz:', business: 'İş birliği için e-posta adresimiz:' },
  ar: { company: 'الشركة', contact: 'التواصل', channels: 'القنوات الرسمية', support: 'للدعم، راسلنا على', business: 'للاستفسارات التجارية، راسلنا على' },
  zh: { company: '公司', contact: '联系方式', channels: '官方频道', support: '如需支持，请发送邮件至', business: '商务咨询，请发送邮件至' },
  ja: { company: '会社情報', contact: 'お問い合わせ', channels: '公式チャンネル', support: 'サポートのお問い合わせ先：', business: '法人のお問い合わせ先：' },
  ko: { company: '회사 정보', contact: '문의', channels: '공식 채널', support: '지원 문의 이메일:', business: '비즈니스 문의 이메일:' },
};
