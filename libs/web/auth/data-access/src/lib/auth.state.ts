import { inject, Injectable, computed } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';
import { AuthStateModel } from './auth-state.model';

import { WithInitializer } from '@wishare/web/shared/utils';
import { catchError, map, of, switchMap } from 'rxjs';
import { AccountService } from './services/account.service';

export interface AuthCommand {
  fetchAccount: void;
  updateAuthState: Partial<AuthStateModel>;
}

@Injectable({
  providedIn: 'root',
})
export class AuthState implements WithInitializer {
  private readonly accountService = inject(AccountService);
  public readonly actions = rxActions<AuthCommand>();
  
  public readonly store = rxState<AuthStateModel>(({ connect, set }) => {
    connect(
      'account',
      this.actions.fetchAccount$.pipe(
        switchMap(() => this.accountService.getAccount()),
        catchError(() => of(null))
      )
    );

    connect(this.actions.updateAuthState$, (state, update) => ({
      ...state,
      ...update
    }));
  });

  readonly session = this.store.signal('session');
  readonly account = this.store.signal('account');

  readonly preferences = computed(() => {
    const account = this.account();
    return account ? account.prefs : {};
  });

  readonly isGuest = computed(() => {
    const prefs = this.preferences();
    return Object.prototype.hasOwnProperty.call(prefs, 'guest') &&
      prefs.guest === true;
  });

  initialize(): void {
    this.actions.fetchAccount();
  }
}
