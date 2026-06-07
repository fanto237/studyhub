import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthSessionStore } from '../../core/services/auth-session-store';
import { Icon } from '../../shared/components/icon/icon';
import { SiteHeader } from '../../shared/components/site-header/site-header';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-landing',
  imports: [
    TranslatePipe,
    Icon, RouterLink, SiteHeader],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing implements OnInit {
  readonly authSession = inject(AuthSessionStore);

  ngOnInit(): void {
    this.authSession.checkSession().subscribe();
  }
}
