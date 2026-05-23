import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { type ApiEnvelope } from '../types/api-envelope.model';
import {
  type CreateCommentRequest,
  type CreateCommentResponse,
  type GetPostCommentsResponse,
  type UpdateCommentRequest,
  type UpdateCommentResponse,
} from '../types/comments.models';

@Injectable({ providedIn: 'root' })
export class CommentsApi {
  private readonly http = inject(HttpClient);

  getPostComments(postId: string) {
    return this.http
      .get<
        ApiEnvelope<GetPostCommentsResponse>
      >(`/api/posts/${postId}/comments`, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data.comments;
          }

          throw new Error(
            response.message ?? 'The discussion thread could not be loaded.',
          );
        }),
      );
  }

  createComment(postId: string, request: CreateCommentRequest) {
    return this.http
      .post<
        ApiEnvelope<CreateCommentResponse>
      >(`/api/posts/${postId}/comments`, request, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'Your comment could not be posted.',
          );
        }),
      );
  }

  updateComment(commentId: string, request: UpdateCommentRequest) {
    return this.http
      .patch<
        ApiEnvelope<UpdateCommentResponse>
      >(`/api/comments/${commentId}`, request, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }

          throw new Error(
            response.message ?? 'Your comment could not be updated.',
          );
        }),
      );
  }

  deleteComment(commentId: string) {
    return this.http.delete<void>(`/api/comments/${commentId}`, {
      withCredentials: true,
    });
  }
}
