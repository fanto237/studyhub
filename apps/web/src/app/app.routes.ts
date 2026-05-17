import { Route } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Login } from './pages/auth/login/login';
import { Signup } from './pages/auth/signup/signup';

export const appRoutes: Route[] = [
  {
    path: '',
    component: Landing,
    title: 'StudyHub',
  },
  {
    path: 'login',
    component: Login,
    title: 'Log In | StudyHub',
  },
  {
    path: 'signup',
    component: Signup,
    title: 'Sign Up | StudyHub',
  },
];
