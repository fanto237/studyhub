import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../shared/components/icon/icon';
import { SiteHeader } from '../../shared/components/site-header/site-header';

@Component({
  selector: 'app-landing',
  imports: [Icon, RouterLink, SiteHeader],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {}
