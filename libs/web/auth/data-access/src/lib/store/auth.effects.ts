import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { rxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';

import { TranslocoService } from '@ngneat/transloco';
import { TuiAlertService } from '@taiga-ui/core';
import { APPWRITE } from '@wishare/web/shared/app-config';

import { catchError, from, map, of, Subject, switchMap, tap } from 'rxjs';
import { Account, Databases, ID, Models, OAuthProvider } from 'appwrite';
import { StreamState, toState } from '@wishare/web/shared/utils';

import { LoginResult } from './auth.types';

/**
 * UI Actions for authentication effects
 */
export interface AuthUIActions {
  loginWithCredentials: [string, string];
  registerWithCredentials: [string, string, string];
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
  private readonly _loginState$ = new Subject<StreamState<LoginResult>>();
  private readonly _registerState$ = new Subject<StreamState<LoginResult>>();
  private readonly _logoutState$ = new Subject<StreamState<void>>();

  readonly loginState$ = this._loginState$.asObservable();
  readonly registerState$ = this._registerState$.asObservable();
  readonly logoutState$ = this._logoutState$.asObservable();

  // Effects registered directly
  private readonly effects = rxEffects(({ register }) => {
    register(
      this.actions.loginWithCredentials$.pipe(
        switchMap(([email, password]: [string, string]) =>
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
            }) as LoginResult,
        ),
        tap(() => this.router.navigate(['/wishlists'])),
        toState(),
        catchError((error) => {
          console.error('Login error:', error);
          this.actions.loginError();
          return of({
            isLoading: false,
            hasError: true,
            error,
            hasValue: false,
            value: null,
          } as StreamState<LoginResult>);
        }),
      ),
      (state) => this._loginState$.next(state),
    );

    register(
      this.actions.registerWithCredentials$.pipe(
        switchMap(([email, name, password]) =>
          from(
            this.appwrite.account.create({
              userId: ID.unique(),
              email,
              password,
              name: name ?? undefined,
            }),
          ).pipe(map(() => ({ email, password }))),
        ),
        switchMap(({ email, password }) =>
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
            }) as LoginResult,
        ),
        tap(() => this.router.navigate(['/'])),
        toState(),
        catchError((error) => {
          console.error('Registration error:', error);
          this.router.navigate(['/login']);
          return of({
            isLoading: false,
            hasError: true,
            error,
            hasValue: false,
            value: null,
          } as StreamState<LoginResult>);
        }),
      ),
      (state) => this._registerState$.next(state),
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
        switchMap((trans: string) => this.alertService.open(trans)),
      ),
    );

    register(
      this.actions.logout$.pipe(
        switchMap(() =>
          this.appwrite.account.deleteSession({ sessionId: 'current' }),
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
