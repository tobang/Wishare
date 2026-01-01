import { inject, Injectable, Injector } from '@angular/core';
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
  private readonly injector = inject(Injector);
  private readonly accountService = inject(AccountService);

  // Lazy injection of AuthEffects to break circular dependency:
  // LayoutComponent -> AuthStore -> AuthEffects -> rxEffects (needs DestroyRef)
  private _effects: AuthEffects | null = null;
  private get effects(): AuthEffects {
    if (!this._effects) {
      this._effects = this.injector.get(AuthEffects);
    }
    return this._effects;
  }

  public readonly actions = rxActions<AuthActions>();

  readonly vm: AuthViewModel;

  // Track if effects have been registered
  private _effectsRegistered = false;

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
      ),
    );
  });
  // #endregion State

  constructor() {
    // Initialize view model
    this.vm = createAuthViewModel(this.store);
  }

  /**
   * Initialize the store - registers effects and connects logout state.
   * This is called during APP_INITIALIZER, after all services are constructed.
   */
  initialize(): void {
    // Register effects if not already done
    if (!this._effectsRegistered) {
      this.effects.register(this.actions);
      this._effectsRegistered = true;

      // Connect logout state after effects are registered
      // This must be done here to avoid circular dependency during construction
      this.store.connect(
        'account',
        this.effects.logoutState$.pipe(
          filter((state) => state.hasValue),
          map(() => null),
        ),
      );
    }

    this.actions.fetchAccount();
  }
}
