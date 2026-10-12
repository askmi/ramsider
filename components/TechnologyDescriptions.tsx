import type { Locale } from '@/lib/i18n';
import type { TechnologyDescriptionCopy, TechnologySlideId } from '@/lib/technology-descriptions';
import {TextBlock, Divider} from './TechnologyText';
export function TechnologyDescriptions({ slide, locale, name, copy }: { slide: TechnologySlideId; locale: Locale; name: string; copy: TechnologyDescriptionCopy }) {
  const common = { locale };
  return <section className="technology-viewer__descriptions" aria-label={name} data-slide={slide}>
    <div className="technology-reading">
      {slide === '02' && <>
        <TextBlock {...common} id="headline" kind="h3" text={copy.three} />
        <TextBlock {...common} id="upper-label" kind="h4" text={copy.upper} />
        <TextBlock {...common} id="upper-temperature" text="0–280°C" />
        <TextBlock {...common} id="upper-body" text={copy.upperBody} />
        <TextBlock {...common} id="grill-label" kind="h4" text={copy.grillMode} />
        <TextBlock {...common} id="grill-body" text={copy.grillBody} />
        <TextBlock {...common} id="lower-label" kind="h4" text={copy.lower} />
        <TextBlock {...common} id="lower-temperature" text="0–160°C" />
        <TextBlock {...common} id="lower-body" text={copy.lowerBody} />
        <TextBlock {...common} id="eyebrow" text={copy.architecture} />
        <Divider />
        <TextBlock {...common} id="body" text={copy.heatersBody} />
      </>}
      {slide === '03' && <>
        <TextBlock {...common} id="eyebrow" text={copy.sails} />
        <TextBlock {...common} id="headline" kind="h3" text={copy.release} />
        <Divider />
        <TextBlock {...common} id="body" text={copy.sailsBody} />
      </>}
      {slide === '04' && <>
        <TextBlock {...common} id="eyebrow" text={copy.profiles} />
        <TextBlock {...common} id="headline" kind="h3" text={copy.power} />
        <Divider />
        <TextBlock {...common} id="body" text={copy.profilesBody} />
        <TextBlock {...common} id="workflow-create" text={copy.create} />
        <TextBlock {...common} id="workflow-control" text={copy.control} />
        <TextBlock {...common} id="workflow-refine" text={copy.refine} />

      </>}
      {slide === '05' && <>
        <TextBlock {...common} id="eyebrow" text={copy.surface} />
        <TextBlock {...common} id="headline" kind="h3" text={copy.finishes} />
        <Divider />
        <TextBlock {...common} id="body" text={copy.finishesBody} />
      </>}
    </div>
  </section>;
}
