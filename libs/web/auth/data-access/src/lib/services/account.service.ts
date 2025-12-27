import { inject, Injectable } from '@angular/core';
import { APPWRITE } from '@wishare/web/shared/app-config';

import { Account, Databases, Models } from 'appwrite';
import { defer, from, map, Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly appwrite: {
    databases: Databases;
    account: Account;
  } = inject(APPWRITE);

  getAccount(): Observable<Models.User<Record<string, unknown>>> {
    return defer(() => from(this.appwrite.account.get()));
  }

  logInAsGuest(): Observable<{
    account: Models.User<Record<string, unknown>>;
    session: Models.Session;
  }> {
    const updatePrefs$ = defer(() =>
      this.appwrite.account.updatePrefs({ guest: true }),
    );

    return from(this.appwrite.account.createAnonymousSession()).pipe(
      switchMap((session) =>
        updatePrefs$.pipe(
          switchMap(() =>
            from(this.appwrite.account.get()).pipe(
              map((account) => ({
                session,
                account,
              })),
            ),
          ),
        ),
      ),
    );
  }
}
