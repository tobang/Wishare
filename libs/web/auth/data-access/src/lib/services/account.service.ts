import { Inject, Injectable } from '@angular/core';
import { APPWRITE } from '@wishare/web/shared/app-config';

import { Account, Databases, Models } from 'appwrite';
import { defer, from, map, Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(
    @Inject(APPWRITE)
    private readonly appwrite: {
      database: Databases;
      account: Account;
    }
  ) {}

  getAccount(): Observable<Models.User<Record<string, unknown>>> {
    return defer(() => from(this.appwrite.account.get()));
  }

  logInAsGuest(): Observable<{
    account: Models.User<Record<string, unknown>>;
    session: Models.Session;
  }> {
    const updatePrefs$ = defer(() =>
      this.appwrite.account.updatePrefs({ guest: true })
    );

    return from(this.appwrite.account.createAnonymousSession()).pipe(
      switchMap((session) =>
        updatePrefs$.pipe(
          switchMap(() =>
            from(this.appwrite.account.get()).pipe(
              map((account) => ({
                session,
                account,
              }))
            )
          )
        )
      )
    );
  }
}
