import { provideAnimations } from '@angular/platform-browser/animations';
import { ApplicationConfig, enableProdMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { APP_PROVIDERS } from './app.providers';
import { provideTransloco, TranslocoConfig } from '@jsverse/transloco';
import { availableLangs } from 'scoped-translations';
import { environment } from '../environments/environment';
import { translocoLoader } from '../transloco-loader';
import { provideTaiga } from '@taiga-ui/core';

if (environment.production) {
  enableProdMode();
}

export const appConfig: ApplicationConfig = {
  providers: [
    APP_PROVIDERS,
    provideAnimations(),
    provideRouter(appRoutes),
    provideHttpClient(),
    provideTaiga(),
    provideTransloco({
      config: {
        reRenderOnLangChange: true,
        availableLangs,
        defaultLang: 'da',
        prodMode: environment.production,
        interpolation: ['{{', '}}'],
      } as TranslocoConfig,
    }),
    translocoLoader,
  ],
};
