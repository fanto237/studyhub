import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { ICONS, type IconName } from '../../../core/icons/icon.registry';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  host: {
    class: 'inline-block',
    '[attr.aria-hidden]': 'ariaLabel() ? null : "true"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.role]': 'ariaLabel() ? "img" : null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly ariaLabel = input<string | null>(null);

  readonly icon = computed(() => ICONS[this.name()]);
}
