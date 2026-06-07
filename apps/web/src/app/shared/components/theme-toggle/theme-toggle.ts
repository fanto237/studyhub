import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';

import { ThemeService } from '../../../core/services/theme';
import { TranslationService } from '../../../core/services/translation';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-theme-toggle',
  imports: [Icon],
  templateUrl: './theme-toggle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);
  private readonly translations = inject(TranslationService);

  readonly activeTheme = this.themeService.theme;
  readonly label = computed(() =>
    this.translations.translate(
      this.activeTheme() === 'dark'
        ? 'shared.themeToggle.toStudyHub'
        : 'shared.themeToggle.toDark',
    ),
  );

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
