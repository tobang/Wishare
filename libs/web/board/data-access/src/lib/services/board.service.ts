import { inject, Injectable } from '@angular/core';

import {
  catchError,
  defer,
  forkJoin,
  from,
  map,
  Observable,
  of,
  retry,
  switchMap,
  throwError,
  timer,
} from 'rxjs';

import {
  Account,
  AppwriteException,
  Client,
  Functions,
  ID,
  Permission,
  Query,
  RealtimeResponseEvent,
  Role,
  Storage,
  TablesDB,
} from 'appwrite';

import { APP_CONFIG, APPWRITE } from '@wishare/web/shared/app-config';
import { AuthStore } from '@wishare/web/auth/data-access';
import {
  flattenWish,
  flattenWishlist,
  WishFlat,
  WishlistFlat,
} from '@wishare/web/wishlist/data-access';
import { Models } from 'appwrite';
import { BoardWishlist, CreateWishData } from '../store/board.types';

// Table and bucket constants
const WISHLISTS_TABLE = 'wishlists';
const WISHES_TABLE = 'wishes';
const WISH_IMAGES_BUCKET = 'wish-images';
export const PRIORITY_GAP = 60000;

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly config = inject(APP_CONFIG);
  private readonly authStore = inject(AuthStore);
  private readonly appwrite: {
    client: Client;
    tablesDb: TablesDB;
    account: Account;
    storage: Storage;
    functions: Functions;
  } = inject(APPWRITE);

  private get databaseId(): string {
    return this.config.appwriteDatabase;
  }

  /**
   * Gets the current user ID from the cached auth state.
   * Throws an error if no user is logged in.
   */
  private getCurrentUserId(): string {
    const account = this.authStore.vm.account();
    if (!account) {
      throw new Error('User not authenticated');
    }
    return account.$id;
  }

  /**
   * Fetches all wishlists with their wishes.
   * Uses the one-to-many relationship between wishlists and wishes.
   */
  getBoard(): Observable<BoardWishlist[]> {
    const userId = this.getCurrentUserId();
    return from(
      this.appwrite.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: WISHLISTS_TABLE,
        queries: [
          Query.equal('uid', userId),
          Query.orderAsc('priority'),
          // Select the wishes relationship to load related wishes
          Query.select(['*', 'wishes.*']),
        ],
      }),
    ).pipe(
      map((result) => {
        return result.rows.map((row) => {
          const flatWishlist = flattenWishlist(row);
          const rowData = row as Record<string, unknown>;

          // Get wishes from the relationship
          const relationshipWishes = (rowData['wishes'] as Models.Row[]) || [];
          const wishlistWishes = relationshipWishes.map((w) => flattenWish(w));

          // Sort by priority
          wishlistWishes.sort((a, b) => (a.priority || 0) - (b.priority || 0));

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
    const userId = this.getCurrentUserId();
    return from(
      this.appwrite.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: WISHLISTS_TABLE,
        queries: [Query.equal('uid', userId), Query.orderAsc('priority')],
      }),
    ).pipe(map((result) => result.rows.map((row) => flattenWishlist(row))));
  }

  getWishlist(id: string): Observable<BoardWishlist> {
    return from(
      this.appwrite.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: WISHLISTS_TABLE,
        rowId: id,
        queries: [Query.select(['*', 'wishes.*'])],
      }),
    ).pipe(
      map((row) => {
        const flatWishlist = flattenWishlist(row);
        const rowData = row as Record<string, unknown>;

        // Get wishes from the relationship
        const relationshipWishes = (rowData['wishes'] as Models.Row[]) || [];
        const wishlistWishes = relationshipWishes.map((w) => flattenWish(w));

        // Sort by priority
        wishlistWishes.sort((a, b) => (a.priority || 0) - (b.priority || 0));

        return {
          ...flatWishlist,
          wishes:
            wishlistWishes.length > 0
              ? { total: wishlistWishes.length, rows: wishlistWishes }
              : undefined,
        } as BoardWishlist;
      }),
    );
  }

  /**
   * Get wishes for a specific wishlist.
   * Uses the wishlist relationship field.
   */
  getWishes(wishlistId: string): Observable<WishFlat[]> {
    return from(
      this.appwrite.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: WISHES_TABLE,
        queries: [
          Query.equal('wishlist', wishlistId),
          Query.limit(100),
          Query.orderAsc('priority'),
        ],
      }),
    ).pipe(map((result) => result.rows.map((row) => flattenWish(row))));
  }

  createWishlist(data: {
    title: string;
    description: string;
  }): Observable<WishlistFlat> {
    const userId = this.getCurrentUserId();
    return from(
      this.appwrite.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: WISHLISTS_TABLE,
        queries: [
          Query.equal('uid', userId),
          Query.orderDesc('priority'),
          Query.limit(1),
        ],
      }),
    ).pipe(
      switchMap((result) => {
        const maxPriority = this.extractPriority(result.rows[0]);
        const nextPriority = maxPriority + PRIORITY_GAP;

        return from(
          this.appwrite.tablesDb.createRow({
            databaseId: this.databaseId,
            tableId: WISHLISTS_TABLE,
            rowId: ID.unique(),
            data: {
              title: data.title,
              description: data.description,
              visibility: 'draft',
              priority: nextPriority,
              uid: userId,
            },
            permissions: [
              Permission.read(Role.user(userId)),
              Permission.update(Role.user(userId)),
              Permission.delete(Role.user(userId)),
            ],
          }),
        );
      }),
      map((row) => flattenWishlist(row)),
    );
  }

  /**
   * Updates the priority of multiple wishlists using an Appwrite Function.
   *
   * @param updates - Array of items with id and new priority
   * @returns Observable that completes when all updates are done
   */
  updateWishlistPriorities(
    updates: Array<{ id: string; priority: number; oldPriority?: number }>,
  ): Observable<void> {
    if (updates.length === 0) {
      return of(undefined);
    }

    return from(
      this.appwrite.functions.createExecution({
        functionId: 'reorderItems',
        body: JSON.stringify({
          databaseId: this.databaseId,
          tableId: WISHLISTS_TABLE,
          updates: updates.map((u) => ({ id: u.id, priority: u.priority })),
        }),
        async: false, // async = false, wait for result
      }),
    ).pipe(
      map((execution) => {
        if (execution.status === 'failed') {
          throw new Error('Reorder failed: ' + execution.responseBody);
        }

        // Parse the response body to check for logic errors handled in the function
        try {
          const body = JSON.parse(execution.responseBody);
          if (!body.success) {
            throw new Error(body.error || 'Reorder operation reported failure');
          }
        } catch (e) {
          // If response body isn't JSON, rely on status 'completed' which we implicitly have if not 'failed'
          // But strict checking is better
          if (execution.status !== 'completed') {
            throw new Error(
              'Reorder executed but status is ' + execution.status,
            );
          }
        }
      }),
      catchError((error) =>
        throwError(() =>
          this.handleAppwriteError(error, 'update wishlist priorities'),
        ),
      ),
    );
  }

  /**
   * Updates the priority of multiple wishes using an Appwrite Function.
   *
   * @param updates - Array of items with id and new priority
   * @returns Observable that completes when all updates are done
   */
  updateWishPriorities(
    updates: Array<{ id: string; priority: number; oldPriority?: number }>,
  ): Observable<void> {
    if (updates.length === 0) {
      return of(undefined);
    }

    return from(
      this.appwrite.functions.createExecution({
        functionId: 'reorderItems',
        body: JSON.stringify({
          databaseId: this.databaseId,
          tableId: WISHES_TABLE,
          updates: updates.map((u) => ({ id: u.id, priority: u.priority })),
        }),
        async: false, // async = false, wait for result
      }),
    ).pipe(
      map((execution) => {
        if (execution.status === 'failed') {
          throw new Error('Reorder failed: ' + execution.responseBody);
        }

        // Parse the response body to check for logic errors handled in the function
        try {
          const body = JSON.parse(execution.responseBody);
          if (!body.success) {
            throw new Error(body.error || 'Reorder operation reported failure');
          }
        } catch (e) {
          if (execution.status !== 'completed') {
            throw new Error(
              'Reorder executed but status is ' + execution.status,
            );
          }
        }
      }),
      catchError((error) =>
        throwError(() =>
          this.handleAppwriteError(error, 'update wish priorities'),
        ),
      ),
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
        databaseId: this.databaseId,
        tableId: WISHLISTS_TABLE,
        rowId: wishlistId,
        data: {
          title: data.title,
          description: data.description,
        },
      }),
    ).pipe(map((row) => flattenWishlist(row)));
  }

  /**
   * Deletes a wishlist by its ID.
   * All wishes associated with the wishlist are automatically deleted
   * via the cascade delete behavior of the one-to-many relationship.
   */
  deleteWishlist(wishlistId: string): Observable<void> {
    return from(
      this.appwrite.tablesDb.deleteRow({
        databaseId: this.databaseId,
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

    const userId = this.getCurrentUserId();
    console.log('[BoardService] Got user ID', userId);

    return from(
      this.appwrite.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: WISHES_TABLE,
        queries: [
          Query.equal('wishlist', wishlistId),
          Query.orderDesc('priority'),
          Query.limit(1),
        ],
      }),
    ).pipe(
      switchMap((result) => {
        const maxPriority = this.extractPriority(result.rows[0]);
        const nextPriority = maxPriority + PRIORITY_GAP;
        console.log('[BoardService] Next priority', nextPriority);

        // If there are images, upload them first
        if (images && images.length > 0) {
          console.log('[BoardService] Uploading', images.length, 'images');
          return this.uploadWishImages(images, userId).pipe(
            switchMap((fileIds) => {
              console.log('[BoardService] Images uploaded, fileIds:', fileIds);
              return this.createWishRow(
                wishlistId,
                userId,
                data,
                nextPriority,
                fileIds,
              );
            }),
          );
        }

        // No images, just create the wish
        console.log('[BoardService] No images, creating wish directly');
        return this.createWishRow(wishlistId, userId, data, nextPriority, []);
      }),
      map((row) => {
        console.log('[BoardService] Wish created successfully', row);
        return flattenWish(row);
      }),
      catchError((error) => {
        console.error('[BoardService] Error creating wish:', error);
        return throwError(() => this.handleAppwriteError(error, 'create wish'));
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
   * @returns Observable of the created row
   */
  private createWishRow(
    wishlistId: string,
    userId: string,
    data: CreateWishData,
    priority: number,
    fileIds: string[],
  ): Observable<Models.Row> {
    // Build the wish data object
    const wishData: Record<string, unknown> = {
      title: data.title,
      description: data.description ?? '',
      url: data.url ?? '',
      price: data.price ?? 0,
      quantity: data.quantity ?? 1,
      priority,
      uid: userId,
      // Use the relationship field to link to the wishlist
      wishlist: wishlistId,
    };

    // Only include files if there are any
    if (fileIds.length > 0) {
      wishData['files'] = fileIds;
    }

    return from(
      this.appwrite.tablesDb.createRow({
        databaseId: this.databaseId,
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
    const userId = this.getCurrentUserId();
    const upload$ =
      newImages && newImages.length > 0
        ? this.uploadWishImages(newImages, userId)
        : of([] as string[]);

    return upload$.pipe(
      switchMap((newFileIds) => {
        return from(
          this.appwrite.tablesDb.getRow({
            databaseId: this.databaseId,
            tableId: WISHES_TABLE,
            rowId: wishId,
          }),
        ).pipe(
          switchMap((existingWish: unknown) => {
            const wishData = existingWish as Record<string, unknown>;
            const existingFiles = (wishData['files'] as string[]) || [];
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
                databaseId: this.databaseId,
                tableId: WISHES_TABLE,
                rowId: wishId,
                data: updateData,
              }),
            ).pipe(map((row) => flattenWish(row)));
          }),
        );
      }),
      catchError((error) => {
        console.error('[BoardService] Error updating wish:', error);
        return throwError(() => this.handleAppwriteError(error, 'update wish'));
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

  // #region Realtime Subscriptions

  /**
   * Subscribes to realtime updates for all wishlists belonging to the current user.
   * Returns an Observable that emits events when wishlists are created, updated, or deleted.
   *
   * @returns Observable of realtime events for wishlists
   */
  subscribeToWishlists(): Observable<RealtimeResponseEvent<Models.Row>> {
    const channel = `databases.${this.databaseId}.tables.${WISHLISTS_TABLE}.rows`;

    return new Observable((subscriber) => {
      const unsubscribe = this.appwrite.client.subscribe<Models.Row>(
        channel,
        (response) => {
          subscriber.next(response);
        },
      );

      // Cleanup function called when Observable is unsubscribed
      return () => {
        unsubscribe();
      };
    });
  }

  /**
   * Subscribes to realtime updates for all wishes.
   * Returns an Observable that emits events when wishes are created, updated, or deleted.
   *
   * @returns Observable of realtime events for wishes
   */
  subscribeToWishes(): Observable<RealtimeResponseEvent<Models.Row>> {
    const channel = `databases.${this.databaseId}.tables.${WISHES_TABLE}.rows`;

    return new Observable((subscriber) => {
      const unsubscribe = this.appwrite.client.subscribe<Models.Row>(
        channel,
        (response) => {
          subscriber.next(response);
        },
      );

      // Cleanup function called when Observable is unsubscribed
      return () => {
        unsubscribe();
      };
    });
  }

  /**
   * Subscribes to realtime updates for a specific wishlist.
   *
   * @param wishlistId - The ID of the wishlist to subscribe to
   * @returns Observable of realtime events for the specific wishlist
   */
  subscribeToWishlist(
    wishlistId: string,
  ): Observable<RealtimeResponseEvent<Models.Row>> {
    const channel = `databases.${this.databaseId}.tables.${WISHLISTS_TABLE}.rows.${wishlistId}`;

    return new Observable((subscriber) => {
      const unsubscribe = this.appwrite.client.subscribe<Models.Row>(
        channel,
        (response) => {
          subscriber.next(response);
        },
      );

      return () => {
        unsubscribe();
      };
    });
  }

  /**
   * Subscribes to realtime updates for a specific wish.
   *
   * @param wishId - The ID of the wish to subscribe to
   * @returns Observable of realtime events for the specific wish
   */
  subscribeToWish(
    wishId: string,
  ): Observable<RealtimeResponseEvent<Models.Row>> {
    const channel = `databases.${this.databaseId}.tables.${WISHES_TABLE}.rows.${wishId}`;

    return new Observable((subscriber) => {
      const unsubscribe = this.appwrite.client.subscribe<Models.Row>(
        channel,
        (response) => {
          subscriber.next(response);
        },
      );

      return () => {
        unsubscribe();
      };
    });
  }

  // #endregion Realtime Subscriptions

  /**
   * Handles Appwrite errors with specific error codes and messages.
   * Provides meaningful error messages based on the error type.
   *
   * @param error - The error to handle
   * @param operation - Description of the operation that failed
   * @returns An Error with a user-friendly message
   */
  private handleAppwriteError(error: unknown, operation: string): Error {
    if (error instanceof AppwriteException) {
      switch (error.code) {
        case 401:
          return new Error(
            `Unauthorized: You must be logged in to ${operation}.`,
          );
        case 403:
          return new Error(
            `Forbidden: You don't have permission to ${operation}.`,
          );
        case 404:
          return new Error(`Not found: The requested resource does not exist.`);
        case 409:
          return new Error(
            `Conflict: A resource with this identifier already exists.`,
          );
        case 429:
          return new Error(
            `Rate limited: Too many requests. Please try again later.`,
          );
        case 500:
          return new Error(
            `Server error: Something went wrong on the server. Please try again.`,
          );
        case 503:
          return new Error(
            `Service unavailable: The service is temporarily unavailable.`,
          );
        default:
          return new Error(
            `Failed to ${operation}: ${error.message} (code: ${error.code})`,
          );
      }
    }

    // Handle non-Appwrite errors
    if (error instanceof Error) {
      return error;
    }

    return new Error(
      `An unexpected error occurred while trying to ${operation}.`,
    );
  }
}
