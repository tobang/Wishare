import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { rxEffects } from '@rx-angular/state/effects';
import { from, Observable, switchMap, tap } from 'rxjs';

import { APPWRITE } from '@wishare/web/shared/app-config';
import { Account, Databases, OAuthProvider } from 'appwrite';
import { AuthStore } from '../auth.store';

/**
 * Effects for session management.
 *
 * Handles:
 * - Logout
 * - OAuth login
 */
@Injectable({
  providedIn: 'root',
})
export class AuthSessionEffects {
  private readonly router = inject(Router);
  private readonly appwrite: { databases: Databases; account: Account } =
    inject(APPWRITE);
  private readonly authStore = inject(AuthStore);

  register(actions: {
    logout$: Observable<unknown>;
    loginWithGoogle$: Observable<unknown>;
  }): void {
    rxEffects(({ register }) => {
      register(
        actions.logout$.pipe(
          switchMap(() =>
            from(
              this.appwrite.account.deleteSession({ sessionId: 'current' }),
            ).pipe(
              tap(() => {
                this.authStore.actions.updateAuthState({
                  account: null,
                  session: null,
                });
                localStorage.clear();
                sessionStorage.clear();
                this.router.navigate(['/']);
              }),
            ),
          ),
        ),
      );

      register(
        actions.loginWithGoogle$.pipe(
          tap(() =>
            this.appwrite.account.createOAuth2Session({
              provider: OAuthProvider.Google,
              success: location.origin,
              failure: `${location.origin}/login`,
            }),
          ),
        ),
      );
    });
  }
}
