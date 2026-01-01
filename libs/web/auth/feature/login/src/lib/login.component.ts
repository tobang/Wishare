import { TuiTabs } from '@taiga-ui/kit';

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { scopeLoader } from 'scoped-translations';

import { FormsModule } from '@angular/forms';
import { AuthStore } from '@wishare/web/auth/data-access';
import { EmailLoginComponent } from '@wishare/web/auth/ui/email-login';
import { SignupComponent } from '@wishare/web/auth/ui/signup';

/**
 * Standalone login page component.
 * Used for the /login route with full branding panel.
 */
@Component({
  selector: 'wishare-login',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    TuiTabs,
    EmailLoginComponent,
    SignupComponent,
  ],
  providers: [
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
  private readonly authStore = inject(AuthStore);
  activeItemIndex = 0;

  login(credentials: { email: string; password: string }) {
    this.authStore.actions.loginWithCredentials({
      email: credentials.email,
      password: credentials.password,
    });
  }

  signup(credentials: { email: string; password: string; name?: string }) {
    this.authStore.actions.registerWithCredentials({
      email: credentials.email,
      name: credentials.name ?? '',
      password: credentials.password,
    });
  }
}
