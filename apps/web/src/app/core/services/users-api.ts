import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { type ApiEnvelope } from '../types/api-envelope.model';
import {
  type GetPostsParams,
  type GetPostsResponse,
} from '../types/posts.models';
import {
  type CurrentUserResponse,
  type PublicUserProfileResponse,
  type UpdateCurrentUserRequest,
} from '../types/users.models';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  getCurrentUser() {
    return this.http
      .get<ApiEnvelope<CurrentUserResponse>>('/api/users/me', {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'Your StudyHub profile could not load.',
          );
        }),
      );
  }

  updateCurrentUser(request: UpdateCurrentUserRequest) {
    return this.http
      .patch<ApiEnvelope<CurrentUserResponse>>('/api/users/me', request, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'Your StudyHub profile could not be updated.',
          );
        }),
      );
  }

  getPublicUserProfile(userId: string) {
    return this.http
      .get<ApiEnvelope<PublicUserProfileResponse>>(`/api/users/${userId}`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'This StudyHub profile could not load.',
          );
        }),
      );
  }

  getUserPosts(userId: string, params: GetPostsParams) {
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
      .get<ApiEnvelope<GetPostsResponse>>(`/api/users/${userId}/posts`, {
        params: httpParams,
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? "This user's uploads could not load.",
          );
        }),
      );
  }
}
