import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { type ApiEnvelope } from '../types/api-envelope.model';
import {
  type DownloadPostResponse,
  type GetPostsParams,
  type GetPostsResponse,
  type VotePostResponse,
  type VoteRequestValue,
} from '../types/posts.models';

@Injectable({ providedIn: 'root' })
export class PostsApi {
  private readonly http = inject(HttpClient);

  getPosts(params: GetPostsParams) {
    let httpParams = new HttpParams()
      .set('sort', params.sort)
      .set('page', params.page)
      .set('pageSize', params.pageSize);

    const search = params.search?.trim();
    if (search) {
      httpParams = httpParams.set('search', search);
    }

    for (const tag of params.tags ?? []) {
      const normalizedTag = tag.trim();
      if (normalizedTag) {
        httpParams = httpParams.append('tags', normalizedTag);
      }
    }

    return this.http
      .get<ApiEnvelope<GetPostsResponse>>('/api/posts', {
        params: httpParams,
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'The StudyHub feed could not load.',
          );
        }),
      );
  }

  votePost(postId: string, vote: VoteRequestValue) {
    return this.http
      .post<
        ApiEnvelope<VotePostResponse>
      >(`/api/posts/${postId}/vote`, { vote }, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(response.message ?? 'Your vote could not be saved.');
        }),
      );
  }

  downloadPost(postId: string) {
    return this.http
      .post<
        ApiEnvelope<DownloadPostResponse>
      >(`/api/posts/${postId}/download`, {}, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'The download could not be prepared.',
          );
        }),
      );
  }
}
