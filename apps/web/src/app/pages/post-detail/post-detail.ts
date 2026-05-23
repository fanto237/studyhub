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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionStore } from '../../core/services/auth-session-store';
import { PostsApi } from '../../core/services/posts-api';
import { resolveApiErrorMessage } from '../../core/types/api-error.util';
import {
  type GetPostResponse,
  type PostDetailComment,
  type PostDetailUser,
  type VotePostResponse,
  type VoteRequestValue,
} from '../../core/types/posts.models';
import { Icon } from '../../shared/components/icon/icon';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-post-detail',
  imports: [DatePipe, DecimalPipe, Icon, RouterLink, ThemeToggle],
  templateUrl: './post-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetail implements OnInit {
  private readonly authSession = inject(AuthSessionStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly postsApi = inject(PostsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly post = signal<GetPostResponse | null>(null);
  readonly postId = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly isVoting = signal(false);
  readonly isDownloading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionErrorMessage = signal<string | null>(null);
  readonly isNotFound = signal(false);

  readonly topLevelComments = computed(() =>
    (this.post()?.comments ?? []).filter((comment) => !comment.parentCommentId),
  );

  readonly replyComments = computed(() =>
    (this.post()?.comments ?? []).filter((comment) => comment.parentCommentId),
  );

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
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
          return;
        }

        this.actionErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage: 'The PDF download could not be prepared. Please try again.',
          }),
        );
        this.isDownloading.set(false);
      },
      complete: () => {
        this.isDownloading.set(false);
      },
    });
  }

  repliesFor(comment: PostDetailComment): PostDetailComment[] {
    return this.replyComments().filter(
      (reply) => reply.parentCommentId === comment.id,
    );
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
    this.post.set(null);

    this.postsApi.getPost(postId).subscribe({
      next: (post) => {
        this.post.set(post);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          return;
        }

        this.isNotFound.set(error instanceof HttpErrorResponse && error.status === 404);
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

  private openInNewTab(url: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
