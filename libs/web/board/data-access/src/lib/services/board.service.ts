import { inject, Injectable } from '@angular/core';

import { from, map, Observable, switchMap } from 'rxjs';

import { Account, Databases, ID, Permission, Query, Role } from 'appwrite';

import { APPWRITE } from '@wishare/web/shared/app-config';
import { leftJoin } from '@wishare/web/shared/operators';
import { Wish, Wishlist } from '@wishare/web/wishlist/data-access';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly appwrite: {
    databases: Databases;
    account: Account;
  } = inject(APPWRITE);

  getBoard() {
    return this.getWishlists().pipe(
      map((wishlists) => wishlists as unknown as Record<string, unknown>[]),
      leftJoin(this.appwrite.databases, 'wishare', '$id', 'wlid', 'wishes'),
    );
  }

  getWishlists(): Observable<Wishlist[]> {
    const account$ = from(this.appwrite.account.get());
    return account$.pipe(
      switchMap((account) =>
        from(
          this.appwrite.databases.listDocuments('wishare', 'wishlists', [
            Query.equal('uid', account.$id),
            Query.orderAsc('priority'),
          ]),
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
      this.appwrite.databases.listDocuments('wishare', 'wishes', [
        Query.equal('wlid', wlid),
      ]),
    ).pipe(map((docList) => docList.documents as unknown as Wish[]));
  }

  createWishlist(data: {
    title: string;
    description: string;
  }): Observable<Wishlist> {
    const account$ = from(this.appwrite.account.get());
    return account$.pipe(
      switchMap((account) =>
        // First fetch existing wishlists to determine the next priority
        from(
          this.appwrite.databases.listDocuments('wishare', 'wishlists', [
            Query.equal('uid', account.$id),
            Query.orderDesc('priority'),
            Query.limit(1),
          ]),
        ).pipe(
          switchMap((docList) => {
            // Calculate next priority: highest existing priority + 1, or 1 if none exist
            const maxPriority =
              docList.documents.length > 0
                ? (docList.documents[0] as unknown as Wishlist).priority
                : 0;
            const nextPriority = maxPriority + 1;

            return from(
              this.appwrite.databases.createDocument(
                'wishare',
                'wishlists',
                ID.unique(),
                {
                  title: data.title,
                  description: data.description,
                  visibility: 'draft',
                  priority: nextPriority,
                  uid: account.$id,
                },
                [
                  Permission.read(Role.user(account.$id)),
                  Permission.update(Role.user(account.$id)),
                  Permission.delete(Role.user(account.$id)),
                ],
              ),
            ).pipe(map((doc) => doc as unknown as Wishlist));
          }),
        ),
      ),
    );
  }

  /**
   * Updates the priority of multiple wishlists.
   * @param updates Array of objects containing wishlist ID and new priority
   * @returns Observable that completes when all updates are done
   */
  updateWishlistPriorities(
    updates: Array<{ id: string; priority: number }>,
  ): Observable<void> {
    const updatePromises = updates.map((update) =>
      this.appwrite.databases.updateDocument(
        'wishare',
        'wishlists',
        update.id,
        { priority: update.priority },
      ),
    );

    return from(Promise.all(updatePromises)).pipe(map(() => undefined));
  }
}
