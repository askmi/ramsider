/** Validated against actual PDF contents; see docs/certificates.md. */
export const certificates = {
  electrical: { href: '/certificates/electrical-safety.pdf', pages: 1, rotation: 0 },
  emc: { href: '/certificates/emc.pdf', pages: 1, rotation: 0 },
  uae: { href: '/certificates/uae-conformity.pdf', pages: 3, rotation: 0 },
  rohs: { href: '/certificates/rohs.pdf', pages: 3, rotation: 0 },
  telecom: { href: '/certificates/uae-telecom.pdf', pages: 4, rotation: 0 },
  all: { href: '/certificates/all-certificates.pdf', pages: 15, rotation: 0, pageRotations: {1:270} },
} as const;
export type CertificateId = keyof typeof certificates;
