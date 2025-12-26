import { APP_INITIALIZER, Provider } from '@angular/core';
import { RxActionFactory } from '@rx-angular/state/actions';
import { AuthState } from '@wishare/web/auth/data-access';
import { getAppConfigProvider } from '@wishare/web/shared/app-config';

import { environment } from '../environments/environment';

export const APP_PROVIDERS: Provider[] = [
  RxActionFactory,
  getAppConfigProvider(environment),
  {
    provide: APP_INITIALIZER,
    useFactory: (authState: AuthState) => {
      return (): void => authState.initialize();
    },
    multi: true,
    deps: [AuthState],
  },
];
