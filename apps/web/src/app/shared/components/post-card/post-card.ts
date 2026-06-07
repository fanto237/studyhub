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
import { TranslationService } from '../../../core/services/translation';
import { Icon } from '../icon/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type PostCardVoteRequest = {
  post: PostFeedItem;
  vote: VoteRequestValue;
};

@Component({
  selector: 'app-post-card',
  imports: [DatePipe, DecimalPipe, Icon, RouterLink, TranslatePipe],
  templateUrl: './post-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCard {
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);

  readonly post = input.required<PostFeedItem>();
  readonly voting = input(false);
  readonly downloading = input(false);
  readonly descriptionMaxLength = input<number | null>(null);

  readonly voteRequested = output<PostCardVoteRequest>();
  readonly tagSelected = output<string>();
  readonly downloadRequested = output<PostFeedItem>();

  visibleTags(tags: string[]): string[] {
    return tags.slice(0, 4);
  }

  extraTagCount(tags: string[]): number {
    return Math.max(tags.length - 4, 0);
  }

  descriptionText(description: string | null): string {
    const fallback = this.i18n.translate('shared.postCard.emptyDescription');
    const text = description?.trim() || fallback;
    const maxLength = this.descriptionMaxLength();

    if (maxLength === null || text.length <= maxLength) {
      return text;
    }

    if (maxLength <= 1) {
      return text.slice(0, Math.max(maxLength, 0));
    }

    return `${text.slice(0, maxLength - 1).trimEnd()}…`;
  }

  initials(source: PostFeedUser): string {
    const fallback = source.username || 'SH';
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
