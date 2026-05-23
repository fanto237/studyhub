import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Icon } from '../icon/icon';
import { type IconName } from '../icon/icon.registry';

type MobileDockItem = {
  readonly label: string;
  readonly route: string;
  readonly icon: IconName;
};

@Component({
  selector: 'app-mobile-dock',
  imports: [Icon, NgClass, RouterLink, RouterLinkActive],
  templateUrl: './mobile-dock.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDock {
  readonly items: readonly MobileDockItem[] = [
    { label: 'Home', route: '/home', icon: 'home' },
    { label: 'Upload', route: '/upload', icon: 'upload' },
    { label: 'Profile', route: '/profile', icon: 'user' },
  ];
}
