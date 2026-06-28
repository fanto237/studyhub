import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TranslationService } from '../../core/services/translation';
import { Icon } from '../../shared/components/icon/icon';
import { SiteHeader } from '../../shared/components/site-header/site-header';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type LegalDocumentKey = 'terms' | 'privacy';

@Component({
  selector: 'app-legal-page',
  imports: [Icon, RouterLink, SiteHeader, TranslatePipe],
  templateUrl: './legal-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);
  private readonly translations = inject(TranslationService);
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  readonly documentKey = computed<LegalDocumentKey>(() =>
    this.resolveDocumentKey(this.routeData()['legalDocument']),
  );

  readonly document = computed(
    () => this.translations.t().routes[this.documentKey()],
  );

  readonly alternateDocumentKey = computed<LegalDocumentKey>(() =>
    this.documentKey() === 'terms' ? 'privacy' : 'terms',
  );

  readonly alternateDocument = computed(
    () => this.translations.t().routes[this.alternateDocumentKey()],
  );

  readonly alternateRoute = computed(() =>
    this.alternateDocumentKey() === 'privacy' ? '/policy' : '/terms',
  );

  private resolveDocumentKey(value: unknown): LegalDocumentKey {
    return value === 'privacy' ? 'privacy' : 'terms';
  }
}
