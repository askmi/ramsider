export const launchSources = {
  'hero-reserve': 'Reserve Now',
  'order-create': 'Order Section',
  'final-create': 'Final Section',
  'set-explore': 'Explore the Set',
  'launch-floating': 'UNO Launch',
} as const;

export type LaunchRequest = {
  intent: 'updates' | 'callback';
  name: string;
  email: string;
  phone: string;
  emailOptIn: boolean;
  source: keyof typeof launchSources;
};

/** Conservative format validation; no claim to verify contact ownership or deliverability. */
export function parseLaunchRequest(value: unknown): LaunchRequest | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (input.intent !== 'updates' && input.intent !== 'callback') return null;
  if (typeof input.name !== 'string' || input.name.length > 80 || /[\u0000-\u001f\u007f]/.test(input.name)) return null;
  if (typeof input.email !== 'string' || input.email.length > 254 || typeof input.phone !== 'string' || input.phone.length > 32) return null;
  if (typeof input.emailOptIn !== 'boolean' || typeof input.source !== 'string' || !Object.hasOwn(launchSources, input.source)) return null;
  if (input.website !== '') return null;
  const email = input.email.trim();
  const phone = input.phone.replace(/[\s()-]/g, '');
  const emailValid = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) && !/[\u0000-\u001f\u007f,;:()[\]"\\]/.test(email);
  if (input.intent === 'updates' && (!input.emailOptIn || !emailValid || phone !== '')) return null;
  if (input.intent === 'callback' && (!/^\+[1-9]\d{7,14}$/.test(phone) || (input.emailOptIn ? !emailValid : email !== ''))) return null;
  return { intent: input.intent, name: input.name.trim(), email, phone, emailOptIn: input.emailOptIn, source: input.source as keyof typeof launchSources };
}
