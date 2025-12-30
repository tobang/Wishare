import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';

import { WithInitializer } from '@wishare/web/shared/utils';
import { catchError, filter, map, merge, of, switchMap } from 'rxjs';
import { AccountService } from '../services/account.service';
import { createAuthViewModel, AuthViewModel } from './auth.selectors';
import { AuthActions, AuthStateModel } from './auth.types';
import { AuthEffects } from './auth.effects';

/**
 * Store managing the state for authentication.
 *
 * Key responsibilities:
 * - Managing user account and session state
 * - Fetching account information
 * - Coordinating async operations (login, register, logout)
 *
 * @see AuthStateModel for the complete state shape
 * @see AuthEffects for authentication side effects
 */
@Injectable({
  providedIn: 'root',
})
export class AuthStore implements WithInitializer {
  private readonly accountService = inject(AccountService);
  private readonly effects = inject(AuthEffects);

  public readonly actions = rxActions<AuthActions>();

  // Register effects early so streams are available for state connections
  private readonly _effectsRegistered = this.effects.register(this.actions);

  readonly vm: AuthViewModel;

  // #region State
  private readonly store = rxState<AuthStateModel>(({ connect, set }) => {
    // Initialize with undefined to distinguish "not loaded" from "no user"
    set({
      account: undefined,
    });

    /**
     * Account state updates from:
     * - Initial fetch on app startup
     * - Direct setAccount action (used by effects before navigation)
     * - Logout clearing the account
     */
    connect(
      'account',
      merge(
        // Fetch account on initialization
        this.actions.fetchAccount$.pipe(
          switchMap(() =>
            this.accountService.getAccount().pipe(
              map((account) => account as AuthStateModel['account']),
              catchError(() => of(null)),
            ),
          ),
        ),
        // Direct account update from setAccount action
        this.actions.setAccount$,
        // Clear account on logout
        this.effects.logoutState$.pipe(
          filter((state) => state.hasValue),
          map(() => null),
        ),
      ),
    );
  });
  // #endregion State

  constructor() {
    // Initialize view model
    this.vm = createAuthViewModel(this.store);
  }

  initialize(): void {
    this.actions.fetchAccount();
  }
}
