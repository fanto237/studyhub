import { Pipe, PipeTransform, inject } from '@angular/core';

import { TranslationService } from '../../core/services/translation';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  // transform(value: any, key: string) {
  //   throw new Error('Method not implemented.');
  //   return this.translations.getTranslation(key, values);
  // }
  private readonly translations = inject(TranslationService);

  transform(
    key: string | null | undefined,
    values?: Record<string, string | number | boolean | null | undefined>,
  ): string {
    if (!key) {
      return '';
    }

    return this.translations.getTranslation(key, values);
  }
}
