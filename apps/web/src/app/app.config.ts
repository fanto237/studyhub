import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeFr from '@angular/common/locales/fr';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { authSessionInterceptor } from './core/interceptors/auth-session.interceptor';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

registerLocaleData(localeFr);
registerLocaleData(localeDe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authSessionInterceptor])),
    provideRouter(appRoutes),
  ],
};
