import { test, expect } from '@playwright/test';
import { parseLaunchRequest } from '../../lib/launch-request';
import { composeLaunchMail, launchContactKey, sendLaunchMail } from '../../lib/launch-mail';

const updates = { intent: 'updates', name: 'Test Visitor', email: 'visitor@example.test', phone: '', emailOptIn: true, source: 'hero-reserve', website: '' };
test.beforeEach(({}, info) => { test.skip(info.project.name !== 'desktop-chromium', 'Server-only checks run once, independent of browser engine.'); });

test('server validates purpose and prevents unrequested contacts and header injection', () => {
  expect(parseLaunchRequest(updates)).toMatchObject({ emailOptIn: true, source: 'hero-reserve' });
  expect(parseLaunchRequest({ ...updates, emailOptIn: false })).toBeNull();
  expect(parseLaunchRequest({ ...updates, source: 'hero-reserve\r\nBcc: injected@example.test' })).toBeNull();
  expect(parseLaunchRequest({ ...updates, name: 'Test\r\nInjected' })).toBeNull();
  expect(parseLaunchRequest({ ...updates, email: 'visitor@example.test,injected.example' })).toBeNull();
  expect(parseLaunchRequest({ ...updates, website: 'bot-filled' })).toBeNull();
  expect(parseLaunchRequest({ ...updates, intent: 'callback', phone: '+44 7700 900123', emailOptIn: false })).toBeNull();
  expect(parseLaunchRequest({ ...updates, intent: 'callback', phone: '+44 7700 900123', email: '', emailOptIn: false })).toMatchObject({ phone: '+447700900123', email: '', emailOptIn: false });
});

test('mail source and purpose are obvious; recipient is fixed and submitted data stays in plain text', async () => {
  const lead = parseLaunchRequest(updates)!;
  const key = launchContactKey(lead, 'synthetic-test-key-not-a-credential');
  expect(key).not.toContain('visitor');
  expect(launchContactKey({ ...lead, source: 'final-create' }, 'synthetic-test-key-not-a-credential')).toBe(key);
  expect(launchContactKey({ ...lead, email: 'visitor@EXAMPLE.TEST' }, 'synthetic-test-key-not-a-credential')).toBe(key);
  expect(launchContactKey({ ...lead, email: 'Visitor@example.test' }, 'synthetic-test-key-not-a-credential')).not.toBe(key);
  const message = composeLaunchMail(lead, key);
  expect(message.to).toBe('support@ramsider.com');
  expect(message.replyTo).toEqual({ address: 'visitor@example.test' });
  expect(message.subject).toBe('[RAMSIDER Website · Reserve Now] Launch Updates');
  expect(message.html).toBeUndefined();
  expect(message.text).toContain('Email Marketing Permission: YES — explicitly requested');
  const callback = parseLaunchRequest({ ...updates, intent: 'callback', phone: '+44 7700 900123', email: '', emailOptIn: false, source: 'set-explore' })!;
  const callMail = composeLaunchMail(callback, key);
  expect(callMail.subject).toBe('[RAMSIDER Website · Explore the Set] Callback Request');
  expect(callMail.replyTo).toBeUndefined();
  expect(callMail.text).toContain('NO — do not subscribe');
  let accepted = false;
  await sendLaunchMail(lead, key, 'synthetic-unused-test-value', async options => {
    expect(options.to).toBe('support@ramsider.com'); accepted = true;
    return { accepted: ['support@ramsider.com'] };
  });
  expect(accepted).toBe(true);
  await sendLaunchMail(lead, key, 'synthetic-unused-test-value', async () => ({ accepted: [{ address: 'support@ramsider.com' }] }));
  await expect(sendLaunchMail(lead, key, 'synthetic-unused-test-value', async () => ({ accepted: [] }))).rejects.toThrow('Recipient not accepted');
});

test('unconfigured live route fails closed without pretending to send mail', async ({ request }) => {
  const result = await request.post('/api/launch-list', { data: updates });
  expect(result.status()).toBe(503);
  expect(await result.json()).toEqual({ accepted: false, confirmationRequired: false });
});
