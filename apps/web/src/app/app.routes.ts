import { Route } from '@angular/router';

import {
  redirectAuthenticatedGuard,
  requireAuthSessionGuard,
} from './core/guards/auth-session.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then((module) => module.Landing),
    title: 'StudyHub',
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./pages/legal/legal-page').then((module) => module.LegalPage),
    title: 'Terms of Service | StudyHub',
    data: { legalDocument: 'terms' },
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/legal/legal-page').then((module) => module.LegalPage),
    title: 'Privacy Policy | StudyHub',
    data: { legalDocument: 'privacy' },
  },
  {
    path: 'policy',
    loadComponent: () =>
      import('./pages/legal/legal-page').then((module) => module.LegalPage),
    title: 'Privacy Policy | StudyHub',
    data: { legalDocument: 'privacy' },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact').then((module) => module.Contact),
    title: 'Contact | StudyHub',
  },
  {
    path: 'home',
    canActivate: [requireAuthSessionGuard],
    loadComponent: () =>
      import('./pages/home/home').then((module) => module.Home),
    title: 'Home | StudyHub',
  },
  {
    path: 'profile/edit',
    canActivate: [requireAuthSessionGuard],
    loadComponent: () =>
      import('./pages/profile-edit/profile-edit').then(
        (module) => module.ProfileEdit,
      ),
    title: 'Account Settings | StudyHub',
  },
  {
    path: 'profile',
    canActivate: [requireAuthSessionGuard],
    loadComponent: () =>
      import('./pages/profile/profile').then((module) => module.Profile),
    title: 'Profile | StudyHub',
  },
  {
    path: 'upload',
    canActivate: [requireAuthSessionGuard],
    loadComponent: () =>
      import('./pages/upload/upload').then((module) => module.Upload),
    title: 'Upload | StudyHub',
  },
  {
    path: 'posts/:postId',
    canActivate: [requireAuthSessionGuard],
    loadComponent: () =>
      import('./pages/post-detail/post-detail').then(
        (module) => module.PostDetail,
      ),
    title: 'Resource | StudyHub',
  },
  {
    path: 'users/:userId',
    canActivate: [requireAuthSessionGuard],
    loadComponent: () =>
      import('./pages/user-profile/user-profile').then(
        (module) => module.UserProfile,
      ),
    title: 'Contributor | StudyHub',
  },
  {
    path: 'login',
    canActivate: [redirectAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/auth/login/login').then((module) => module.Login),
    title: 'Log In | StudyHub',
  },
  {
    path: 'signup',
    canActivate: [redirectAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/auth/signup/signup').then((module) => module.Signup),
    title: 'Sign Up | StudyHub',
  },
];
