
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RxActionFactory } from '@rx-angular/state/actions';
import { catchError, defer, from, map, merge, of, switchMap, tap } from 'rxjs';

import { AuthState } from './auth.state';

import { TranslocoService } from '@ngneat/transloco';
import { TuiAlertService } from '@taiga-ui/core';
import { APPWRITE } from '@wishare/web/shared/app-config';

import { Account, Databases, Models, OAuthProvider } from 'appwrite';

type Actions = {
  loginWithCredentials: [string, string];
  registerWithCredentials: [string, string, string];
  logout: void;
  loginWithGoogle: void;
  loginError: void;
};

@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private readonly router: Router = inject(Router);
  private readonly appwrite: {
    database: Databases;
    account: Account;
  } = inject(APPWRITE);
  private readonly authState: AuthState = inject(AuthState);
  private readonly alertService = inject(TuiAlertService);
  private readonly transloco = inject(TranslocoService);

  readonly ui = new RxActionFactory<Actions>().create();

  private readonly sideEffects$ = merge(
    // Logout
    this.ui.logout$.pipe(
      switchMap(() =>
        from(this.appwrite.account.deleteSession('current')).pipe(
          tap(() => {
            this.authState.set({
              account: null,
              session: null,
            });
            localStorage.clear();
            sessionStorage.clear();
            this.router.navigate(['/']);
          })
        )
      )
    ),
    // Login with credentials
    this.ui.loginWithCredentials$.pipe(
      switchMap(([email, password]) => {
        console.log('Email', email, password, this.appwrite.account);
        return from(
          this.appwrite.account.createEmailPasswordSession(email, password)
        ).pipe(
          switchMap((session) =>
            from(this.appwrite.account.get()).pipe(
              map(
                (account) =>
                  [session, account] as [Models.Session, Models.Account<Record<string, unknown>>]
              )
            )
          ),
          map(([session, account]) => ({ session, account })),
          tap(() => this.router.navigate(['/wishlists'])),
          catchError(() =>
            of({ session: null, account: null }).pipe(
              tap(() => this.ui.loginError())
            )
          ),
          tap(({ account, session }) =>
            this.authState.set({
              account,
              session,
            })
          )
        );
      })
    ),
    // Register with credentials
    this.ui.registerWithCredentials$.pipe(
      switchMap(([email, name, password]) =>
        defer(() =>
          this.appwrite.account.create(
            'unique()',
            email,
            password,
            name ?? undefined
          )
        ).pipe(
          switchMap((account) =>
            defer(() =>
              this.appwrite.account.createEmailPasswordSession(email, password)
            ).pipe(map((session) => ({ session, account })))
          ),
          catchError(() =>
            of({ session: null, account: null }).pipe(
              tap(() => this.router.navigate(['/login']))
            )
          ),
          tap(({ account, session }) =>
            this.authState.set({
              account,
              session,
            })
          ),
          tap(() => this.router.navigate(['/']))
        )
      )
    ),
    // Login with Goolge
    this.ui.loginWithGoogle$.pipe(
      tap(() =>
        this.appwrite.account.createOAuth2Session(
          OAuthProvider.Google,
          location.origin,
          `${location.origin}/login`
        )
      )
    ),
    this.ui.loginError$.pipe(
      switchMap(() =>
        this.transloco.selectTranslate(
          'server-error.invalid-credentials',
          {},
          'login'
        )
      ),
      switchMap((trans) => {
        return this.alertService.open(trans);
      })
    )
  );

  constructor() {
    this.authState.hold(this.sideEffects$);
  }

  /* deleteAccount = () => {
    this.appwrite.account
      .delete()
      .then(() => this.authState.set({ account: null, session: null }))
      .then(() => localStorage.clear())
      .then(() => sessionStorage.clear())
      .then(() => this.router.navigate(['/login']));
  }; */
}
