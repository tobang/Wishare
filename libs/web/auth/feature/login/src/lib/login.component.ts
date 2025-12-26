import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiTabs } from '@taiga-ui/kit';

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { RxState } from '@rx-angular/state';
import { scopeLoader } from 'scoped-translations';

import { FormsModule } from '@angular/forms';
import { AccountService, AuthEffects } from '@wishare/web/auth/data-access';
import { EmailLoginComponent } from '@wishare/web/auth/ui/email-login';
import { SignupComponent } from '@wishare/web/auth/ui/signup';
export interface LoginModel {
  activeTab: 'login' | 'signup';
}

@Component({
  selector: 'wishare-login',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    TuiCardLarge,
    TuiTabs,
    EmailLoginComponent,
    SignupComponent,
  ],
  providers: [
    RxState,
    {
      provide: TRANSLOCO_SCOPE,

      useValue: {
        scope: 'login',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`),
        ),
      },
    },
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly loginState = inject(RxState<LoginModel>);
  private readonly authEffects = inject(AuthEffects);
  private readonly loginService = inject(AccountService);
  activeItemIndex = 0;

  constructor() {
    this.loginState.set({ activeTab: 'login' });
  }

  login(credentials: { email: string; password: string }) {
    this.authEffects.ui.loginWithCredentials([
      credentials.email,
      credentials.password,
    ]);
  }

  signup(credentials: { email: string; password: string }) {
    this.authEffects.ui.registerWithCredentials([
      credentials.email,
      '',
      credentials.password,
    ]);
  }
}
