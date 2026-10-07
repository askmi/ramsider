/** Coordinates match the lettering in the 941 × 1672 photograph masters. */
export function TechnologyTitle({ descriptor, brand = 'HeatCore' }: { descriptor: string; brand?: 'HeatCore' | 'CyberMind' }) {
  return <h2 id="technology-viewer-title" className="technology-viewer__title">
    <span className="technology-viewer__sr-only">{brand} {descriptor}</span>
    <svg viewBox="0 0 941 1672" preserveAspectRatio="none" aria-hidden="true">
      <text x="46" y="209" fontSize="112" textLength={brand === 'HeatCore' ? 446 : 500} lengthAdjust="spacingAndGlyphs" fill="#000">{brand}</text>
      <text x="54" y="267" fontSize="31" textLength={descriptor === 'Technology' ? 161 : undefined} lengthAdjust="spacingAndGlyphs" fill="#975f41" stroke={brand === 'CyberMind' ? '#fff' : undefined} strokeWidth={brand === 'CyberMind' ? 1.5 : undefined} paintOrder={brand === 'CyberMind' ? 'stroke fill' : undefined}>{descriptor}</text>
    </svg>
  </h2>;
}
