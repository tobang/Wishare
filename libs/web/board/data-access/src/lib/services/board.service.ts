import { Inject, Injectable } from '@angular/core';

import { from, map, Observable, switchMap } from 'rxjs';

import { Account, Databases, Query } from 'appwrite';

import { APPWRITE } from '@wishare/web/shared/app-config';
import { leftJoin } from '@wishare/web/shared/operators';
import { Wish, Wishlist } from '@wishare/web/wishlist/data-access';

@Injectable({ providedIn: 'root' })
export class BoardService {
  constructor(
    @Inject(APPWRITE)
    private readonly appwrite: {
      database: Databases;
      account: Account;
    },
  ) {}

  getBoard() {
    return this.getWishlists().pipe(
      map((wishlists) => wishlists as unknown as Record<string, unknown>[]),
      leftJoin(this.appwrite.database, 'wishare', '$id', 'wlid', 'wishes'),
    );
  }

  getWishlists(): Observable<Wishlist[]> {
    const session$ = from(this.appwrite.account.getSession({ sessionId: 'current' }));
    return session$.pipe(
      switchMap((session) =>
        from(
          this.appwrite.database.listDocuments({
            databaseId: 'wishare',
            collectionId: 'wishlists',
            queries: [Query.equal('uid', session.userId)],
          }),
        ).pipe(
          map((docList) =>
            docList.documents.map((doc) => doc as unknown as Wishlist),
          ),
        ),
      ),
    );
  }
  getWishes(wlid: string): Observable<Wish[]> {
    return from(
      this.appwrite.database.listDocuments({
        databaseId: 'wishare',
        collectionId: 'wishes',
        queries: [Query.equal('wlid', wlid)],
      }),
    ).pipe(map((docList) => docList.documents as unknown as Wish[]));
  }
}
