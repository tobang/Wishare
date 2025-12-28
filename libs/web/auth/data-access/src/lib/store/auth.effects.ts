import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { rxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';

import { TranslocoService } from '@ngneat/transloco';
import { TuiAlertService } from '@taiga-ui/core';
import { APPWRITE } from '@wishare/web/shared/app-config';

import {
  catchError,
  EMPTY,
  from,
  map,
  ReplaySubject,
  switchMap,
  tap,
} from 'rxjs';
import { Account, Databases, ID, Models, OAuthProvider } from 'appwrite';
import { StreamState, toState } from '@wishare/web/shared/utils';

import { LoginResult } from './auth.types';

/**
 * Credentials for login with email and password
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Credentials for registration with email, name, and password
 */
export interface RegisterCredentials {
  email: string;
  name: string;
  password: string;
}

/**
 * UI Actions for authentication effects
 */
export interface AuthUIActions {
  loginWithCredentials: LoginCredentials;
  registerWithCredentials: RegisterCredentials;
  logout: void;
  loginWithGoogle: void;
  loginError: void;
}

/**
 * Effects for authentication actions.
 *
 * Handles:
 * - Login with credentials
 * - Registration with credentials
 * - Logout
 * - OAuth login
 * - Error handling and navigation
 */
@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private readonly router = inject(Router);
  private readonly appwrite: { databases: Databases; account: Account } =
    inject(APPWRITE);
  private readonly alertService = inject(TuiAlertService);
  private readonly transloco = inject(TranslocoService);

  // Public actions for UI interactions
  public readonly actions = rxActions<AuthUIActions>();

  // Internal state update streams
  // These are populated by effects and consumed by the store
  // Using ReplaySubject(1) so late subscribers get the last emitted value
  private readonly _loginState$ = new ReplaySubject<StreamState<LoginResult>>(
    1,
  );
  private readonly _registerState$ = new ReplaySubject<
    StreamState<LoginResult>
  >(1);
  private readonly _logoutState$ = new ReplaySubject<StreamState<void>>(1);

  readonly loginState$ = this._loginState$.asObservable();
  readonly registerState$ = this._registerState$.asObservable();
  readonly logoutState$ = this._logoutState$.asObservable();

  // Effects registered directly
  private readonly effects = rxEffects(({ register }) => {
    register(
      this.actions.loginWithCredentials$.pipe(
        switchMap(({ email, password }) =>
          from(
            this.appwrite.account.createEmailPasswordSession({
              email,
              password,
            }),
          ).pipe(
            switchMap(() => this.appwrite.account.get()),
            map(
              (account) =>
                ({
                  account: account as Models.User<{ guest?: boolean }>,
                  session: null,
                }) as LoginResult,
            ),
          ),
        ),
        toState(),
      ),
      (state) => {
        if (state.hasValue) {
          this.router.navigate(['/wishlists']);
        }
        if (state.hasError) {
          console.error('Login error:', state.error);
          this.actions.loginError();
        }
        this._loginState$.next(state);
      },
    );

    register(
      this.actions.registerWithCredentials$.pipe(
        switchMap(({ email, name, password }) =>
          from(
            this.appwrite.account.create({
              userId: ID.unique(),
              email,
              password,
              name: name ?? undefined,
            }),
          ).pipe(
            switchMap(() =>
              this.appwrite.account.createEmailPasswordSession({
                email,
                password,
              }),
            ),
            switchMap(() => this.appwrite.account.get()),
            map(
              (account) =>
                ({
                  account: account as Models.User<{ guest?: boolean }>,
                  session: null,
                }) as LoginResult,
            ),
          ),
        ),
        toState(),
      ),
      (state) => {
        if (state.hasValue) {
          this.router.navigate(['/']);
        }
        if (state.hasError) {
          console.error('Registration error:', state.error);
          this.router.navigate(['/login']);
        }
        this._registerState$.next(state);
      },
    );

    register(
      this.actions.loginError$.pipe(
        switchMap(() =>
          this.transloco.selectTranslate(
            'server-error.invalid-credentials',
            {},
            'login',
          ),
        ),
        switchMap((trans: string) =>
          this.alertService.open(trans).pipe(
            catchError((error) => {
              console.error('Alert service error:', error);
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    register(
      this.actions.logout$.pipe(
        switchMap(() =>
          from(
            this.appwrite.account.deleteSession({ sessionId: 'current' }),
          ).pipe(
            catchError((error) => {
              console.error('Logout session deletion error:', error);
              // Continue with local cleanup even if server logout fails
              return EMPTY;
            }),
          ),
        ),
        tap(() => {
          localStorage.clear();
          sessionStorage.clear();
          this.router.navigate(['/']);
        }),
      ),
      () =>
        this._logoutState$.next({
          isLoading: false,
          hasError: false,
          hasValue: true,
          value: undefined,
        }),
    );

    // Note: OAuth redirects the browser away, so this stream won't complete normally.
    // The success/failure URLs handle the redirect back to the app.
    register(
      this.actions.loginWithGoogle$.pipe(
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
