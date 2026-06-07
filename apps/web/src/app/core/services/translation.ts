import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  type SupportedLanguage,
  type SupportedLocale,
} from '../i18n';

const LANGUAGE_STORAGE_KEY = 'studyhub.language';

type InterpolationValues = Record<
  string,
  string | number | boolean | null | undefined
>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly currentLanguageSignal = signal<SupportedLanguage>(
    this.resolveInitialLanguage(),
  );

  readonly availableLanguages = SUPPORTED_LANGUAGES.map((code) => ({
    code,
    label: TRANSLATIONS[code].language.label,
    locale: TRANSLATIONS[code].language.locale as SupportedLocale,
  }));

  readonly currentLanguage = this.currentLanguageSignal.asReadonly();
  readonly language = this.currentLanguage;
  readonly t = computed(() => TRANSLATIONS[this.currentLanguageSignal()]);
  readonly locale = computed<SupportedLocale>(
    () => this.t().language.locale as SupportedLocale,
  );

  // Compatibility aliases kept while templates and shared components migrate.
  readonly activeLanguage = this.currentLanguage;
  readonly dictionary = this.t;
  readonly languageOptions = this.availableLanguages;

  constructor() {
    effect(() => {
      const language = this.currentLanguageSignal();
      this.document.documentElement.setAttribute('lang', language);

      if (this.isBrowser) {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      }
    });
  }

  setLanguage(language: SupportedLanguage | string): void {
    if (this.isSupportedLanguage(language)) {
      this.currentLanguageSignal.set(language);
    }
  }

  getTranslation(key: string, values?: InterpolationValues): string {
    const resolved = this.stringifyTranslationValue(
      this.resolvePath(this.t(), key),
    );
    const text = resolved ?? key;

    if (!values) {
      return text;
    }

    return Object.entries(values).reduce(
      (current, [name, value]) =>
        current.split(`{${name}}`).join(String(value ?? '')),
      text,
    );
  }

  translate(key: string, values?: InterpolationValues): string {
    return this.getTranslation(key, values);
  }

  private resolveInitialLanguage(): SupportedLanguage {
    if (!this.isBrowser) {
      return DEFAULT_LANGUAGE;
    }

    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (this.isSupportedLanguage(storedLanguage)) {
      return storedLanguage;
    }

    const browserLanguage = window.navigator.language.slice(0, 2).toLowerCase();
    if (this.isSupportedLanguage(browserLanguage)) {
      return browserLanguage;
    }

    return DEFAULT_LANGUAGE;
  }

  private isSupportedLanguage(language: unknown): language is SupportedLanguage {
    return (
      typeof language === 'string' &&
      SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
    );
  }

  private resolvePath(source: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((current, part) => {
      if (Array.isArray(current) && /^\d+$/.test(part)) {
        return current[Number(part)] ?? null;
      }

      if (current && typeof current === 'object' && part in current) {
        return (current as Record<string, unknown>)[part];
      }

      return null;
    }, source);
  }

  private stringifyTranslationValue(value: unknown): string | null {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }

    return null;
  }
}
