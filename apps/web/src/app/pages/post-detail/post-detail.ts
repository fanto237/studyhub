import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AuthSessionStore } from '../../core/services/auth-session-store';
import { CommentsApi } from '../../core/services/comments-api';
import { PostsApi } from '../../core/services/posts-api';
import { resolveApiErrorMessage } from '../../core/types/api-error.util';
import {
  type GetPostResponse,
  type PostDetailComment,
  type PostDetailUser,
  type ReportPostReason,
  type VotePostResponse,
  type VoteRequestValue,
} from '../../core/types/posts.models';
import { Icon } from '../../shared/components/icon/icon';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

const MAX_COMMENT_LENGTH = 4000;
const MAX_REPORT_DETAILS_LENGTH = 2000;

type CommentFormControls = {
  text: FormControl<string>;
};

type ReportFormControls = {
  reason: FormControl<ReportPostReason>;
  details: FormControl<string>;
};

type ThreadedComment = {
  comment: PostDetailComment;
  depth: number;
};

@Component({
  selector: 'app-post-detail',
  imports: [
    DatePipe,
    DecimalPipe,
    Icon,
    ReactiveFormsModule,
    RouterLink,
    ThemeToggle,
  ],
  templateUrl: './post-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetail implements OnInit {
  private readonly authSession = inject(AuthSessionStore);
  private readonly commentsApi = inject(CommentsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly postsApi = inject(PostsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly replyForms = new Map<
    string,
    FormGroup<CommentFormControls>
  >();
  private readonly editForms = new Map<
    string,
    FormGroup<CommentFormControls>
  >();

  readonly maxCommentLength = MAX_COMMENT_LENGTH;
  readonly maxReportDetailsLength = MAX_REPORT_DETAILS_LENGTH;

  readonly reportReasons: ReadonlyArray<{
    value: ReportPostReason;
    label: string;
    description: string;
  }> = [
    {
      value: 'spam',
      label: 'Spam or scam',
      description: 'Promotional, misleading, or low-quality content.',
    },
    {
      value: 'copyright',
      label: 'Copyright issue',
      description: "The PDF appears to violate someone else's rights.",
    },
    {
      value: 'abusive',
      label: 'Abusive content',
      description: 'Harassment, hate, or unsafe material.',
    },
    {
      value: 'wrong-content',
      label: 'Wrong content',
      description: 'The title, tags, or file do not match the resource.',
    },
    {
      value: 'other',
      label: 'Other',
      description: 'Something else that moderators should review.',
    },
  ];

  readonly post = signal<GetPostResponse | null>(null);
  readonly postId = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly isRefreshingComments = signal(false);
  readonly isVoting = signal(false);
  readonly isDownloading = signal(false);
  readonly isReporting = signal(false);
  readonly isCreatingComment = signal(false);
  readonly replyingCommentId = signal<string | null>(null);
  readonly editingCommentId = signal<string | null>(null);
  readonly deletingCommentId = signal<string | null>(null);
  readonly activeReplyCommentId = signal<string | null>(null);
  readonly activeEditCommentId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly actionErrorMessage = signal<string | null>(null);
  readonly reportErrorMessage = signal<string | null>(null);
  readonly reportSuccessMessage = signal<string | null>(null);
  readonly commentErrorMessage = signal<string | null>(null);
  readonly commentSuccessMessage = signal<string | null>(null);
  readonly isNotFound = signal(false);

  readonly commentForm: FormGroup<CommentFormControls> =
    this.createCommentForm();

  readonly reportForm: FormGroup<ReportFormControls> =
    this.fb.nonNullable.group({
      reason: ['spam' as ReportPostReason, [Validators.required]],
      details: ['', [Validators.maxLength(MAX_REPORT_DETAILS_LENGTH)]],
    });

  readonly pdfUrl = computed<SafeResourceUrl | null>(() => {
    const storageUrl = this.post()?.storageUrl;
    return storageUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(storageUrl)
      : null;
  });

  readonly comments = computed(() => this.post()?.comments ?? []);

  readonly topLevelComments = computed(() => {
    const comments = this.comments();
    const ids = new Set(comments.map((comment) => comment.id));

    return comments.filter(
      (comment) =>
        !comment.parentCommentId || !ids.has(comment.parentCommentId),
    );
  });

  readonly commentsByParent = computed(() => {
    const grouped = new Map<string, PostDetailComment[]>();

    for (const comment of this.comments()) {
      if (!comment.parentCommentId) {
        continue;
      }

      const existing = grouped.get(comment.parentCommentId) ?? [];
      existing.push(comment);
      grouped.set(comment.parentCommentId, existing);
    }

    return grouped;
  });

  readonly currentUser = computed(
    () => this.authSession.currentUser() ?? this.authSession.displayUser(),
  );

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const postId = params.get('postId');
        this.postId.set(postId);

        if (!postId) {
          this.post.set(null);
          this.isLoading.set(false);
          this.isNotFound.set(true);
          this.errorMessage.set('This post link is missing an id.');
          return;
        }

        this.loadPost(postId);
      });
  }

  retry(): void {
    const postId = this.postId();
    if (postId) {
      this.loadPost(postId);
    }
  }

  votePost(vote: VoteRequestValue): void {
    const post = this.post();
    if (!post || this.isVoting()) {
      return;
    }

    this.actionErrorMessage.set(null);
    this.isVoting.set(true);

    this.postsApi.votePost(post.id, vote).subscribe({
      next: (response) => {
        this.applyVoteResponse(response);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          this.isVoting.set(false);
          return;
        }

        this.actionErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage: 'Your vote could not be saved. Please try again.',
          }),
        );
        this.isVoting.set(false);
      },
      complete: () => {
        this.isVoting.set(false);
      },
    });
  }

  downloadPost(): void {
    const post = this.post();
    if (!post || this.isDownloading()) {
      return;
    }

    this.actionErrorMessage.set(null);
    this.isDownloading.set(true);

    this.postsApi.downloadPost(post.id).subscribe({
      next: (response) => {
        this.openInNewTab(response.downloadUrl);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          this.isDownloading.set(false);
          return;
        }

        this.actionErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage:
              'The PDF download could not be prepared. Please try again.',
          }),
        );
        this.isDownloading.set(false);
      },
      complete: () => {
        this.isDownloading.set(false);
      },
    });
  }

  openPdf(): void {
    const storageUrl = this.post()?.storageUrl;
    if (storageUrl) {
      this.openInNewTab(storageUrl);
    }
  }

  reportPost(): void {
    const post = this.post();
    if (!post || this.isReporting()) {
      return;
    }

    this.reportErrorMessage.set(null);
    this.reportSuccessMessage.set(null);
    this.actionErrorMessage.set(null);

    const reason = this.reportForm.controls.reason.value;
    const detailsControl = this.reportForm.controls.details;
    const details = detailsControl.value.trim();

    if (reason === 'other' && !details) {
      detailsControl.setErrors({
        ...(detailsControl.errors ?? {}),
        required: true,
      });
      detailsControl.markAsTouched();
      return;
    }

    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    this.isReporting.set(true);

    this.postsApi
      .reportPost(post.id, {
        reason,
        details: details || null,
      })
      .subscribe({
        next: (response) => {
          this.reportSuccessMessage.set(
            response.isHidden
              ? 'Thanks. This resource has been hidden for moderator review.'
              : response.message,
          );
          this.reportForm.reset({ reason: 'spam', details: '' });
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            this.isReporting.set(false);
            return;
          }

          const message = resolveApiErrorMessage(error, {
            fallbackMessage: 'This report could not be sent. Please try again.',
            statusMessages: {
              409: 'You have already reported this resource.',
            },
          });
          this.reportErrorMessage.set(message);
          this.actionErrorMessage.set(message);
          this.isReporting.set(false);
        },
        complete: () => {
          this.isReporting.set(false);
        },
      });
  }

  onReportReasonChange(): void {
    const detailsControl = this.reportForm.controls.details;
    if (this.reportForm.controls.reason.value !== 'other') {
      detailsControl.setErrors(null);
      detailsControl.updateValueAndValidity();
    }
  }

  submitTopLevelComment(): void {
    const post = this.post();
    if (!post || this.isCreatingComment()) {
      return;
    }

    if (!this.prepareCommentForm(this.commentForm)) {
      return;
    }

    this.commentErrorMessage.set(null);
    this.commentSuccessMessage.set(null);
    this.isCreatingComment.set(true);

    this.commentsApi
      .createComment(post.id, {
        text: this.commentForm.controls.text.value.trim(),
        parentCommentId: null,
      })
      .subscribe({
        next: () => {
          this.commentForm.reset();
          this.commentSuccessMessage.set('Your comment was posted.');
          this.refreshComments(post.id);
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            this.isCreatingComment.set(false);
            return;
          }

          this.commentErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                'Your comment could not be posted. Please try again.',
            }),
          );
          this.isCreatingComment.set(false);
        },
        complete: () => {
          this.isCreatingComment.set(false);
        },
      });
  }

  startReply(comment: PostDetailComment): void {
    if (this.isDeletedComment(comment)) {
      return;
    }

    const nextId =
      this.activeReplyCommentId() === comment.id ? null : comment.id;
    this.activeReplyCommentId.set(nextId);
    this.activeEditCommentId.set(null);

    if (nextId) {
      this.replyFormFor(nextId).reset();
    }
  }

  cancelReply(commentId: string): void {
    if (this.activeReplyCommentId() === commentId) {
      this.activeReplyCommentId.set(null);
    }

    this.replyFormFor(commentId).reset();
  }

  submitReply(parentComment: PostDetailComment): void {
    const post = this.post();
    if (!post || this.replyingCommentId()) {
      return;
    }

    const form = this.replyFormFor(parentComment.id);
    if (!this.prepareCommentForm(form)) {
      return;
    }

    this.commentErrorMessage.set(null);
    this.commentSuccessMessage.set(null);
    this.replyingCommentId.set(parentComment.id);

    this.commentsApi
      .createComment(post.id, {
        text: form.controls.text.value.trim(),
        parentCommentId: parentComment.id,
      })
      .subscribe({
        next: () => {
          form.reset();
          this.activeReplyCommentId.set(null);
          this.commentSuccessMessage.set('Your reply was posted.');
          this.refreshComments(post.id);
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            this.replyingCommentId.set(null);
            return;
          }

          this.commentErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                'Your reply could not be posted. Please try again.',
            }),
          );
          this.replyingCommentId.set(null);
        },
        complete: () => {
          this.replyingCommentId.set(null);
        },
      });
  }

  startEdit(comment: PostDetailComment): void {
    if (!this.canManageComment(comment)) {
      return;
    }

    const form = this.editFormFor(comment.id);
    form.setValue({ text: comment.text });
    form.markAsPristine();
    form.markAsUntouched();
    this.activeEditCommentId.set(comment.id);
    this.activeReplyCommentId.set(null);
  }

  cancelEdit(commentId: string): void {
    if (this.activeEditCommentId() === commentId) {
      this.activeEditCommentId.set(null);
    }

    this.editFormFor(commentId).reset();
  }

  submitEdit(comment: PostDetailComment): void {
    const post = this.post();
    if (!post || this.editingCommentId()) {
      return;
    }

    const form = this.editFormFor(comment.id);
    if (!this.prepareCommentForm(form)) {
      return;
    }

    this.commentErrorMessage.set(null);
    this.commentSuccessMessage.set(null);
    this.editingCommentId.set(comment.id);

    this.commentsApi
      .updateComment(comment.id, { text: form.controls.text.value.trim() })
      .subscribe({
        next: (updatedComment) => {
          this.replaceComment(updatedComment);
          this.activeEditCommentId.set(null);
          this.commentSuccessMessage.set('Comment updated.');
          this.refreshComments(post.id);
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            this.editingCommentId.set(null);
            return;
          }

          this.commentErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                'Your comment could not be updated. Please try again.',
            }),
          );
          this.editingCommentId.set(null);
        },
        complete: () => {
          this.editingCommentId.set(null);
        },
      });
  }

  deleteComment(comment: PostDetailComment): void {
    const post = this.post();
    if (!post || this.deletingCommentId() || !this.canManageComment(comment)) {
      return;
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Delete this comment? Replies will stay visible and this comment will be shown as [deleted].',
      );
      if (!confirmed) {
        return;
      }
    }

    this.commentErrorMessage.set(null);
    this.commentSuccessMessage.set(null);
    this.deletingCommentId.set(comment.id);

    this.commentsApi.deleteComment(comment.id).subscribe({
      next: () => {
        this.markCommentDeleted(comment.id);
        this.commentSuccessMessage.set('Comment deleted.');
        this.refreshComments(post.id);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          this.deletingCommentId.set(null);
          return;
        }

        this.commentErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage:
              'This comment could not be deleted. Please try again.',
          }),
        );
        this.deletingCommentId.set(null);
      },
      complete: () => {
        this.deletingCommentId.set(null);
      },
    });
  }

  replyFormFor(commentId: string): FormGroup<CommentFormControls> {
    const existing = this.replyForms.get(commentId);
    if (existing) {
      return existing;
    }

    const form = this.createCommentForm();
    this.replyForms.set(commentId, form);
    return form;
  }

  editFormFor(commentId: string): FormGroup<CommentFormControls> {
    const existing = this.editForms.get(commentId);
    if (existing) {
      return existing;
    }

    const form = this.createCommentForm();
    this.editForms.set(commentId, form);
    return form;
  }

  threadedRepliesFor(comment: PostDetailComment): ThreadedComment[] {
    const grouped = this.commentsByParent();
    const threaded: ThreadedComment[] = [];

    const collect = (parentId: string, depth: number): void => {
      for (const child of grouped.get(parentId) ?? []) {
        threaded.push({ comment: child, depth });
        collect(child.id, Math.min(depth + 1, 4));
      }
    };

    collect(comment.id, 1);
    return threaded;
  }

  canManageComment(comment: PostDetailComment): boolean {
    if (this.isDeletedComment(comment)) {
      return false;
    }

    const user = this.currentUser();
    if (!user) {
      return false;
    }

    return user.id === comment.user.id || this.isModeratorRole(user.role);
  }

  canReplyTo(comment: PostDetailComment): boolean {
    return !this.isDeletedComment(comment);
  }

  isDeletedComment(comment: PostDetailComment): boolean {
    return comment.text === '[deleted]';
  }

  commentTextError(form: FormGroup<CommentFormControls>): string | null {
    const control = form.controls.text;

    if (!(control.invalid && (control.dirty || control.touched))) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Write a comment before posting.';
    }

    if (control.hasError('maxlength')) {
      return `Comments must be ${MAX_COMMENT_LENGTH} characters or fewer.`;
    }

    return 'Please check this comment.';
  }

  reportDetailsError(): string | null {
    const control = this.reportForm.controls.details;

    if (
      this.reportForm.controls.reason.value === 'other' &&
      control.touched &&
      !control.value.trim()
    ) {
      return 'Add a few details for other reports.';
    }

    if (!(control.invalid && (control.dirty || control.touched))) {
      return null;
    }

    if (control.hasError('maxlength')) {
      return `Report details must be ${MAX_REPORT_DETAILS_LENGTH} characters or fewer.`;
    }

    return 'Please check these details.';
  }

  formTextLength(form: FormGroup<CommentFormControls>): number {
    return form.controls.text.value.length;
  }

  initials(source: PostDetailUser): string {
    const fallback = source.username || 'SH';
    const parts = (source.fullName || fallback)
      .split(/\s+/)
      .filter((part) => part.length > 0);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return fallback.slice(0, 2).toUpperCase();
  }

  private loadPost(postId: string): void {
    this.isLoading.set(true);
    this.isNotFound.set(false);
    this.errorMessage.set(null);
    this.actionErrorMessage.set(null);
    this.commentErrorMessage.set(null);
    this.reportErrorMessage.set(null);
    this.post.set(null);

    this.postsApi.getPost(postId).subscribe({
      next: (post) => {
        this.post.set(post);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          this.isLoading.set(false);
          return;
        }

        this.isNotFound.set(
          error instanceof HttpErrorResponse && error.status === 404,
        );
        this.errorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage: 'This post could not be loaded. Please try again.',
            statusMessages: {
              404: 'This post was not found or is no longer available.',
            },
          }),
        );
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  private refreshComments(postId: string): void {
    this.isRefreshingComments.set(true);

    this.commentsApi.getPostComments(postId).subscribe({
      next: (comments) => {
        this.replaceComments(comments);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          this.isRefreshingComments.set(false);
          return;
        }

        this.commentErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage: 'The discussion could not be refreshed.',
          }),
        );
        this.isRefreshingComments.set(false);
      },
      complete: () => {
        this.isRefreshingComments.set(false);
      },
    });
  }

  private applyVoteResponse(response: VotePostResponse): void {
    this.post.update((post) => {
      if (!post || post.id !== response.postId) {
        return post;
      }

      return {
        ...post,
        upvotes: response.upvotes,
        downvotes: response.downvotes,
        score: response.score,
        currentVote: response.currentVote,
      };
    });
  }

  private replaceComments(comments: PostDetailComment[]): void {
    this.post.update((post) =>
      post
        ? {
            ...post,
            comments,
            commentCount: comments.length,
          }
        : post,
    );
  }

  private replaceComment(updatedComment: PostDetailComment): void {
    this.post.update((post) =>
      post
        ? {
            ...post,
            comments: post.comments.map((comment) =>
              comment.id === updatedComment.id ? updatedComment : comment,
            ),
          }
        : post,
    );
  }

  private markCommentDeleted(commentId: string): void {
    this.post.update((post) =>
      post
        ? {
            ...post,
            comments: post.comments.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    text: '[deleted]',
                  }
                : comment,
            ),
          }
        : post,
    );
  }

  private prepareCommentForm(form: FormGroup<CommentFormControls>): boolean {
    const control = form.controls.text;
    if (!control.value.trim()) {
      control.setErrors({ ...(control.errors ?? {}), required: true });
    }

    if (form.invalid) {
      form.markAllAsTouched();
      return false;
    }

    return true;
  }

  private createCommentForm(): FormGroup<CommentFormControls> {
    return this.fb.nonNullable.group({
      text: [
        '',
        [Validators.required, Validators.maxLength(MAX_COMMENT_LENGTH)],
      ],
    });
  }

  private redirectToLoginIfUnauthorized(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
      return false;
    }

    this.authSession.clearLocalSession();
    const returnUrl = this.postId() ? `/posts/${this.postId()}` : '/home';
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl },
    });
    return true;
  }

  private isModeratorRole(role: number | string): boolean {
    if (typeof role === 'number') {
      return role === 1 || role === 2;
    }

    const normalizedRole = role.trim().toLowerCase();
    return normalizedRole === 'admin' || normalizedRole === 'moderator';
  }

  private openInNewTab(url: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
