import {
  DatePipe,
  DecimalPipe,
  NgClass,
  NgTemplateOutlet,
} from '@angular/common';
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
import { TranslationService } from '../../core/services/translation';
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
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelector } from '../../shared/components/language-selector/language-selector';

const MAX_COMMENT_LENGTH = 4000;
const MAX_REPORT_DETAILS_LENGTH = 2000;
const MAX_VISUAL_COMMENT_DEPTH = 3;
const COMMENT_INDENT_REM = 0.75;

type CommentFormControls = {
  text: FormControl<string>;
};

type ReportFormControls = {
  reason: FormControl<ReportPostReason>;
  details: FormControl<string>;
};

type CommentThreadNode = {
  comment: PostDetailComment;
  parent: PostDetailComment | null;
  children: CommentThreadNode[];
  depth: number;
  visualDepth: number;
  replyCount: number;
};

@Component({
  selector: 'app-post-detail',
  imports: [
    LanguageSelector,
    TranslatePipe,
    DatePipe,
    DecimalPipe,
    NgClass,
    NgTemplateOutlet,
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
  readonly i18n = inject(TranslationService);

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
  readonly maxVisualCommentDepth = MAX_VISUAL_COMMENT_DEPTH;

  readonly reportReasons: ReadonlyArray<{
    value: ReportPostReason;
    label: string;
    description: string;
  }> = [
    {
      value: 'spam',
      label: 'routes.postDetail.report.reasons.spam.label',
      description: 'routes.postDetail.report.reasons.spam.description',
    },
    {
      value: 'copyright',
      label: 'routes.postDetail.report.reasons.copyright.label',
      description: 'routes.postDetail.report.reasons.copyright.description',
    },
    {
      value: 'abusive',
      label: 'routes.postDetail.report.reasons.abusive.label',
      description: 'routes.postDetail.report.reasons.abusive.description',
    },
    {
      value: 'wrong-content',
      label: 'routes.postDetail.report.reasons.wrongContent.label',
      description: 'routes.postDetail.report.reasons.wrongContent.description',
    },
    {
      value: 'other',
      label: 'routes.postDetail.report.reasons.other.label',
      description: 'routes.postDetail.report.reasons.other.description',
    },
  ];

  readonly post = signal<GetPostResponse | null>(null);
  readonly postId = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly isRefreshingComments = signal(false);
  readonly isVoting = signal(false);
  readonly isDownloading = signal(false);
  readonly isDeletingPost = signal(false);
  readonly isDeletePostModalOpen = signal(false);
  readonly isReporting = signal(false);
  readonly isCreatingComment = signal(false);
  readonly replyingCommentId = signal<string | null>(null);
  readonly editingCommentId = signal<string | null>(null);
  readonly deletingCommentId = signal<string | null>(null);
  readonly activeReplyCommentId = signal<string | null>(null);
  readonly activeEditCommentId = signal<string | null>(null);
  readonly expandedCommentIds = signal<ReadonlySet<string>>(new Set<string>());
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

  readonly commentThread = computed<CommentThreadNode[]>(() => {
    const comments = this.comments();
    const nodes = new Map<string, CommentThreadNode>();
    const roots: CommentThreadNode[] = [];

    for (const comment of comments) {
      nodes.set(comment.id, {
        comment,
        parent: null,
        children: [],
        depth: 0,
        visualDepth: 0,
        replyCount: 0,
      });
    }

    for (const comment of comments) {
      const node = nodes.get(comment.id);
      if (!node) {
        continue;
      }

      const parentNode = comment.parentCommentId
        ? nodes.get(comment.parentCommentId)
        : null;

      if (parentNode && parentNode !== node) {
        node.parent = parentNode.comment;
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const visited = new Set<string>();
    const applyDepth = (node: CommentThreadNode, depth: number): number => {
      if (visited.has(node.comment.id)) {
        return 0;
      }

      visited.add(node.comment.id);
      node.depth = depth;
      node.visualDepth = Math.min(depth, MAX_VISUAL_COMMENT_DEPTH);
      node.replyCount = node.children.reduce(
        (total, child) => total + 1 + applyDepth(child, depth + 1),
        0,
      );
      return node.replyCount;
    };

    for (const root of roots) {
      applyDepth(root, 0);
    }

    for (const node of nodes.values()) {
      if (!visited.has(node.comment.id)) {
        roots.push(node);
        applyDepth(node, 0);
      }
    }

    return roots;
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
          this.errorMessage.set(this.i18n.translate('routes.postDetail.thisPostLinkIsMissingAnId'));
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
            fallbackMessage: this.i18n.translate('errors.posts.voteSave'),
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

  openDeletePostModal(): void {
    const post = this.post();
    if (!post || !this.canManagePost(post) || this.isDeletingPost()) {
      return;
    }

    this.actionErrorMessage.set(null);
    this.isDeletePostModalOpen.set(true);
  }

  closeDeletePostModal(): void {
    if (this.isDeletingPost()) {
      return;
    }

    this.isDeletePostModalOpen.set(false);
  }

  confirmDeletePost(): void {
    const post = this.post();
    if (!post || !this.canManagePost(post) || this.isDeletingPost()) {
      return;
    }

    this.actionErrorMessage.set(null);
    this.isDeletingPost.set(true);

    this.postsApi.deletePost(post.id).subscribe({
      next: () => {
        this.isDeletePostModalOpen.set(false);
        void this.router.navigate(['/home']);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          this.isDeletingPost.set(false);
          return;
        }

        this.actionErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage:
              'This resource could not be deleted. Please try again.',
            statusMessages: {
              403: 'You do not have permission to delete this resource.',
              404: 'This resource was not found or has already been deleted.',
            },
          }),
        );
        this.isDeletingPost.set(false);
      },
      complete: () => {
        this.isDeletingPost.set(false);
      },
    });
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
            fallbackMessage: this.i18n.translate('routes.postDetail.thisReportCouldNotBeSentPleaseTryAgain'),
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
          this.commentSuccessMessage.set(this.i18n.translate('routes.postDetail.yourCommentWasPosted'));
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
          this.commentSuccessMessage.set(this.i18n.translate('routes.postDetail.yourReplyWasPosted'));
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
          this.commentSuccessMessage.set(this.i18n.translate('routes.postDetail.commentUpdated'));
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
        this.i18n.translate(
          'routes.postDetail.deleteThisCommentRepliesWillStayVisibleAndThisCommentWillBeShownAsDeleted',
        ),
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
        this.commentSuccessMessage.set(this.i18n.translate('routes.postDetail.commentDeleted'));
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

  toggleReplies(commentId: string): void {
    this.expandedCommentIds.update((expandedIds) => {
      const nextIds = new Set(expandedIds);

      if (nextIds.has(commentId)) {
        nextIds.delete(commentId);
      } else {
        nextIds.add(commentId);
      }

      return nextIds;
    });
  }

  isCollapsed(commentId: string): boolean {
    return !this.expandedCommentIds().has(commentId);
  }

  commentIndent(node: CommentThreadNode): string {
    return `${node.visualDepth * COMMENT_INDENT_REM}rem`;
  }

  replyRailPosition(node: CommentThreadNode): string {
    const childVisualDepth = Math.min(node.depth + 1, MAX_VISUAL_COMMENT_DEPTH);
    const railPosition = Math.max(
      0.35,
      childVisualDepth * COMMENT_INDENT_REM - 0.35,
    );
    return `${railPosition}rem`;
  }

  commentRepliesId(commentId: string): string {
    return `comment-replies-${commentId}`;
  }

  replyToggleLabel(node: CommentThreadNode): string {
    if (this.isCollapsed(node.comment.id)) {
      const count = node.replyCount;
      return `Show ${count} ${count === 1 ? 'reply' : 'replies'}`;
    }

    return this.i18n.translate('common.actions.hideReplies');
  }

  canManagePost(post: GetPostResponse): boolean {
    const user = this.currentUser();
    if (!user) {
      return false;
    }

    return user.id === post.user.id || this.isModeratorRole(user.role);
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
      return this.i18n.translate('validation.writeComment');
    }

    if (control.hasError('maxlength')) {
      return `Comments must be ${MAX_COMMENT_LENGTH} characters or fewer.`;
    }

    return this.i18n.translate('validation.checkComment');
  }

  reportDetailsError(): string | null {
    const control = this.reportForm.controls.details;

    if (
      this.reportForm.controls.reason.value === 'other' &&
      control.touched &&
      !control.value.trim()
    ) {
      return this.i18n.translate('validation.reportDetailsRequired');
    }

    if (!(control.invalid && (control.dirty || control.touched))) {
      return null;
    }

    if (control.hasError('maxlength')) {
      return `Report details must be ${MAX_REPORT_DETAILS_LENGTH} characters or fewer.`;
    }

    return this.i18n.translate('validation.checkDetails');
  }

  formTextLength(form: FormGroup<CommentFormControls>): number {
    return form.controls.text.value.length;
  }

  initials(source: PostDetailUser): string {
    const fallback = source.username || 'SH';
    return fallback.slice(0, 2).toUpperCase();
  }

  private loadPost(postId: string): void {
    this.isLoading.set(true);
    this.isNotFound.set(false);
    this.errorMessage.set(null);
    this.actionErrorMessage.set(null);
    this.commentErrorMessage.set(null);
    this.reportErrorMessage.set(null);
    this.isDeletePostModalOpen.set(false);
    this.post.set(null);
    this.expandedCommentIds.set(new Set<string>());

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
            fallbackMessage: this.i18n.translate('routes.postDetail.thisPostCouldNotBeLoadedPleaseTryAgain'),
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
            fallbackMessage: this.i18n.translate('routes.postDetail.theDiscussionCouldNotBeRefreshed'),
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
