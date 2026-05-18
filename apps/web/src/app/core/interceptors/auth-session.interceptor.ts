import {
  HttpErrorResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  type Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';

import { AuthApi } from '../services/auth-api';
import { type AuthSessionResponse } from '../types/auth.models';

let refreshSessionRequest$: Observable<AuthSessionResponse> | null = null;

export const authSessionInterceptor: HttpInterceptorFn = (request, next) => {
  const authApi = inject(AuthApi);
  const apiPath = getSameOriginApiPath(request.url);
  const credentialedRequest = apiPath
    ? request.clone({ withCredentials: true })
    : request;

  return next(credentialedRequest).pipe(
    catchError((error: unknown) => {
      if (!shouldRefreshSession(apiPath, error)) {
        return throwError(() => error);
      }

      return getSharedRefreshSessionRequest(authApi).pipe(
        switchMap(() =>
          next(credentialedRequest.clone({ withCredentials: true })),
        ),
      );
    }),
  );
};

function getSharedRefreshSessionRequest(authApi: AuthApi) {
  if (!refreshSessionRequest$) {
    refreshSessionRequest$ = authApi.refreshSession().pipe(
      finalize(() => {
        refreshSessionRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  return refreshSessionRequest$;
}

function shouldRefreshSession(
  apiPath: string | null,
  error: unknown,
): error is HttpErrorResponse {
  return (
    apiPath !== null &&
    !isAuthEndpoint(apiPath) &&
    error instanceof HttpErrorResponse &&
    error.status === 401
  );
}

function isAuthEndpoint(apiPath: string) {
  const normalizedPath = normalizePath(apiPath);
  return (
    normalizedPath === '/api/auth' || normalizedPath.startsWith('/api/auth/')
  );
}

function normalizePath(path: string) {
  const pathWithoutQuery = path.split('?', 1)[0];

  if (pathWithoutQuery.length > 1 && pathWithoutQuery.endsWith('/')) {
    return pathWithoutQuery.slice(0, -1);
  }

  return pathWithoutQuery;
}

function getSameOriginApiPath(url: string): string | null {
  if (url.startsWith('/api/')) {
    return normalizePath(url);
  }

  if (typeof window === 'undefined' || !isAbsoluteHttpUrl(url)) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.origin === window.location.origin &&
      parsedUrl.pathname.startsWith('/api/')
    ) {
      return parsedUrl.pathname;
    }
  } catch {
    return null;
  }

  return null;
}

function isAbsoluteHttpUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://');
}
