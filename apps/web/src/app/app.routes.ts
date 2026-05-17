import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then((module) => module.Landing),
    title: 'StudyHub',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login').then((module) => module.Login),
    title: 'Log In | StudyHub',
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/auth/signup/signup').then((module) => module.Signup),
    title: 'Sign Up | StudyHub',
  },
];
