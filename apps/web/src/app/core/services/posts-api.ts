import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { type ApiEnvelope } from '../types/api-envelope.model';
import {
  type CreatePostRequest,
  type CreatePostResponse,
  type DownloadPostResponse,
  type GeneratePostMetadataSuggestionsRequest,
  type GeneratePostMetadataSuggestionsResponse,
  type GetPostResponse,
  type GetPostsParams,
  type GetPostsResponse,
  type ReportPostRequest,
  type ReportPostResponse,
  type VotePostResponse,
  type VoteRequestValue,
} from '../types/posts.models';

@Injectable({ providedIn: 'root' })
export class PostsApi {
  private readonly http = inject(HttpClient);

  getPosts(params: GetPostsParams) {
    return this.getPostsFromUrl('/api/posts', params);
  }

  getMyPosts(params: GetPostsParams) {
    return this.getPostsFromUrl('/api/posts/me', params);
  }

  getPost(postId: string) {
    return this.http
      .get<ApiEnvelope<GetPostResponse>>(`/api/posts/${postId}`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(response.message ?? 'The post could not be loaded.');
        }),
      );
  }

  generateMetadataSuggestions(request: GeneratePostMetadataSuggestionsRequest) {
    const formData = new FormData();
    formData.append('File', request.file);

    const title = request.title?.trim();
    if (title) {
      formData.append('Title', title);
    }

    return this.http
      .post<
        ApiEnvelope<GeneratePostMetadataSuggestionsResponse>
      >('/api/posts/metadata-suggestions', formData, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'Metadata suggestions could not be generated.',
          );
        }),
      );
  }

  createPost(request: CreatePostRequest) {
    const formData = new FormData();
    formData.append('File', request.file);
    formData.append('Title', request.title);

    const description = request.description?.trim();
    if (description) {
      formData.append('Description', description);
    }

    for (const tag of request.tags) {
      const normalizedTag = tag.trim();
      if (normalizedTag) {
        formData.append('Tags', normalizedTag);
      }
    }

    return this.http
      .post<ApiEnvelope<CreatePostResponse>>('/api/posts', formData, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(response.message ?? 'The PDF could not be uploaded.');
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

  deletePost(postId: string) {
    return this.http.delete<void>(`/api/posts/${postId}`, {
      withCredentials: true,
    });
  }

  reportPost(postId: string, request: ReportPostRequest) {
    return this.http
      .post<
        ApiEnvelope<ReportPostResponse>
      >(`/api/posts/${postId}/report`, request, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(response.message ?? 'This report could not be sent.');
        }),
      );
  }

  private getPostsFromUrl(url: string, params: GetPostsParams) {
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
      .get<ApiEnvelope<GetPostsResponse>>(url, {
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
}
