import { inject, Injectable } from '@angular/core';

import {
  catchError,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import {
  Account,
  ID,
  Permission,
  Query,
  Role,
  Storage,
  TablesDB,
} from 'appwrite';

import { APPWRITE } from '@wishare/web/shared/app-config';
import {
  flattenWish,
  flattenWishlist,
  Wish,
  WishFlat,
  Wishlist,
  WishlistFlat,
} from '@wishare/web/wishlist/data-access';
import { BoardWishlist, CreateWishData } from '../store/board.types';

// Database constants
const DATABASE_ID = 'wishare';
const WISHLISTS_TABLE = 'wishlists';
const WISHES_TABLE = 'wishes';
const WISH_IMAGES_BUCKET = 'wish-images';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly appwrite: {
    tablesDb: TablesDB;
    account: Account;
    storage: Storage;
  } = inject(APPWRITE);

  /**
   * Fetches all wishlists with their wishes.
   * First fetches wishlists, then fetches all wishes for the user and groups them.
   */
  getBoard(): Observable<BoardWishlist[]> {
    return from(this.appwrite.account.get()).pipe(
      switchMap((account) =>
        forkJoin({
          wishlists: from(
            this.appwrite.tablesDb.listRows({
              databaseId: DATABASE_ID,
              tableId: WISHLISTS_TABLE,
              queries: [
                Query.equal('uid', account.$id),
                Query.orderAsc('priority'),
              ],
            }),
          ),
          wishes: from(
            this.appwrite.tablesDb.listRows({
              databaseId: DATABASE_ID,
              tableId: WISHES_TABLE,
              queries: [Query.equal('uid', account.$id)],
            }),
          ),
        }),
      ),
      map(({ wishlists, wishes }) => {
        // Group wishes by wishlist ID (wlid)
        const wishesByWishlist = new Map<string, WishFlat[]>();
        wishes.rows.forEach((row) => {
          const wish = flattenWish(row as unknown as Wish);
          const wishData = row as unknown as Record<string, unknown>;
          const wlid = (wishData['wlid'] as string) || '';
          if (wlid) {
            const existing = wishesByWishlist.get(wlid) || [];
            existing.push(wish);
            wishesByWishlist.set(wlid, existing);
          }
        });

        // Map wishlists with their wishes
        return wishlists.rows.map((row) => {
          const flatWishlist = flattenWishlist(row as unknown as Wishlist);
          const wishlistWishes = wishesByWishlist.get(flatWishlist.$id) || [];

          return {
            ...flatWishlist,
            wishes:
              wishlistWishes.length > 0
                ? { total: wishlistWishes.length, rows: wishlistWishes }
                : undefined,
          } as BoardWishlist;
        });
      }),
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
   * Get wishes for a specific wishlist using the wlid field
   */
  getWishes(wishlistId: string): Observable<WishFlat[]> {
    return from(
      this.appwrite.tablesDb.listRows({
        databaseId: DATABASE_ID,
        tableId: WISHES_TABLE,
        queries: [Query.equal('wlid', wishlistId)],
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
   * Updates a wishlist's title and description
   */
  updateWishlist(
    wishlistId: string,
    data: {
      title: string;
      description: string;
    },
  ): Observable<WishlistFlat> {
    return from(
      this.appwrite.tablesDb.updateRow({
        databaseId: DATABASE_ID,
        tableId: WISHLISTS_TABLE,
        rowId: wishlistId,
        data: {
          title: data.title,
          description: data.description,
        },
      }),
    ).pipe(map((row) => flattenWishlist(row as unknown as Wishlist)));
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
   * Creates a new wish with optional image uploads.
   * Uploads images first, then creates the wish with file references.
   *
   * @param wishlistId - The ID of the wishlist to add the wish to
   * @param data - The wish data
   * @param images - Optional array of File objects to upload
   * @returns Observable of the created wish
   */
  createWish(
    wishlistId: string,
    data: CreateWishData,
    images?: File[],
  ): Observable<WishFlat> {
    console.log('[BoardService] createWish called', {
      wishlistId,
      data,
      images,
    });

    return from(this.appwrite.account.get()).pipe(
      switchMap((account) => {
        console.log('[BoardService] Got account', account.$id);

        return from(
          this.appwrite.tablesDb.listRows({
            databaseId: DATABASE_ID,
            tableId: WISHES_TABLE,
            queries: [
              Query.equal('wlid', wishlistId),
              Query.orderDesc('priority'),
              Query.limit(1),
            ],
          }),
        ).pipe(
          switchMap((result) => {
            const maxPriority = this.extractPriority(result.rows[0]);
            const nextPriority = maxPriority + 1;
            console.log('[BoardService] Next priority', nextPriority);

            // If there are images, upload them first
            if (images && images.length > 0) {
              console.log('[BoardService] Uploading', images.length, 'images');
              return this.uploadWishImages(images, account.$id).pipe(
                switchMap((fileIds) => {
                  console.log(
                    '[BoardService] Images uploaded, fileIds:',
                    fileIds,
                  );
                  return this.createWishRow(
                    wishlistId,
                    account.$id,
                    data,
                    nextPriority,
                    fileIds,
                  );
                }),
              );
            }

            // No images, just create the wish
            console.log('[BoardService] No images, creating wish directly');
            return this.createWishRow(
              wishlistId,
              account.$id,
              data,
              nextPriority,
              [],
            );
          }),
        );
      }),
      map((row) => {
        console.log('[BoardService] Wish created successfully', row);
        return flattenWish(row as unknown as Wish);
      }),
      catchError((error) => {
        console.error('[BoardService] Error creating wish:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Uploads multiple images to the wish-images bucket.
   *
   * @param images - Array of File objects to upload
   * @param userId - The user ID for permissions
   * @returns Observable of array of file IDs
   */
  private uploadWishImages(
    images: File[],
    userId: string,
  ): Observable<string[]> {
    const uploads = images.map((file) =>
      from(
        this.appwrite.storage.createFile({
          bucketId: WISH_IMAGES_BUCKET,
          fileId: ID.unique(),
          file,
          permissions: [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ],
        }),
      ).pipe(map((result) => result.$id)),
    );

    return forkJoin(uploads);
  }

  /**
   * Creates a wish row in the database.
   *
   * @param wishlistId - The wishlist ID
   * @param userId - The user ID
   * @param data - The wish data
   * @param priority - The priority for ordering
   * @param fileIds - Array of uploaded file IDs
   * @returns Promise of the created row
   */
  private createWishRow(
    wishlistId: string,
    userId: string,
    data: CreateWishData,
    priority: number,
    fileIds: string[],
  ): Observable<unknown> {
    // Build the wish data object
    const wishData: Record<string, unknown> = {
      title: data.title,
      description: data.description ?? '',
      url: data.url ?? '',
      price: data.price ?? 0,
      quantity: data.quantity ?? 1,
      priority,
      uid: userId,
      wlid: wishlistId,
    };

    // Only include files if there are any
    if (fileIds.length > 0) {
      wishData['files'] = fileIds;
    }

    return from(
      this.appwrite.tablesDb.createRow({
        databaseId: DATABASE_ID,
        tableId: WISHES_TABLE,
        rowId: ID.unique(),
        data: wishData,
        permissions: [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ],
      }),
    );
  }

  /**
   * Updates a wish in the database.
   *
   * @param wishId - The ID of the wish to update
   * @param data - The new wish data
   * @param newImages - Optional new images to upload
   * @returns Observable of the updated wish
   */
  updateWish(
    wishId: string,
    data: CreateWishData,
    newImages?: File[],
  ): Observable<WishFlat> {
    return from(this.appwrite.account.get()).pipe(
      switchMap((account) => {
        const upload$ =
          newImages && newImages.length > 0
            ? this.uploadWishImages(newImages, account.$id)
            : of([] as string[]);

        return upload$.pipe(
          switchMap((newFileIds) => {
            return from(
              this.appwrite.tablesDb.getRow({
                databaseId: DATABASE_ID,
                tableId: WISHES_TABLE,
                rowId: wishId,
              }),
            ).pipe(
              switchMap((existingWish: any) => {
                const existingFiles = (existingWish.files as string[]) || [];
                const allFiles = [...existingFiles, ...newFileIds];

                const updateData: Record<string, unknown> = {
                  title: data.title,
                  description: data.description ?? '',
                  url: data.url ?? '',
                  price: data.price ?? 0,
                  quantity: data.quantity ?? 1,
                };

                if (allFiles.length > 0) {
                  updateData['files'] = allFiles;
                }

                return from(
                  this.appwrite.tablesDb.updateRow({
                    databaseId: DATABASE_ID,
                    tableId: WISHES_TABLE,
                    rowId: wishId,
                    data: updateData,
                  }),
                ).pipe(map((row) => flattenWish(row as unknown as Wish)));
              }),
            );
          }),
        );
      }),
      catchError((error) => {
        console.error('[BoardService] Error updating wish:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Gets a file preview URL for a wish image.
   *
   * @param fileId - The file ID
   * @returns URL for the file preview
   */
  getWishImagePreviewUrl(fileId: string): string {
    const result = this.appwrite.storage.getFilePreview({
      bucketId: WISH_IMAGES_BUCKET,
      fileId,
    });
    return result.toString();
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
