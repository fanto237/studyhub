import { DecimalPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

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
import { MobileDock } from '../../shared/components/mobile-dock/mobile-dock';
import { PostCard } from '../../shared/components/post-card/post-card';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { SidebarProfile } from './components/sidebar-profile/sidebar-profile';

type FeedPagination = {
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
  selector: 'app-home',
  imports: [
    DecimalPipe,
    Icon,
    MobileDock,
    NgClass,
    PostCard,
    ReactiveFormsModule,
    RouterLink,
    SidebarProfile,
    ThemeToggle,
  ],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly authSession = inject(AuthSessionStore);
  private readonly postsApi = inject(PostsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly router = inject(Router);

  private readonly pageSize = 10;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly searchTerm = signal('');
  readonly selectedTags = signal<string[]>([]);
  readonly sort = signal<FeedSort>('trending');
  readonly isSidebarCollapsed = signal(false);

  readonly currentUser = signal<CurrentUserResponse | null>(null);
  readonly posts = signal<PostFeedItem[]>([]);
  readonly pagination = signal<FeedPagination>({
    page: 1,
    pageSize: this.pageSize,
    totalCount: 0,
    totalPages: 0,
  });

  readonly isLoadingUser = signal(true);
  readonly isLoadingPosts = signal(false);
  readonly isLoadingMore = signal(false);
  readonly isLoggingOut = signal(false);
  readonly downloadingPostId = signal<string | null>(null);
  readonly votingPostIds = signal<ReadonlySet<string>>(new Set<string>());

  readonly userErrorMessage = signal<string | null>(null);
  readonly feedErrorMessage = signal<string | null>(null);
  readonly logoutErrorMessage = signal<string | null>(null);

  readonly sortOptions: readonly SortOption[] = [
    {
      value: 'trending',
      label: 'Trending',
      helper: 'Balanced by recent activity',
      icon: 'flame',
    },
    {
      value: 'top',
      label: 'Top rated',
      helper: 'Highest peer scores',
      icon: 'trophy',
    },
    {
      value: 'new',
      label: 'Newest',
      helper: 'Fresh uploads first',
      icon: 'clock',
    },
  ];

  readonly canLoadMore = computed(
    () => this.pagination().page < this.pagination().totalPages,
  );

  readonly hasActiveFilters = computed(
    () => this.searchTerm().length > 0 || this.selectedTags().length > 0,
  );

  readonly popularTags = computed(() => {
    const counts = new Map<string, number>();

    const countTag = (tag: string) => {
      const normalizedTag = tag.trim();
      if (!normalizedTag) {
        return;
      }

      counts.set(normalizedTag, (counts.get(normalizedTag) ?? 0) + 1);
    };

    for (const post of this.posts()) {
      post.tags.forEach(countTag);
    }

    for (const post of this.currentUser()?.latestPosts ?? []) {
      post.tags.forEach(countTag);
    }

    return [...counts.entries()]
      .sort(
        (first, second) =>
          second[1] - first[1] || first[0].localeCompare(second[0]),
      )
      .slice(0, 8)
      .map(([tag]) => tag);
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.loadPosts(true);
      });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadPosts(true);
  }

  onSearchSubmit(): void {
    this.searchTerm.set(this.searchControl.value.trim());
    this.loadPosts(true);
  }

  setSort(sort: FeedSort): void {
    if (this.sort() === sort) {
      return;
    }

    this.sort.set(sort);
    this.loadPosts(true);
  }

  toggleTag(tag: string): void {
    const normalizedTag = tag.trim();
    if (!normalizedTag) {
      return;
    }

    const normalizedLower = normalizedTag.toLowerCase();
    const selectedTags = this.selectedTags();
    const isSelected = selectedTags.some(
      (selectedTag) => selectedTag.toLowerCase() === normalizedLower,
    );

    this.selectedTags.set(
      isSelected
        ? selectedTags.filter(
            (selectedTag) => selectedTag.toLowerCase() !== normalizedLower,
          )
        : [...selectedTags, normalizedTag],
    );
    this.loadPosts(true);
  }

  removeTag(tag: string): void {
    const normalizedLower = tag.trim().toLowerCase();
    const nextTags = this.selectedTags().filter(
      (selectedTag) => selectedTag.toLowerCase() !== normalizedLower,
    );

    if (nextTags.length !== this.selectedTags().length) {
      this.selectedTags.set(nextTags);
      this.loadPosts(true);
    }
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.searchTerm.set('');
    this.selectedTags.set([]);
    this.loadPosts(true);
  }

  loadMore(): void {
    if (this.canLoadMore() && !this.isLoadingMore()) {
      this.loadPosts(false);
    }
  }

  retryFeed(): void {
    this.loadPosts(true);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((isCollapsed) => !isCollapsed);
  }

  votePost(post: PostFeedItem, vote: VoteRequestValue): void {
    if (this.isVoting(post.id)) {
      return;
    }

    this.feedErrorMessage.set(null);
    this.setPostVoting(post.id, true);

    this.postsApi.votePost(post.id, vote).subscribe({
      next: (response) => {
        this.applyVoteResponse(response);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          return;
        }

        this.feedErrorMessage.set(
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

    this.feedErrorMessage.set(null);
    this.downloadingPostId.set(post.id);

    this.postsApi.downloadPost(post.id).subscribe({
      next: (response) => {
        this.openInNewTab(response.downloadUrl);
      },
      error: (error: unknown) => {
        if (this.redirectToLoginIfUnauthorized(error)) {
          return;
        }

        this.feedErrorMessage.set(
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

  onLogout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.logoutErrorMessage.set(null);
    this.isLoggingOut.set(true);

    this.authSession.logout().subscribe({
      next: () => {
        void this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        if (this.isUnauthorized(error)) {
          this.authSession.clearLocalSession();
          void this.router.navigate(['/']);
          return;
        }

        this.logoutErrorMessage.set(
          resolveApiErrorMessage(error, {
            fallbackMessage: 'Logout was not completed. Please try again.',
          }),
        );
        this.isLoggingOut.set(false);
      },
      complete: () => {
        this.isLoggingOut.set(false);
      },
    });
  }

  isTagSelected(tag: string): boolean {
    const normalizedLower = tag.trim().toLowerCase();
    return this.selectedTags().some(
      (selectedTag) => selectedTag.toLowerCase() === normalizedLower,
    );
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

  firstName(user: CurrentUserResponse): string {
    return user.fullName.split(/\s+/).filter(Boolean)[0] ?? user.username;
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
              'Your profile could not be loaded. Refresh the page to try again.',
          }),
        );
        this.isLoadingUser.set(false);
      },
      complete: () => {
        this.isLoadingUser.set(false);
      },
    });
  }

  private loadPosts(reset: boolean): void {
    const nextPage = reset ? 1 : this.pagination().page + 1;

    this.feedErrorMessage.set(null);

    if (reset) {
      this.isLoadingPosts.set(true);
      this.posts.set([]);
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
      .getPosts({
        sort: this.sort(),
        page: nextPage,
        pageSize: this.pageSize,
        search: this.searchTerm(),
        tags: this.selectedTags(),
      })
      .subscribe({
        next: (response) => {
          this.posts.set(
            reset ? response.items : [...this.posts(), ...response.items],
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

          this.feedErrorMessage.set(
            resolveApiErrorMessage(error, {
              fallbackMessage:
                'The StudyHub feed could not be loaded. Please try again.',
            }),
          );
          this.isLoadingPosts.set(false);
          this.isLoadingMore.set(false);
        },
        complete: () => {
          this.isLoadingPosts.set(false);
          this.isLoadingMore.set(false);
        },
      });
  }

  private applyVoteResponse(response: VotePostResponse): void {
    this.posts.update((posts) =>
      posts.map((post) =>
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
    if (!this.isUnauthorized(error)) {
      return false;
    }

    this.authSession.clearLocalSession();
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/home' },
    });
    return true;
  }

  private isUnauthorized(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 401;
  }

  private openInNewTab(url: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
