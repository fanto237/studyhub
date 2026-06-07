import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
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
import { TranslationService } from '../../core/services/translation';
import { UsersApi } from '../../core/services/users-api';
import { resolveApiErrorMessage } from '../../core/types/api-error.util';
import {
  type FeedSort,
  type PostFeedItem,
  type VotePostResponse,
  type VoteRequestValue,
} from '../../core/types/posts.models';
import { type PublicUserProfileResponse } from '../../core/types/users.models';
import { Icon } from '../../shared/components/icon/icon';
import { type IconName } from '../../shared/components/icon/icon.registry';
import { MobileDock } from '../../shared/components/mobile-dock/mobile-dock';
import { PostCard } from '../../shared/components/post-card/post-card';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelector } from '../../shared/components/language-selector/language-selector';

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

@Component({
  selector: 'app-user-profile',
  imports: [
    LanguageSelector,
    TranslatePipe,
    DatePipe,
    DecimalPipe,
    Icon,
    MobileDock,
    NgClass,
    PostCard,
    RouterLink,
    ThemeToggle,
  ],
  templateUrl: './user-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfile implements OnInit {
  private readonly authSession = inject(AuthSessionStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly postsApi = inject(PostsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApi);
  readonly i18n = inject(TranslationService);

  private readonly pageSize = 9;

  readonly userId = signal<string | null>(null);
  readonly profile = signal<PublicUserProfileResponse | null>(null);
  readonly uploads = signal<PostFeedItem[]>([]);
  readonly selectedTags = signal<string[]>([]);
  readonly sort = signal<FeedSort>('new');

  readonly pagination = signal<UploadPagination>({
    page: 1,
    pageSize: this.pageSize,
    totalCount: 0,
    totalPages: 0,
  });

  readonly isLoadingProfile = signal(true);
  readonly isLoadingUploads = signal(false);
  readonly isLoadingMore = signal(false);
  readonly isNotFound = signal(false);
  readonly downloadingPostId = signal<string | null>(null);
  readonly votingPostIds = signal<ReadonlySet<string>>(new Set<string>());

  readonly profileErrorMessage = signal<string | null>(null);
  readonly uploadsErrorMessage = signal<string | null>(null);

  readonly sortOptions = computed<readonly SortOption[]>(() => [
    {
      value: 'new',
      label: this.i18n.translate('common.sort.newest'),
      helper: this.i18n.translate('common.sort.recentlyUploadedFirst'),
      icon: 'clock',
    },
    {
      value: 'top',
      label: this.i18n.translate('common.sort.topRated'),
      helper: this.i18n.translate('common.sort.highestPeerScores'),
      icon: 'trophy',
    },
    {
      value: 'trending',
      label: this.i18n.translate('common.sort.trending'),
      helper: this.i18n.translate('common.sort.balancedActivity'),
      icon: 'flame',
    },
  ]);

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

  readonly popularTags = computed(() => {
    const counts = new Map<string, { label: string; count: number }>();

    const countTag = (tag: string) => {
      const label = tag.trim();
      if (!label) {
        return;
      }

      const key = label.toLowerCase();
      const existing = counts.get(key);
      counts.set(key, {
        label: existing?.label ?? label,
        count: (existing?.count ?? 0) + 1,
      });
    };

    for (const post of this.profile()?.latestPosts ?? []) {
      post.tags.forEach(countTag);
    }

    for (const post of this.uploads()) {
      post.tags.forEach(countTag);
    }

    return [...counts.values()]
      .sort(
        (first, second) =>
          second.count - first.count || first.label.localeCompare(second.label),
      )
      .slice(0, 10)
      .map((entry) => entry.label);
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const userId = params.get('userId');
        this.userId.set(userId);
        this.selectedTags.set([]);
        this.sort.set('new');

        if (!userId) {
          this.profile.set(null);
          this.uploads.set([]);
          this.isLoadingProfile.set(false);
          this.isLoadingUploads.set(false);
          this.isNotFound.set(true);
          this.profileErrorMessage.set(this.i18n.translate('routes.userProfile.thisProfileLinkIsMissingAUserId'));
          return;
        }

        if (this.isCurrentUserId(userId)) {
          void this.router.navigate(['/profile'], { replaceUrl: true });
          return;
        }

        this.loadProfile(userId);
        this.loadUploads(true);
      });
  }

  retryProfile(): void {
    const userId = this.userId();
    if (userId) {
      this.loadProfile(userId);
    }
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
            fallbackMessage: this.i18n.translate('errors.posts.voteSave'),
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
              this.i18n.translate('errors.posts.pdfDownload'),
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

  isTagSelected(tag: string): boolean {
    const normalizedLower = tag.trim().toLowerCase();
    return this.selectedTags().some(
      (selectedTag) => selectedTag.toLowerCase() === normalizedLower,
    );
  }

  initials(source: Pick<PublicUserProfileResponse, 'username'>): string {
    const fallback = source.username || 'SH';
    return fallback.slice(0, 2).toUpperCase();
  }

  private loadProfile(userId: string): void {
    this.profileErrorMessage.set(null);
    this.isNotFound.set(false);
    this.isLoadingProfile.set(true);
    this.profile.set(null);

    this.usersApi.getPublicUserProfile(userId).subscribe({
      next: (profile) => {
        if (this.isCurrentUserId(profile.id)) {
          void this.router.navigate(['/profile'], { replaceUrl: true });
          return;
        }

        this.profile.set(profile);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          return;
        }

        this.isNotFound.set(
          error instanceof HttpErrorResponse && error.status === 404,
        );
        this.profileErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage: this.i18n.translate('errors.profile.publicLoad'),
            statusMessages: {
              404: this.i18n.translate('errors.profile.contributorNotFound'),
            },
          }),
        );
        this.isLoadingProfile.set(false);
      },
      complete: () => {
        this.isLoadingProfile.set(false);
      },
    });
  }

  private loadUploads(reset: boolean): void {
    const userId = this.userId();
    if (!userId) {
      return;
    }

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

    this.usersApi
      .getUserPosts(userId, {
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
              fallbackMessage: this.i18n.translate(
                'errors.profile.contributorUploadsLoad',
              ),
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
    const returnUrl = this.userId() ? `/users/${this.userId()}` : '/home';
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl },
    });
    return true;
  }

  private isCurrentUserId(userId: string): boolean {
    const currentUserId = this.authSession.displayUser()?.id;
    return currentUserId?.toLowerCase() === userId.toLowerCase();
  }

  private openInNewTab(url: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
