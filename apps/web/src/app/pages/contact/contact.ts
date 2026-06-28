import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../core/services/translation';
import { Icon } from '../../shared/components/icon/icon';
import { SiteHeader } from '../../shared/components/site-header/site-header';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type ContactFormControls = {
  name: FormControl<string>;
  email: FormControl<string>;
  subject: FormControl<string>;
  message: FormControl<string>;
};

type ContactControlName = keyof ContactFormControls;

type ContactFormValue = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const CONTACT_EMAIL = 'lucien@fanto.dev';
const SUBJECT_PREFIX = '[StudyHub] ';

@Component({
  selector: 'app-contact',
  imports: [
    Icon,
    ReactiveFormsModule,
    RouterLink,
    SiteHeader,
    TranslatePipe,
  ],
  templateUrl: './contact.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(TranslationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly contactEmail = CONTACT_EMAIL;
  readonly directMailLink = `mailto:${CONTACT_EMAIL}`;
  readonly openedMailClient = signal(false);

  readonly contactForm: FormGroup<ContactFormControls> =
    this.fb.nonNullable.group({
      name: ['', [Validators.maxLength(120)]],
      email: ['', [Validators.email, Validators.maxLength(320)]],
      subject: ['', [Validators.required, Validators.maxLength(140)]],
      message: ['', [Validators.required, Validators.maxLength(2000)]],
    });

  isInvalid(controlName: ContactControlName): boolean {
    const control = this.contactForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  fieldError(controlName: ContactControlName): string | null {
    const control = this.contactForm.controls[controlName];

    if (!this.isInvalid(controlName)) {
      return null;
    }

    if (control.hasError('required')) {
      return this.i18n.translate('validation.required');
    }

    if (control.hasError('email')) {
      return this.i18n.translate('validation.email');
    }

    if (control.hasError('maxlength')) {
      return this.i18n.translate('validation.tooLong');
    }

    return this.i18n.translate('validation.checkField');
  }

  onSubmit(): void {
    this.openedMailClient.set(false);

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const mailtoHref = this.buildMailtoHref(this.contactForm.getRawValue());
    this.openedMailClient.set(true);

    if (this.isBrowser) {
      window.location.href = mailtoHref;
    }
  }

  private buildMailtoHref(value: ContactFormValue): string {
    const subjectText = value.subject.trim();
    const subject = subjectText.startsWith(SUBJECT_PREFIX)
      ? subjectText
      : `${SUBJECT_PREFIX}${subjectText}`;
    const notProvided = this.i18n.translate('routes.contact.mail.notProvided');
    const body = [
      this.i18n.translate('routes.contact.mail.intro'),
      '',
      value.message.trim(),
      '',
      '---',
      `${this.i18n.translate('routes.contact.mail.name')}: ${value.name.trim() || notProvided}`,
      `${this.i18n.translate('routes.contact.mail.email')}: ${value.email.trim() || notProvided}`,
      this.i18n.translate('routes.contact.mail.sentFrom'),
    ].join('\n');

    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}
