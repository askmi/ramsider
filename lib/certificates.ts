/** Validated against actual PDF contents; see docs/certificates.md. */
export const certificates = {
  electrical: { href: '/certificates/electrical-safety.pdf' },
  emc: { href: '/certificates/emc.pdf' },
  uae: { href: '/certificates/uae-conformity.pdf' },
  rohs: { href: '/certificates/rohs.pdf' },
  telecom: { href: '/certificates/uae-telecom.pdf' },
  all: { href: '/certificates/all-certificates.pdf' },
} as const;
export type CertificateId = keyof typeof certificates;
