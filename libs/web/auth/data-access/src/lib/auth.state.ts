import { inject, Injectable } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { RxActionFactory } from '@rx-angular/state/actions';
import { AuthStateModel } from './auth-state.model';

import { WithInitializer } from '@wishare/web/shared/utils';
import { catchError, map, of, switchMap } from 'rxjs';
import { AccountService } from './services/account.service';

export interface AuthCommand {
  fetchAccount: void;
}

@Injectable({
  providedIn: 'root',
})
export class AuthState
  extends RxState<AuthStateModel>
  implements WithInitializer
{
  private readonly rxAction = inject(RxActionFactory<AuthCommand>);
  private readonly accountService = inject(AccountService);
  readonly actions = this.rxAction.create();
  readonly session$ = this.select('session');
  readonly account$ = this.select('account');

  readonly preferences$ = this.account$.pipe(
    map((account) => (account ? account.prefs : {}))
  );

  readonly isGuest$ = this.preferences$.pipe(
    map(
      (prefs) =>
        Object.prototype.hasOwnProperty.call(prefs, 'guest') &&
        prefs.guest === true
    )
  );

  constructor() {
    super();

    this.connect(
      'account',
      this.actions.fetchAccount$.pipe(
        switchMap(() => this.accountService.getAccount()),
        catchError(() => of(null))
      )
    );
  }

  initialize(): void {
    this.actions.fetchAccount();
  }
}
