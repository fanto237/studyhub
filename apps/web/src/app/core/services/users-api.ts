import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { type ApiEnvelope } from '../types/api-envelope.model';
import { type CurrentUserResponse } from '../types/users.models';

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
}
