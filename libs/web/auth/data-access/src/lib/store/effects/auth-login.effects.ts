import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { rxEffects } from '@rx-angular/state/effects';
import { catchError, defer, from, map, of, switchMap, tap } from 'rxjs';

import { TranslocoService } from '@ngneat/transloco';
import { TuiAlertService } from '@taiga-ui/core';
import { APPWRITE } from '@wishare/web/shared/app-config';

import { Account, Databases, ID, Models } from 'appwrite';
import { AuthStore } from '../auth.store';

/**
 * Effects for authentication actions.
 *
 * Handles:
 * - Login with credentials
 * - Registration with credentials
 * - Error handling and navigation
 */
@Injectable({
  providedIn: 'root'
})
export class AuthLoginEffects {
  private readonly router = inject(Router);
  private readonly appwrite: { database: Databases; account: Account } = inject(APPWRITE);
  private readonly authStore = inject(AuthStore);
  private readonly alertService = inject(TuiAlertService);
  private readonly transloco = inject(TranslocoService);

  register(actions: any) {
    return rxEffects(({ register }) => {
      register(
        actions['loginWithCredentials$'].pipe(
          switchMap(([email, password]: [string, string]) => {
            console.log('Email', email, password, this.appwrite.account);
            return from(
              this.appwrite.account.createEmailPasswordSession({ email, password }),
            ).pipe(
              switchMap((session) =>
                from(this.appwrite.account.get()).pipe(
                  map(
                    (account) =>
                      [session, account] as [
                        Models.Session,
                        Models.User<{ guest?: boolean }>,
                      ],
                  ),
                ),
              ),
              map(([session, account]) => ({ session, account })),
              tap(() => this.router.navigate(['/wishlists'])),
              catchError((error) => {
                console.error('Login error:', error);
                return of({ session: null, account: null });
              }),
              tap(({ account, session }) =>
                this.authStore.actions.updateAuthState({
                  account,
                  session,
                }),
              ),
            );
          }),
        )
      );

      register(
        actions['registerWithCredentials$'].pipe(
          switchMap(([email, name, password]: [string, string, string]) =>
            defer(() =>
              this.appwrite.account.create({
                userId: ID.unique(),
                email,
                password,
                name: name ?? undefined,
              }),
            ).pipe(
              switchMap(() =>
                defer(() =>
                  this.appwrite.account.createEmailPasswordSession({
                    email,
                    password,
                  }),
                ).pipe(
                  switchMap((session) =>
                    from(this.appwrite.account.get()).pipe(
                      map((account) => ({
                        session,
                        account: account as Models.User<{ guest?: boolean }>,
                      })),
                    ),
                  ),
                ),
              ),
              catchError((error) => {
                console.error('Registration error:', error);
                return of({ session: null, account: null }).pipe(
                  tap(() => this.router.navigate(['/login'])),
                );
              }),
              tap(({ account, session }) =>
                this.authStore.actions.updateAuthState({
                  account,
                  session,
                }),
              ),
              tap(() => this.router.navigate(['/'])),
            ),
          ),
        )
      );

      register(
        actions['loginError$'].pipe(
          switchMap(() =>
            this.transloco.selectTranslate(
              'server-error.invalid-credentials',
              {},
              'login',
            ),
          ),
          switchMap((trans: string) => {
            return this.alertService.open(trans);
          }),
        )
      );
    });
  }
}
