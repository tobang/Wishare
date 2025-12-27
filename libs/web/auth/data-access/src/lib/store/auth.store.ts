import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';

import { WithInitializer } from '@wishare/web/shared/utils';
import { catchError, of, switchMap } from 'rxjs';
import { AccountService } from '../services/account.service';
import { createAuthViewModel } from './auth.selectors';
import { AuthActions, AuthStateModel } from './auth.types';

/**
 * Store managing the state for authentication.
 *
 * Key responsibilities:
 * - Managing user account and session state
 * - Fetching account information
 * - Providing derived state for preferences and guest status
 */
@Injectable({
  providedIn: 'root',
})
export class AuthStore implements WithInitializer {
  private readonly accountService = inject(AccountService);
  public readonly actions = rxActions<AuthActions>();

  public readonly store = rxState<AuthStateModel>(({ connect, set }) => {
    // Initialize with undefined to distinguish "not loaded" from "no user"
    set({ account: undefined as any, session: null });

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
  });

  public readonly vm = createAuthViewModel(this.store);

  initialize(): void {
    this.actions.fetchAccount();
  }
}
