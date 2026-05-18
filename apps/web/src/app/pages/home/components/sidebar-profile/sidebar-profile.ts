import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { type CurrentUserResponse } from '../../../../core/types/users.models';

type InitialsSource = Pick<CurrentUserResponse, 'fullName' | 'username'>;

@Component({
  selector: 'app-sidebar-profile',
  imports: [DecimalPipe],
  templateUrl: './sidebar-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarProfile {
  readonly loading = input(false);
  readonly user = input<CurrentUserResponse | null>(null);

  initials(source: InitialsSource): string {
    const fallback = source.username || 'SH';
    const parts = (source.fullName || fallback)
      .split(/\s+/)
      .filter((part) => part.length > 0);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return fallback.slice(0, 2).toUpperCase();
  }

  formatRole(role: number | string): string {
    if (typeof role === 'string') {
      return role;
    }

    if (role === 1) {
      return 'Admin';
    }

    if (role === 2) {
      return 'Moderator';
    }

    return 'Student';
  }
}
