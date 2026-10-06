/** Coordinates match the lettering in the 941 × 1672 photograph masters. */
export function TechnologyTitle({ descriptor }: { descriptor: string }) {
  return <h2 id="technology-viewer-title" className="technology-viewer__title">
    <span className="technology-viewer__sr-only">HeatCore {descriptor}</span>
    <svg viewBox="0 0 941 1672" preserveAspectRatio="none" aria-hidden="true">
      <text x="46" y="209" fontSize="112" textLength="446" lengthAdjust="spacingAndGlyphs" fill="#000">HeatCore</text>
      <text x="54" y="267" fontSize="31" textLength={descriptor === 'Technology' ? 161 : undefined} lengthAdjust="spacingAndGlyphs" fill="#975f41">{descriptor}</text>
    </svg>
  </h2>;
}
