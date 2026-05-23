import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthSessionStore } from '../services/auth-session-store';

export const requireAuthSessionGuard: CanActivateFn = (_route, state) => {
  const authSession = inject(AuthSessionStore);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return authSession.checkSession().pipe(
    map((user) => {
      if (user || authSession.isAuthenticated()) {
        return true;
      }

      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};

export const redirectAuthenticatedGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionStore);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return authSession.checkSession().pipe(
    map((user) => {
      if (user || authSession.isAuthenticated()) {
        return router.createUrlTree(['/home']);
      }

      return true;
    }),
  );
};
