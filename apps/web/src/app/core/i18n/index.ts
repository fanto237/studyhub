import { de } from './de';
import { en } from './en';
import { fr } from './fr';
import { type TranslationSchema } from './schema';

export type SupportedLanguage = 'fr' | 'en' | 'de';
export type SupportedLocale = 'fr' | 'en-US' | 'de-DE';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'de'] as const;

export const TRANSLATIONS = {
  fr,
  en,
  de,
} as const satisfies Record<SupportedLanguage, TranslationSchema>;

export type { TranslationSchema };
