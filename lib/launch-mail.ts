/** Server-only SMTP adapter, imported by the API route; never import into client components. */
import nodemailer, { type SendMailOptions } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { createHmac } from 'node:crypto';
import { launchSources, type LaunchRequest } from './launch-request';
import { launchCopy } from './launch-copy';

export const launchRecipient = 'support@ramsider.com';
export const launchConsentVersion = 'uno-launch-2026-10-31-v1';
export type MailSender = (message: SendMailOptions) => Promise<{ accepted: readonly (string | { address: string })[] }>;

export function launchContactKey(lead: LaunchRequest, secret: string): string {
  const at = lead.email.lastIndexOf('@');
  const email = at < 0 ? lead.email : `${lead.email.slice(0, at)}@${lead.email.slice(at + 1).toLowerCase()}`;
  return createHmac('sha256', secret).update(JSON.stringify([
    'uno-launch-2026', lead.intent, email, lead.phone, lead.emailOptIn,
  ])).digest('hex');
}

export function composeLaunchMail(lead: LaunchRequest, key: string): SendMailOptions {
  const purpose = lead.intent === 'updates' ? 'Launch Updates' : lead.emailOptIn ? 'Callback + Launch Updates' : 'Callback Request';
  return {
    from: { name: 'RAMSIDER Website', address: launchRecipient },
    to: launchRecipient,
    ...(lead.email ? { replyTo: { address: lead.email } } : {}),
    subject: `[RAMSIDER Website · ${launchSources[lead.source]}] ${purpose}`,
    messageId: `<uno-launch.${key}@ramsider.com>`,
    text: [
      'RAMSIDER UNO — Website Enquiry', '',
      `Purpose: ${purpose}`, `Source: ${launchSources[lead.source]}`, `Source ID: ${lead.source}`,
      `Received: ${new Date().toISOString()}`, `Request Reference: ${key}`, '',
      `Name: ${lead.name || 'Not provided'}`, `Phone: ${lead.phone || 'Not provided'}`, `Email: ${lead.email || 'Not provided'}`, '',
      `Requested Callback: ${lead.intent === 'callback' ? 'YES' : 'NO'}`,
      `Email Marketing Permission: ${lead.emailOptIn ? 'YES — explicitly requested' : 'NO — do not subscribe'}`,
      `Permission Version: ${launchConsentVersion}`,
      ...(lead.emailOptIn ? [`Permission Text: ${lead.intent === 'updates' ? launchCopy.emailPermission : launchCopy.emailOptIn}`] : []), '',
      'No order, payment, discount or stock reservation has been created.',
    ].join('\n'),
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

export async function sendLaunchMail(lead: LaunchRequest, key: string, password: string, sender?: MailSender): Promise<void> {
  const send = sender ?? (async (message: SendMailOptions) => {
    const options: SMTPTransport.Options = {
      host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true,
      auth: { user: launchRecipient, pass: password },
      connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000,
      logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
    };
    const transport = nodemailer.createTransport(options);
    const result = await transport.sendMail(message);
    return { accepted: result.accepted };
  });
  const result = await send(composeLaunchMail(lead, key));
  if (!result.accepted.some(address => (typeof address === 'string' ? address : address.address).toLowerCase() === launchRecipient)) throw Object.assign(new Error('Recipient not accepted'), { code: 'EENVELOPE' });
}
