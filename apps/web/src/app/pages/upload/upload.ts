import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
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
import { Router, RouterLink } from '@angular/router';

import { AuthSessionStore } from '../../core/services/auth-session-store';
import { PostsApi } from '../../core/services/posts-api';
import { resolveApiErrorMessage } from '../../core/types/api-error.util';
import { Icon } from '../../shared/components/icon/icon';
import { MobileDock } from '../../shared/components/mobile-dock/mobile-dock';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

type UploadFormControls = {
  title: FormControl<string>;
  description: FormControl<string>;
};

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_TITLE_LENGTH = 256;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_TAG_COUNT = 20;
const MAX_TAG_LENGTH = 100;

@Component({
  selector: 'app-upload',
  imports: [Icon, MobileDock, ReactiveFormsModule, RouterLink, ThemeToggle],
  templateUrl: './upload.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Upload implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly postsApi = inject(PostsApi);
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionStore);

  private successRedirectTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  readonly maxFileSizeMb = MAX_FILE_SIZE_BYTES / (1024 * 1024);
  readonly maxTitleLength = MAX_TITLE_LENGTH;
  readonly maxDescriptionLength = MAX_DESCRIPTION_LENGTH;
  readonly maxTagCount = MAX_TAG_COUNT;
  readonly maxTagLength = MAX_TAG_LENGTH;

  readonly uploadForm: FormGroup<UploadFormControls> = this.fb.nonNullable.group(
    {
      title: ['', [Validators.required, Validators.maxLength(MAX_TITLE_LENGTH)]],
      description: ['', [Validators.maxLength(MAX_DESCRIPTION_LENGTH)]],
    },
  );

  readonly tagControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(MAX_TAG_LENGTH)],
  });

  readonly fileControl = new FormControl<File | null>(null, {
    validators: [Validators.required],
  });

  readonly selectedTags = signal<string[]>([]);
  readonly selectedFile = signal<File | null>(null);
  readonly isDragOver = signal(false);
  readonly isUploading = signal(false);
  readonly uploadErrorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly tagErrorMessage = signal<string | null>(null);
  readonly fileErrorMessage = signal<string | null>(null);

  readonly selectedFileSize = computed(() => {
    const file = this.selectedFile();
    return file ? this.formatFileSize(file.size) : null;
  });

  ngOnDestroy(): void {
    this.clearSuccessRedirectTimer();
  }

  titleError(): string | null {
    const control = this.uploadForm.controls.title;

    if (!(control.invalid && (control.dirty || control.touched))) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Add a title for this PDF.';
    }

    if (control.hasError('maxlength')) {
      return `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`;
    }

    return 'Please check the title.';
  }

  descriptionError(): string | null {
    const control = this.uploadForm.controls.description;

    if (!(control.invalid && (control.dirty || control.touched))) {
      return null;
    }

    if (control.hasError('maxlength')) {
      return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
    }

    return 'Please check the description.';
  }

  tagInputError(): string | null {
    if (this.tagControl.invalid && (this.tagControl.dirty || this.tagControl.touched)) {
      return `Tags must be ${MAX_TAG_LENGTH} characters or fewer.`;
    }

    return this.tagErrorMessage();
  }

  fileError(): string | null {
    if (this.fileErrorMessage()) {
      return this.fileErrorMessage();
    }

    if (this.fileControl.hasError('required') && this.fileControl.touched) {
      return 'Choose a PDF file to upload.';
    }

    return null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isUploading()) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.isUploading()) {
      return;
    }

    const file = event.dataTransfer?.files?.item(0) ?? null;
    this.selectFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectFile(input.files?.item(0) ?? null);
  }

  removeSelectedFile(): void {
    this.selectedFile.set(null);
    this.fileControl.setValue(null);
    this.fileControl.markAsTouched();
    this.fileControl.setErrors({ required: true });
    this.fileErrorMessage.set(null);

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ',') {
      return;
    }

    event.preventDefault();
    this.addTagFromInput();
  }

  onTagInput(): void {
    const value = this.tagControl.value;
    if (!value.includes(',')) {
      return;
    }

    const parts = value.split(',');
    const remainder = parts.pop() ?? '';
    this.addTags(parts, false);
    this.tagControl.setValue(remainder.trimStart());
  }

  addTagFromInput(): void {
    const value = this.tagControl.value;
    this.addTags([value], true);
  }

  removeTag(tag: string): void {
    const normalizedLower = tag.trim().toLowerCase();
    this.selectedTags.update((tags) =>
      tags.filter((selectedTag) => selectedTag.toLowerCase() !== normalizedLower),
    );
    this.tagErrorMessage.set(null);
  }

  resetForm(): void {
    if (this.isUploading()) {
      return;
    }

    this.uploadForm.reset({ title: '', description: '' });
    this.tagControl.reset('');
    this.selectedTags.set([]);
    this.removeSelectedFile();
    this.fileControl.markAsUntouched();
    this.uploadErrorMessage.set(null);
    this.successMessage.set(null);
    this.tagErrorMessage.set(null);
  }

  onSubmit(): void {
    this.uploadErrorMessage.set(null);
    this.successMessage.set(null);
    this.addTagFromInput();

    if (this.tagControl.invalid || this.tagErrorMessage()) {
      this.tagControl.markAsTouched();
      return;
    }

    if (this.uploadForm.invalid || this.fileControl.invalid) {
      this.uploadForm.markAllAsTouched();
      this.fileControl.markAsTouched();
      return;
    }

    const file = this.selectedFile();
    if (!file) {
      this.fileControl.markAsTouched();
      this.fileControl.setErrors({ required: true });
      return;
    }

    this.isUploading.set(true);

    const formValue = this.uploadForm.getRawValue();
    const description = formValue.description.trim();

    this.postsApi
      .createPost({
        file,
        title: formValue.title.trim(),
        description: description.length > 0 ? description : null,
        tags: this.selectedTags(),
      })
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message || 'Your PDF was uploaded.');
          this.successRedirectTimer = setTimeout(() => {
            void this.router.navigate(['/posts', response.id]);
          }, 650);
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            return;
          }

          this.uploadErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage: 'The PDF could not be uploaded. Please try again.',
              statusMessages: {
                413: `PDF files must be ${this.maxFileSizeMb} MB or smaller.`,
              },
            }),
          );
          this.isUploading.set(false);
        },
        complete: () => {
          this.isUploading.set(false);
        },
      });
  }

  private selectFile(file: File | null): void {
    this.fileControl.markAsTouched();
    this.fileErrorMessage.set(null);
    this.uploadErrorMessage.set(null);

    if (!file) {
      this.selectedFile.set(null);
      this.fileControl.setValue(null);
      this.fileControl.setErrors({ required: true });
      return;
    }

    const validationError = this.validateFile(file);
    if (validationError) {
      this.selectedFile.set(null);
      this.fileControl.setValue(null);
      this.fileControl.setErrors({ invalidFile: true });
      this.fileErrorMessage.set(validationError);
      return;
    }

    this.selectedFile.set(file);
    this.fileControl.setValue(file);
    this.fileControl.setErrors(null);
  }

  private validateFile(file: File): string | null {
    if (file.size === 0) {
      return 'The selected PDF file cannot be empty.';
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `PDF files must be ${this.maxFileSizeMb} MB or smaller.`;
    }

    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    const hasPdfType = file.type === 'application/pdf';

    if (!hasPdfExtension && !hasPdfType) {
      return 'Choose a PDF file with a .pdf extension.';
    }

    return null;
  }

  private addTags(values: string[], clearInput: boolean): void {
    this.tagErrorMessage.set(null);

    const nextTags = [...this.selectedTags()];

    for (const value of values) {
      const tag = value.trim().replace(/\s+/g, ' ');

      if (!tag) {
        continue;
      }

      if (tag.length > MAX_TAG_LENGTH) {
        this.tagErrorMessage.set(`Tags must be ${MAX_TAG_LENGTH} characters or fewer.`);
        break;
      }

      if (nextTags.length >= MAX_TAG_COUNT) {
        this.tagErrorMessage.set(`Add at most ${MAX_TAG_COUNT} tags.`);
        break;
      }

      const normalizedLower = tag.toLowerCase();
      if (nextTags.some((selectedTag) => selectedTag.toLowerCase() === normalizedLower)) {
        this.tagErrorMessage.set(`“${tag}” is already added.`);
        continue;
      }

      nextTags.push(tag);
    }

    this.selectedTags.set(nextTags);

    if (clearInput && !this.tagErrorMessage()) {
      this.tagControl.setValue('');
      this.tagControl.markAsPristine();
      this.tagControl.markAsUntouched();
    }
  }

  private redirectToLoginIfUnauthorized(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
      return false;
    }

    this.authSession.clearLocalSession();
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/upload' },
    });
    return true;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${Math.max(bytes / 1024, 1).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private clearSuccessRedirectTimer(): void {
    if (this.successRedirectTimer) {
      clearTimeout(this.successRedirectTimer);
      this.successRedirectTimer = null;
    }
  }
}
