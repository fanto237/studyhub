import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type StudyHubTheme = 'studyhub' | 'dark';

const DEFAULT_THEME: StudyHubTheme = 'studyhub';
const THEME_STORAGE_KEY = 'studyhub.theme';
const SUPPORTED_THEMES: readonly StudyHubTheme[] = ['studyhub', 'dark'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly activeTheme = signal<StudyHubTheme>(DEFAULT_THEME);

  readonly theme = this.activeTheme.asReadonly();

  initialize(): void {
    if (!this.isBrowser) {
      return;
    }

    const theme =
      this.readStoredTheme() ?? this.readDocumentTheme() ?? DEFAULT_THEME;

    this.activeTheme.set(theme);
    this.applyTheme(theme);
  }

  setTheme(theme: StudyHubTheme): void {
    this.activeTheme.set(theme);
    this.applyTheme(theme);
    this.persistTheme(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.activeTheme() === 'dark' ? 'studyhub' : 'dark');
  }

  private applyTheme(theme: StudyHubTheme): void {
    if (!this.isBrowser) {
      return;
    }

    this.document.documentElement.setAttribute('data-theme', theme);
  }

  private readDocumentTheme(): StudyHubTheme | null {
    const theme = this.document.documentElement.getAttribute('data-theme');

    return this.toSupportedTheme(theme);
  }

  private readStoredTheme() {
    try {
      return this.toSupportedTheme(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return null;
    }
  }

  private persistTheme(theme: StudyHubTheme): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures so theme switching still works in the page.
    }
  }

  private toSupportedTheme(theme: string | null): StudyHubTheme | null {
    return SUPPORTED_THEMES.includes(theme as StudyHubTheme)
      ? (theme as StudyHubTheme)
      : null;
  }
}
