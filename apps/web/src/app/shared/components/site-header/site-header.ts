import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../icon/icon';
import { LanguageSelector } from '../language-selector/language-selector';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-site-header',
  imports: [Icon, LanguageSelector, RouterLink, ThemeToggle, TranslatePipe],
  templateUrl: './site-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  readonly homeLink = input('/');
}
