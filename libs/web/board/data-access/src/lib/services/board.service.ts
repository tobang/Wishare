import { inject, Injectable } from '@angular/core';

import {
  catchError,
  concat,
  from,
  last,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import { Account, ID, Permission, Query, Role, TablesDB } from 'appwrite';

import { APPWRITE } from '@wishare/web/shared/app-config';
import { leftJoin } from '@wishare/web/shared/operators';
import {
  flattenWish,
  flattenWishlist,
  Wish,
  WishFlat,
  Wishlist,
  WishlistFlat,
} from '@wishare/web/wishlist/data-access';
import { BoardWishlist } from '../store/board.types';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly appwrite: {
    tablesDb: TablesDB;
    account: Account;
  } = inject(APPWRITE);

  getBoard(): Observable<BoardWishlist[]> {
    return this.getWishlists().pipe(
      leftJoin<WishlistFlat, WishFlat, 'wishes'>(
        this.appwrite.tablesDb,
        'wishare',
        '$id',
        'wlid',
        'wishes',
      ),
    );
  }

  getWishlists(): Observable<WishlistFlat[]> {
    const databaseId = 'wishare';
    const tableId = 'wishlists';

    const account$ = from(this.appwrite.account.get());
    return account$.pipe(
      switchMap((account) => {
        const queries = [
          Query.equal('uid', account.$id),
          Query.orderAsc('priority'),
        ];

        return from(
          this.appwrite.tablesDb.listRows({
            databaseId,
            tableId,
            queries,
          }),
        );
      }),
      map((result) =>
        result.rows.map((row) => flattenWishlist(row as unknown as Wishlist)),
      ),
    );
  }
  getWishes(wlid: string): Observable<WishFlat[]> {
    const databaseId = 'wishare';
    const tableId = 'wishes';
    const queries = [Query.equal('wlid', wlid)];

    return from(
      this.appwrite.tablesDb.listRows({ databaseId, tableId, queries }),
    ).pipe(
      map((result) =>
        result.rows.map((row) => flattenWish(row as unknown as Wish)),
      ),
    );
  }

  createWishlist(data: {
    title: string;
    description: string;
  }): Observable<WishlistFlat> {
    const databaseId = 'wishare';
    const tableId = 'wishlists';

    const account$ = from(this.appwrite.account.get());
    return account$.pipe(
      switchMap((account) => {
        // First fetch existing wishlists to determine the next priority
        const queries = [
          Query.equal('uid', account.$id),
          Query.orderDesc('priority'),
          Query.limit(1),
        ];

        return from(
          this.appwrite.tablesDb.listRows({
            databaseId,
            tableId,
            queries,
          }),
        ).pipe(
          switchMap((result) => {
            // Calculate next priority: highest existing priority + 1, or 1 if none exist
            const maxPriority =
              result.rows.length > 0
                ? (result.rows[0] as unknown as Wishlist).data.priority
                : 0;
            const nextPriority = maxPriority + 1;

            const rowId = ID.unique();
            const rowData = {
              title: data.title,
              description: data.description,
              visibility: 'draft',
              priority: nextPriority,
              uid: account.$id,
            };
            const permissions = [
              Permission.read(Role.user(account.$id)),
              Permission.update(Role.user(account.$id)),
              Permission.delete(Role.user(account.$id)),
            ];

            return from(
              this.appwrite.tablesDb.createRow({
                databaseId,
                tableId,
                rowId,
                data: rowData,
                permissions,
              }),
            ).pipe(map((row) => flattenWishlist(row as unknown as Wishlist)));
          }),
        );
      }),
    );
  }

  /**
   * Updates the priority of multiple wishlists.
   * Uses a two-phase update to avoid violating the unique constraint on (priority, uid):
   * Phase 1: Move all wishlists to temporary high priorities (500-999 range)
   * Phase 2: Update to final priorities (1-based)
   *
   * @param updates Array of objects containing wishlist ID and new priority
   * @returns Observable that completes when all updates are done
   */
  updateWishlistPriorities(
    updates: Array<{ id: string; priority: number }>,
  ): Observable<void> {
    if (updates.length === 0) {
      return of(undefined);
    }

    const tempPriorityOffset = 500;

    const updatePriority$ = (id: string, priority: number): Observable<void> =>
      from(
        this.appwrite.tablesDb.updateRow('wishare', 'wishlists', id, {
          priority,
        }),
      ).pipe(
        map(() => undefined),
        catchError((error) => {
          console.error(`Failed to update wishlist ${id} priority:`, error);
          return throwError(() => error);
        }),
      );

    // Phase 1: Move all wishlists to temporary high priorities (500+)
    const phase1$: Observable<void> = concat(
      ...updates.map((update, index) =>
        updatePriority$(update.id, tempPriorityOffset + index),
      ),
    );

    // Phase 2: Update to final priorities
    const phase2$: Observable<void> = concat(
      ...updates.map((update) => updatePriority$(update.id, update.priority)),
    );

    // Execute phase 1, then phase 2, return last emission
    return concat(phase1$, phase2$).pipe(last());
  }
}
