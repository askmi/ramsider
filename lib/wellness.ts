import type { Locale } from './i18n';
import en from './wellness-en.json';
import { wellnessTranslation } from './wellness-translations';

export const wellnessSections = ['hero', 'nature', 'capsules', 'ritual', 'moods'] as const;
export type WellnessCopy = Record<keyof typeof en, string>;
// The supplied English DOM text is the immutable transcription baseline.
export const wellnessCopy: Record<Locale, WellnessCopy> = { en, ru: wellnessTranslation('ru'), de: wellnessTranslation('de'), fr: wellnessTranslation('fr'), es: wellnessTranslation('es'), it: wellnessTranslation('it'), tr: wellnessTranslation('tr'), ar: wellnessTranslation('ar'), zh: wellnessTranslation('zh'), ja: wellnessTranslation('ja'), ko: wellnessTranslation('ko') };
