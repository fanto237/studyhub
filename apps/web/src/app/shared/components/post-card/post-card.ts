import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  type PostFeedItem,
  type PostFeedUser,
  type VoteRequestValue,
} from '../../../core/types/posts.models';
import { Icon } from '../icon/icon';

export type PostCardVoteRequest = {
  post: PostFeedItem;
  vote: VoteRequestValue;
};

@Component({
  selector: 'app-post-card',
  imports: [DatePipe, DecimalPipe, Icon, RouterLink],
  templateUrl: './post-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCard {
  private readonly router = inject(Router);

  readonly post = input.required<PostFeedItem>();
  readonly voting = input(false);
  readonly downloading = input(false);

  readonly voteRequested = output<PostCardVoteRequest>();
  readonly tagSelected = output<string>();
  readonly downloadRequested = output<PostFeedItem>();

  visibleTags(tags: string[]): string[] {
    return tags.slice(0, 4);
  }

  extraTagCount(tags: string[]): number {
    return Math.max(tags.length - 4, 0);
  }

  initials(source: PostFeedUser): string {
    const fallback = source.username || 'SH';
    const parts = (source.fullName || fallback)
      .split(/\s+/)
      .filter((part) => part.length > 0);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return fallback.slice(0, 2).toUpperCase();
  }

  requestVote(vote: VoteRequestValue): void {
    this.voteRequested.emit({ post: this.post(), vote });
  }

  selectTag(tag: string): void {
    this.tagSelected.emit(tag);
  }

  requestDownload(): void {
    this.downloadRequested.emit(this.post());
  }

  openPostDetail(event: MouseEvent): void {
    if (this.shouldIgnoreCardNavigation(event)) {
      return;
    }

    void this.router.navigate(['/posts', this.post().id]);
  }

  handleCardKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    if (this.shouldIgnoreCardNavigation(event)) {
      return;
    }

    event.preventDefault();
    void this.router.navigate(['/posts', this.post().id]);
  }

  private shouldIgnoreCardNavigation(event: Event): boolean {
    const target = event.target;

    if (!(target instanceof Element)) {
      return true;
    }

    return (
      target.closest(
        'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [contenteditable="true"], [data-no-card-navigation]',
      ) !== null
    );
  }
}
