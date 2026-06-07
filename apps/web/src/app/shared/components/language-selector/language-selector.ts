import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { type SupportedLanguage } from '../../../core/i18n';
import { TranslationService } from '../../../core/services/translation';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-selector',
  imports: [TranslatePipe],
  templateUrl: './language-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelector {
  readonly translations = inject(TranslationService);
  readonly languageOptions = this.translations.languageOptions;
  readonly activeLanguage = this.translations.activeLanguage;

  setLanguage(language: string): void {
    this.translations.setLanguage(language as SupportedLanguage);
  }
}
