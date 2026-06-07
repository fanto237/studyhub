import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Icon } from '../icon/icon';
import { type IconName } from '../icon/icon.registry';
import { TranslatePipe } from '../../pipes/translate.pipe';

type MobileDockItem = {
  readonly label: string;
  readonly route: string;
  readonly icon: IconName;
};

@Component({
  selector: 'app-mobile-dock',
  imports: [Icon, NgClass, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './mobile-dock.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDock {
  readonly items: readonly MobileDockItem[] = [
    { label: 'navigation.home', route: '/home', icon: 'home' },
    { label: 'navigation.upload', route: '/upload', icon: 'upload' },
    { label: 'navigation.profile', route: '/profile', icon: 'user' },
  ];
}
