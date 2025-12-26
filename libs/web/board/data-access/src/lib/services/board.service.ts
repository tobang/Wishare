import { Inject, Injectable } from '@angular/core';

import { from, map, Observable, switchMap } from 'rxjs';

import { Account, Databases, ID, Permission, Query, Role } from 'appwrite';

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
    const account$ = from(this.appwrite.account.get());
    return account$.pipe(
      switchMap((account) =>
        from(
          this.appwrite.database.listDocuments({
            databaseId: 'wishare',
            collectionId: 'wishlists',
            queries: [Query.equal('uid', account.$id)],
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

  createWishlist(): Observable<Wishlist> {
    const account$ = from(this.appwrite.account.get());
    return account$.pipe(
      switchMap((account) =>
        from(
          this.appwrite.database.createDocument({
            databaseId: 'wishare',
            collectionId: 'wishlists',
            documentId: ID.unique(),
            data: {
              title: 'New Wishlist',
              description: '',
              visibility: 'draft',
              priority: 1,
              uid: account.$id,
            },
            permissions: [
              Permission.read(Role.user(account.$id)),
              Permission.update(Role.user(account.$id)),
              Permission.delete(Role.user(account.$id)),
            ],
          }),
        ).pipe(map((doc) => doc as unknown as Wishlist)),
      ),
    );
  }
}
