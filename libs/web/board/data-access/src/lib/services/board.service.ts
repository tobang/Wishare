import { inject, Injectable } from '@angular/core';

import {
  catchError,
  from,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import { Account, ID, Permission, Query, Role, TablesDB } from 'appwrite';

import { APPWRITE } from '@wishare/web/shared/app-config';
import {
  flattenWish,
  flattenWishlist,
  Wish,
  WishFlat,
  Wishlist,
  WishlistFlat,
} from '@wishare/web/wishlist/data-access';
import { BoardWishlist } from '../store/board.types';

// Database constants
const DATABASE_ID = 'wishare';
const WISHLISTS_TABLE = 'wishlists';
const WISHES_TABLE = 'wishes';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly appwrite: {
    tablesDb: TablesDB;
    account: Account;
  } = inject(APPWRITE);

  /**
   * Fetches all wishlists with their wishes in a single query
   * using TablesDB native relationship loading via Query.select()
   */
  getBoard(): Observable<BoardWishlist[]> {
    return from(this.appwrite.account.get()).pipe(
      switchMap((account) =>
        from(
          this.appwrite.tablesDb.listRows({
            databaseId: DATABASE_ID,
            tableId: WISHLISTS_TABLE,
            queries: [
              Query.equal('uid', account.$id),
              Query.orderAsc('priority'),
              Query.select(['*', 'wishes.*']),
            ],
          }),
        ),
      ),
      map((result) =>
        result.rows.map((row) => {
          const rowData = row as unknown as Record<string, unknown>;
          const flatWishlist = flattenWishlist(row as unknown as Wishlist);
          const rawWishes = Array.isArray(rowData['wishes'])
            ? rowData['wishes']
            : [];
          const wishes = rawWishes.map((wish) => flattenWish(wish as Wish));

          return {
            ...flatWishlist,
            wishes:
              wishes.length > 0
                ? { total: wishes.length, rows: wishes }
                : undefined,
          } as BoardWishlist;
        }),
      ),
    );
  }

  getWishlists(): Observable<WishlistFlat[]> {
    return from(this.appwrite.account.get()).pipe(
      switchMap((account) =>
        from(
          this.appwrite.tablesDb.listRows({
            databaseId: DATABASE_ID,
            tableId: WISHLISTS_TABLE,
            queries: [
              Query.equal('uid', account.$id),
              Query.orderAsc('priority'),
            ],
          }),
        ),
      ),
      map((result) =>
        result.rows.map((row) => flattenWishlist(row as unknown as Wishlist)),
      ),
    );
  }

  /**
   * Get wishes for a specific wishlist using the native relationship
   */
  getWishes(wishlistId: string): Observable<WishFlat[]> {
    return from(
      this.appwrite.tablesDb.listRows({
        databaseId: DATABASE_ID,
        tableId: WISHES_TABLE,
        queries: [Query.equal('wishlist', wishlistId)],
      }),
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
    return from(this.appwrite.account.get()).pipe(
      switchMap((account) =>
        from(
          this.appwrite.tablesDb.listRows({
            databaseId: DATABASE_ID,
            tableId: WISHLISTS_TABLE,
            queries: [
              Query.equal('uid', account.$id),
              Query.orderDesc('priority'),
              Query.limit(1),
            ],
          }),
        ).pipe(
          switchMap((result) => {
            const maxPriority = this.extractPriority(result.rows[0]);
            const nextPriority = maxPriority + 1;

            return from(
              this.appwrite.tablesDb.createRow({
                databaseId: DATABASE_ID,
                tableId: WISHLISTS_TABLE,
                rowId: ID.unique(),
                data: {
                  title: data.title,
                  description: data.description,
                  visibility: 'draft',
                  priority: nextPriority,
                  uid: account.$id,
                },
                permissions: [
                  Permission.read(Role.user(account.$id)),
                  Permission.update(Role.user(account.$id)),
                  Permission.delete(Role.user(account.$id)),
                ],
              }),
            );
          }),
        ),
      ),
      map((row) => flattenWishlist(row as unknown as Wishlist)),
    );
  }

  /**
   * Updates the priority of multiple wishlists.
   * Uses a two-phase sequential approach to avoid unique constraint violations
   * on the (priority, uid) index:
   * Phase 1: Move all to temporary priorities (safe range) - sequentially
   * Phase 2: Set final priorities (starting from 1) - sequentially
   *
   * Note: Priority field has min:1, max:999 constraint
   */
  updateWishlistPriorities(
    updates: Array<{ id: string; priority: number; oldPriority?: number }>,
  ): Observable<void> {
    if (updates.length === 0) {
      return of(undefined);
    }

    // Find a safe temp range
    // We need a range of size updates.length that doesn't overlap with any oldPriority
    // and fits within 1..999.
    // We prefer high numbers (500+) to avoid conflicts with stable items (usually 1..N).
    const occupied = new Set(
      updates
        .map((u) => u.oldPriority)
        .filter((p): p is number => p !== undefined),
    );
    const count = updates.length;
    let tempOffset = 500;
    let found = false;

    // Strategy: Try to find a gap in 500..999
    for (let start = 500; start <= 999 - count + 1; start++) {
      let safe = true;
      for (let i = 0; i < count; i++) {
        if (occupied.has(start + i)) {
          safe = false;
          break;
        }
      }
      if (safe) {
        tempOffset = start;
        found = true;
        break;
      }
    }

    // Fallback: Try 100..500 if 500+ is full/fragmented
    if (!found) {
      for (let start = 100; start <= 500 - count + 1; start++) {
        let safe = true;
        for (let i = 0; i < count; i++) {
          if (occupied.has(start + i)) {
            safe = false;
            break;
          }
        }
        if (safe) {
          tempOffset = start;
          found = true;
          break;
        }
      }
    }

    // Helper to run updates sequentially
    const runSequentially = async (
      items: Array<{ id: string; priority: number }>,
    ) => {
      for (const item of items) {
        await this.appwrite.tablesDb.updateRow({
          databaseId: DATABASE_ID,
          tableId: WISHLISTS_TABLE,
          rowId: item.id,
          data: { priority: item.priority },
        });
      }
    };

    // Phase 1: Move to temporary priorities to avoid conflicts
    const tempUpdates = updates.map((update, index) => ({
      id: update.id,
      priority: tempOffset + index,
    }));

    // Phase 2: Set final priorities (1-based)
    const finalUpdates = updates.map((u) => ({
      id: u.id,
      priority: u.priority,
    }));

    return from(runSequentially(tempUpdates)).pipe(
      switchMap(() => from(runSequentially(finalUpdates))),
      map(() => undefined),
      catchError((error) => throwError(() => error)),
    );
  }

  /**
   * Deletes a wishlist by its ID.
   * This will also delete all wishes associated with the wishlist due to cascade delete.
   */
  deleteWishlist(wishlistId: string): Observable<void> {
    return from(
      this.appwrite.tablesDb.deleteRow({
        databaseId: DATABASE_ID,
        tableId: WISHLISTS_TABLE,
        rowId: wishlistId,
      }),
    ).pipe(map(() => undefined));
  }

  /**
   * Extracts priority from a TablesDB row, handling both nested and flat data structures
   */
  private extractPriority(row: unknown): number {
    if (!row) return 0;
    const rowData = row as Record<string, unknown>;
    // TablesDB returns data at top level
    return (rowData['priority'] as number) ?? 0;
  }
}
