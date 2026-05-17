import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';

import { ThemeService } from '../../../core/theme/theme';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-theme-toggle',
  imports: [Icon],
  templateUrl: './theme-toggle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);

  readonly activeTheme = this.themeService.theme;
  readonly label = computed(() =>
    this.activeTheme() === 'dark'
      ? 'Switch to StudyHub theme'
      : 'Switch to dark theme',
  );

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
