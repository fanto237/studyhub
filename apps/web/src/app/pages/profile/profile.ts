import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthSessionStore } from '../../core/services/auth-session-store';
import { PostsApi } from '../../core/services/posts-api';
import { UsersApi } from '../../core/services/users-api';
import { resolveApiErrorMessage } from '../../core/types/api-error.util';
import {
  type FeedSort,
  type PostFeedItem,
  type VotePostResponse,
  type VoteRequestValue,
} from '../../core/types/posts.models';
import { type CurrentUserResponse } from '../../core/types/users.models';
import { Icon } from '../../shared/components/icon/icon';
import { type IconName } from '../../shared/components/icon/icon.registry';
import { PostCard } from '../../shared/components/post-card/post-card';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

type UploadPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type SortOption = {
  value: FeedSort;
  label: string;
  helper: string;
  icon: IconName;
};

type InitialsSource = Pick<CurrentUserResponse, 'fullName' | 'username'>;

@Component({
  selector: 'app-profile',
  imports: [
    DatePipe,
    DecimalPipe,
    Icon,
    NgClass,
    PostCard,
    RouterLink,
    ThemeToggle,
  ],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  private readonly authSession = inject(AuthSessionStore);
  private readonly postsApi = inject(PostsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly router = inject(Router);

  private readonly pageSize = 9;

  readonly currentUser = signal<CurrentUserResponse | null>(null);
  readonly uploads = signal<PostFeedItem[]>([]);
  readonly selectedTags = signal<string[]>([]);
  readonly sort = signal<FeedSort>('new');

  readonly pagination = signal<UploadPagination>({
    page: 1,
    pageSize: this.pageSize,
    totalCount: 0,
    totalPages: 0,
  });

  readonly isLoadingUser = signal(true);
  readonly isLoadingUploads = signal(false);
  readonly isLoadingMore = signal(false);
  readonly downloadingPostId = signal<string | null>(null);
  readonly votingPostIds = signal<ReadonlySet<string>>(new Set<string>());

  readonly userErrorMessage = signal<string | null>(null);
  readonly uploadsErrorMessage = signal<string | null>(null);

  readonly sortOptions: readonly SortOption[] = [
    {
      value: 'new',
      label: 'Newest',
      helper: 'Recently uploaded first',
      icon: 'clock',
    },
    {
      value: 'top',
      label: 'Top rated',
      helper: 'Highest peer scores',
      icon: 'trophy',
    },
    {
      value: 'trending',
      label: 'Trending',
      helper: 'Balanced by activity',
      icon: 'flame',
    },
  ];

  readonly canLoadMore = computed(
    () => this.pagination().page < this.pagination().totalPages,
  );

  readonly hasUploadFilters = computed(() => this.selectedTags().length > 0);

  readonly visibleUploadScore = computed(() =>
    this.uploads().reduce(
      (totals, post) => ({
        upvotes: totals.upvotes + post.upvotes,
        downvotes: totals.downvotes + post.downvotes,
        score: totals.score + post.score,
      }),
      { upvotes: 0, downvotes: 0, score: 0 },
    ),
  );

  readonly visibleTags = computed(() => {
    const tags = new Map<string, string>();

    for (const post of this.uploads()) {
      for (const tag of post.tags) {
        const normalizedTag = tag.trim();
        if (normalizedTag) {
          tags.set(normalizedTag.toLowerCase(), normalizedTag);
        }
      }
    }

    return [...tags.values()].sort((first, second) =>
      first.localeCompare(second),
    );
  });

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUploads(true);
  }

  retryProfile(): void {
    this.loadCurrentUser();
  }

  retryUploads(): void {
    this.loadUploads(true);
  }

  loadMore(): void {
    if (this.canLoadMore() && !this.isLoadingMore()) {
      this.loadUploads(false);
    }
  }

  setSort(sort: FeedSort): void {
    if (this.sort() === sort) {
      return;
    }

    this.sort.set(sort);
    this.loadUploads(true);
  }

  selectTag(tag: string): void {
    const normalizedTag = tag.trim();
    if (!normalizedTag) {
      return;
    }

    const normalizedLower = normalizedTag.toLowerCase();
    const isSelected = this.selectedTags().some(
      (selectedTag) => selectedTag.toLowerCase() === normalizedLower,
    );

    if (isSelected) {
      return;
    }

    this.selectedTags.set([...this.selectedTags(), normalizedTag]);
    this.loadUploads(true);
  }

  removeTag(tag: string): void {
    const normalizedLower = tag.trim().toLowerCase();
    const nextTags = this.selectedTags().filter(
      (selectedTag) => selectedTag.toLowerCase() !== normalizedLower,
    );

    if (nextTags.length !== this.selectedTags().length) {
      this.selectedTags.set(nextTags);
      this.loadUploads(true);
    }
  }

  clearUploadFilters(): void {
    if (!this.hasUploadFilters()) {
      return;
    }

    this.selectedTags.set([]);
    this.loadUploads(true);
  }

  votePost(post: PostFeedItem, vote: VoteRequestValue): void {
    if (this.isVoting(post.id)) {
      return;
    }

    this.uploadsErrorMessage.set(null);
    this.setPostVoting(post.id, true);

    this.postsApi.votePost(post.id, vote).subscribe({
      next: (response) => {
        this.applyVoteResponse(response);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          return;
        }

        this.uploadsErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage: 'Your vote could not be saved. Please try again.',
          }),
        );
        this.setPostVoting(post.id, false);
      },
      complete: () => {
        this.setPostVoting(post.id, false);
      },
    });
  }

  downloadPost(post: PostFeedItem): void {
    if (this.downloadingPostId() === post.id) {
      return;
    }

    this.uploadsErrorMessage.set(null);
    this.downloadingPostId.set(post.id);

    this.postsApi.downloadPost(post.id).subscribe({
      next: (response) => {
        this.openInNewTab(response.downloadUrl);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          return;
        }

        this.uploadsErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage:
              'The PDF download could not be prepared. Please try again.',
          }),
        );
        this.downloadingPostId.set(null);
      },
      complete: () => {
        this.downloadingPostId.set(null);
      },
    });
  }

  isVoting(postId: string): boolean {
    return this.votingPostIds().has(postId);
  }

  isDownloading(postId: string): boolean {
    return this.downloadingPostId() === postId;
  }

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

  private loadCurrentUser(): void {
    this.userErrorMessage.set(null);
    this.isLoadingUser.set(true);

    this.usersApi.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          return;
        }

        this.userErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage:
              'Your profile could not be loaded. Please try again.',
          }),
        );
        this.isLoadingUser.set(false);
      },
      complete: () => {
        this.isLoadingUser.set(false);
      },
    });
  }

  private loadUploads(reset: boolean): void {
    const nextPage = reset ? 1 : this.pagination().page + 1;

    this.uploadsErrorMessage.set(null);

    if (reset) {
      this.isLoadingUploads.set(true);
      this.uploads.set([]);
      this.pagination.set({
        page: 1,
        pageSize: this.pageSize,
        totalCount: 0,
        totalPages: 0,
      });
    } else {
      this.isLoadingMore.set(true);
    }

    this.postsApi
      .getMyPosts({
        sort: this.sort(),
        page: nextPage,
        pageSize: this.pageSize,
        search: null,
        tags: this.selectedTags(),
      })
      .subscribe({
        next: (response) => {
          this.uploads.set(
            reset ? response.items : [...this.uploads(), ...response.items],
          );
          this.pagination.set({
            page: response.page,
            pageSize: response.pageSize,
            totalCount: response.totalCount,
            totalPages: response.totalPages,
          });
        },
        error: (error: unknown) => {
          if (this.redirectToLoginIfUnauthorized(error)) {
            return;
          }

          this.uploadsErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                'Your uploads could not be loaded. Please try again.',
            }),
          );
          this.isLoadingUploads.set(false);
          this.isLoadingMore.set(false);
        },
        complete: () => {
          this.isLoadingUploads.set(false);
          this.isLoadingMore.set(false);
        },
      });
  }

  private applyVoteResponse(response: VotePostResponse): void {
    this.uploads.update((uploads) =>
      uploads.map((post) =>
        post.id === response.postId
          ? {
              ...post,
              upvotes: response.upvotes,
              downvotes: response.downvotes,
              score: response.score,
              currentVote: response.currentVote,
            }
          : post,
      ),
    );
  }

  private setPostVoting(postId: string, isVoting: boolean): void {
    this.votingPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);

      if (isVoting) {
        nextPostIds.add(postId);
      } else {
        nextPostIds.delete(postId);
      }

      return nextPostIds;
    });
  }

  private redirectToLoginIfUnauthorized(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
      return false;
    }

    this.authSession.clearLocalSession();
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/profile' },
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
