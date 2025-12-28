import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';

import { WithInitializer } from '@wishare/web/shared/utils';
import { catchError, filter, map, of, switchMap } from 'rxjs';
import { AccountService } from '../services/account.service';
import { createAuthViewModel } from './auth.selectors';
import { AuthActions, AuthStateModel } from './auth.types';
import { AuthEffects } from './auth.effects';

const INITIAL_STREAM_STATE = {
  isLoading: false,
  hasError: false,
  hasValue: false,
  value: null,
};

/**
 * Store managing the state for authentication.
 *
 * Key responsibilities:
 * - Managing user account and session state
 * - Fetching account information
 * - Providing derived state for preferences and guest status
 * - Coordinating async operations (login, register, logout)
 * - Tracking loading/success/error states of auth operations
 *
 * @see AuthStateModel for the complete state shape
 * @see AuthEffects for authentication side effects
 */
@Injectable({
  providedIn: 'root',
})
export class AuthStore implements WithInitializer {
  private readonly accountService = inject(AccountService);
  private readonly authEffects = inject(AuthEffects);

  public readonly actions = rxActions<AuthActions>();

  // Expose UI actions from effects for external use
  public readonly ui = {
    loginWithCredentials: (credentials: [string, string]) =>
      this.authEffects.actions.loginWithCredentials(credentials),
    registerWithCredentials: (credentials: [string, string, string]) =>
      this.authEffects.actions.registerWithCredentials(credentials),
    loginError: () => this.authEffects.actions.loginError(),
    logout: () => this.authEffects.actions.logout(),
    loginWithGoogle: () => this.authEffects.actions.loginWithGoogle(),
  };

  // Internal state update streams for async operations
  // These are populated by effects and should not be exposed as public actions
  readonly loginState$ = this.authEffects.loginState$;
  readonly registerState$ = this.authEffects.registerState$;
  readonly logoutState$ = this.authEffects.logoutState$;

  public readonly store = rxState<AuthStateModel>(({ connect, set }) => {
    // Initialize with undefined to distinguish "not loaded" from "no user"
    set({
      account: undefined as any,
      session: null,
      loginState: INITIAL_STREAM_STATE,
      registerState: INITIAL_STREAM_STATE,
      logoutState: INITIAL_STREAM_STATE,
    });

    connect(
      'account',
      this.actions.fetchAccount$.pipe(
        switchMap(() => this.accountService.getAccount()),
        catchError(() => of(null)),
      ),
    );

    connect(this.actions.updateAuthState$, (state, update) => ({
      ...state,
      ...update,
    }));

    /**
     * Connect StreamState properties from effects.
     * These track the loading/success/error states of various async operations.
     * Using StreamState pattern ensures consistent state management across all operations.
     */
    connect('loginState', this.loginState$);
    connect('registerState', this.registerState$);
    connect('logoutState', this.logoutState$);

    // Update account and session from login state when successful
    connect(
      this.loginState$.pipe(
        filter((state) => state.hasValue && state.value !== null),
        map((state) => ({
          account: state.value?.account,
          session: state.value?.session ?? null,
        })),
      ),
    );

    // Update account and session from register state when successful
    connect(
      this.registerState$.pipe(
        filter((state) => state.hasValue && state.value !== null),
        map((state) => ({
          account: state.value?.account,
          session: state.value?.session ?? null,
        })),
      ),
    );

    // Clear account and session on logout
    connect(
      this.logoutState$.pipe(
        filter((state) => state.hasValue),
        map(() => ({
          account: null,
          session: null,
        })),
      ),
    );

    // Reset StreamState properties
    connect(this.actions.resetLoginState$, () => ({
      loginState: INITIAL_STREAM_STATE,
    }));

    connect(this.actions.resetRegisterState$, () => ({
      registerState: INITIAL_STREAM_STATE,
    }));

    connect(this.actions.resetLogoutState$, () => ({
      logoutState: INITIAL_STREAM_STATE,
    }));
  });

  public readonly vm = createAuthViewModel(this.store);

  initialize(): void {
    this.actions.fetchAccount();
  }
}
