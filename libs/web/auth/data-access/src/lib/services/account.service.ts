import { inject, Injectable } from '@angular/core';
import { APPWRITE } from '@wishare/web/shared/app-config';

import { Account, Databases, Models } from 'appwrite';
import { defer, from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly appwrite: {
    databases: Databases;
    account: Account;
  } = inject(APPWRITE);

  getAccount(): Observable<Models.User<Record<string, unknown>>> {
    return defer(() => from(this.appwrite.account.get()));
  }
}
