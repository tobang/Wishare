import { inject, Injectable } from '@angular/core';
import { RxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';

import {
  catchError,
  from,
  map,
  Observable,
  ReplaySubject,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { StreamState, toState } from '@wishare/web/shared/utils';
import { WishFlat, WishlistFlat } from '@wishare/web/wishlist/data-access';

import { BoardService, PRIORITY_GAP } from '../services/board.service';
import { BoardActions, BoardResult, BoardWishlist } from './board.types';

function rebalance(
  items: { $id: string; priority: number }[],
): Array<{ id: string; priority: number; oldPriority?: number }> {
  return items.map((item, index) => ({
    id: item.$id,
    priority: (index + 1) * PRIORITY_GAP,
    oldPriority: item.priority,
  }));
}

function calculatePriorityUpdates(
  items: { $id: string; priority: number }[],
  currentIndex: number,
  movedItemId: string,
): Array<{ id: string; priority: number; oldPriority?: number }> {
  const itemsClone = [...items];
  const prevItem = itemsClone[currentIndex - 1];
  const nextItem = itemsClone[currentIndex + 1];

  // If list has only 1 item
  if (itemsClone.length <= 1) {
    return [
      {
        id: movedItemId,
        priority: PRIORITY_GAP,
        oldPriority: itemsClone[currentIndex]?.priority,
      },
    ];
  }

  const prevPriority = prevItem ? prevItem.priority : 0; // 0 is virtual start
  const nextPriority = nextItem ? nextItem.priority : 0;

  // Case 1: Insert at Start
  if (!prevItem) {
    // If next item priority is too small to split to integer
    if (nextPriority < 2) {
      return rebalance(itemsClone);
    }
    return [
      {
        id: movedItemId,
        priority: Math.floor(nextPriority / 2),
        oldPriority: itemsClone[currentIndex].priority,
      },
    ];
  }

  // Case 2: Insert at End
  if (!nextItem) {
    return [
      {
        id: movedItemId,
        priority: prevPriority + PRIORITY_GAP,
        oldPriority: itemsClone[currentIndex].priority,
      },
    ];
  }

  // Case 3: Middle
  const gap = nextPriority - prevPriority;
  if (gap < 2) {
    return rebalance(itemsClone);
  }

  return [
    {
      id: movedItemId,
      priority: Math.floor((prevPriority + nextPriority) / 2),
      oldPriority: itemsClone[currentIndex].priority,
    },
  ];
}

/**
 * Effects for board actions.
 *
 * Handles:
 * - Fetching wishlists
 * - Creating new wishlists
 * - Reordering wishlists
 * - Error handling and navigation
 */
@Injectable({
  providedIn: 'root',
})
export class BoardEffects {
  private readonly boardService = inject(BoardService);

  // State streams - initialized lazily when register() is called
  private _fetchState$!: Observable<StreamState<BoardResult>>;
  private _createState$!: Observable<StreamState<WishlistFlat>>;
  private _editState$!: Observable<StreamState<WishlistFlat>>;
  private _reorderState$!: Observable<StreamState<void>>;
  private _deleteState$!: Observable<StreamState<void>>;
  private _createWishState$!: Observable<StreamState<WishFlat>>;
  private _updateWishState$!: Observable<StreamState<WishFlat>>;
  private _currentWishlists$!: ReplaySubject<BoardWishlist[]>;

  get fetchState$(): Observable<StreamState<BoardResult>> {
    return this._fetchState$;
  }

  get createState$(): Observable<StreamState<WishlistFlat>> {
    return this._createState$;
  }

  get editState$(): Observable<StreamState<WishlistFlat>> {
    return this._editState$;
  }

  get reorderState$(): Observable<StreamState<void>> {
    return this._reorderState$;
  }

  get deleteState$(): Observable<StreamState<void>> {
    return this._deleteState$;
  }

  get createWishState$(): Observable<StreamState<WishFlat>> {
    return this._createWishState$;
  }

  get updateWishState$(): Observable<StreamState<WishFlat>> {
    return this._updateWishState$;
  }

  get currentWishlists$(): Observable<BoardWishlist[]> {
    return this._currentWishlists$.asObservable();
  }

  /**
   * Updates the current wishlists (called by the store when wishlists change)
   */
  updateCurrentWishlists(wishlists: BoardWishlist[]): void {
    this._currentWishlists$.next(wishlists);
  }

  /**
   * Register effects with the store's actions.
   * This method is called by the store during initialization.
   */
  register(actions: RxActions<BoardActions, object>) {
    // Initialize ReplaySubjects
    this._currentWishlists$ = new ReplaySubject<BoardWishlist[]>(1);

    // Create shared observables for state streams
    const fetchState$ = new ReplaySubject<StreamState<BoardResult>>(1);
    const createState$ = new ReplaySubject<StreamState<WishlistFlat>>(1);
    const editState$ = new ReplaySubject<StreamState<WishlistFlat>>(1);
    const reorderState$ = new ReplaySubject<StreamState<void>>(1);
    const deleteState$ = new ReplaySubject<StreamState<void>>(1);
    const createWishState$ = new ReplaySubject<StreamState<WishFlat>>(1);
    const updateWishState$ = new ReplaySubject<StreamState<WishFlat>>(1);

    this._fetchState$ = fetchState$.asObservable();
    this._createState$ = createState$.asObservable();
    this._editState$ = editState$.asObservable();
    this._reorderState$ = reorderState$.asObservable();
    this._deleteState$ = deleteState$.asObservable();
    this._createWishState$ = createWishState$.asObservable();
    this._updateWishState$ = updateWishState$.asObservable();

    rxEffects(({ register }) => {
      register(
        actions.fetchWishlists$.pipe(
          switchMap(() =>
            this.boardService
              .getBoard()
              .pipe(map((wishLists) => ({ wishLists }) as BoardResult)),
          ),
          toState(),
        ),
        (state) => {
          fetchState$.next(state);
          // Update current wishlists when fetch succeeds
          if (state.hasValue && state.value) {
            this._currentWishlists$.next(state.value.wishLists);
          }
        },
      );

      register(
        actions.createWishlist$.pipe(
          switchMap((data) => this.boardService.createWishlist(data)),
          toState(),
        ),
        (state) => {
          if (state.hasValue && state.value) {
            // Trigger a refresh of wishlists after creating a new one
            actions.fetchWishlists();
          }
          createState$.next(state);
        },
      );

      // Edit wishlist effect
      register(
        actions.editWishlist$.pipe(
          switchMap(({ wishlistId, title, description }) =>
            this.boardService.updateWishlist(wishlistId, {
              title,
              description,
            }),
          ),
          toState(),
        ),
        (state) => {
          if (state.hasValue && state.value) {
            // Trigger a refresh of wishlists after editing
            actions.fetchWishlists();
          }
          editState$.next(state);
        },
      );

      // Reorder wishlists effect
      register(
        actions.reorderWishlists$.pipe(
          withLatestFrom(this._currentWishlists$),
          switchMap(([{ previousIndex, currentIndex }, wishlists]) => {
            // Create a copy and reorder
            const reorderedWishlists = [...wishlists];
            const [movedItem] = reorderedWishlists.splice(previousIndex, 1);
            reorderedWishlists.splice(currentIndex, 0, movedItem);

            const updates = calculatePriorityUpdates(
              reorderedWishlists,
              currentIndex,
              movedItem.$id,
            );

            // Apply priority updates
            const finalWishlists = reorderedWishlists.map((item) => {
              const update = updates.find((u) => u.id === item.$id);
              return update ? { ...item, priority: update.priority } : item;
            });

            // Update current wishlists optimistically
            this._currentWishlists$.next(finalWishlists);

            // If no updates needed, return early
            if (updates.length === 0) {
              return from(Promise.resolve());
            }

            return this.boardService.updateWishlistPriorities(updates);
          }),
          toState(),
        ),
        (state) => {
          if (state.hasError) {
            // On error, refresh to get the correct order from the backend
            actions.fetchWishlists();
          }
          reorderState$.next(state);
        },
      );

      // Reorder wishes effect
      register(
        actions.reorderWishes$.pipe(
          withLatestFrom(this._currentWishlists$),
          switchMap(
            ([{ wishlistId, previousIndex, currentIndex }, wishlists]) => {
              // Find the wishlist
              const wishlist = wishlists.find((wl) => wl.$id === wishlistId);
              if (!wishlist?.wishes?.rows) {
                return from(Promise.resolve());
              }

              const wishes = [...wishlist.wishes.rows];
              const [movedItem] = wishes.splice(previousIndex, 1);
              wishes.splice(currentIndex, 0, movedItem);

              const updates = calculatePriorityUpdates(
                wishes,
                currentIndex,
                movedItem.$id,
              );

              // Apply priority updates
              const finalWishes = wishes.map((item) => {
                const update = updates.find((u) => u.id === item.$id);
                return update ? { ...item, priority: update.priority } : item;
              });

              // Update current wishlists optimistically
              const updatedWishlists = wishlists.map((wl) => {
                if (wl.$id === wishlistId && wl.wishes) {
                  return {
                    ...wl,
                    wishes: { ...wl.wishes, rows: finalWishes },
                  };
                }
                return wl;
              });
              this._currentWishlists$.next(updatedWishlists);

              // If no updates needed, return early
              if (updates.length === 0) {
                return from(Promise.resolve());
              }

              return this.boardService.updateWishPriorities(updates);
            },
          ),
          toState(),
        ),
        (state) => {
          if (state.hasError) {
            // On error, refresh to get the correct order from the backend
            actions.fetchWishlists();
          }
        },
      );

      // Delete wishlist effect
      register(
        actions.deleteWishlist$.pipe(
          switchMap((wishlistId) =>
            this.boardService.deleteWishlist(wishlistId),
          ),
          toState(),
        ),
        (state) => {
          if (state.hasValue) {
            // Trigger a refresh of wishlists after deleting
            actions.fetchWishlists();
          }
          deleteState$.next(state);
        },
      );

      // Create wish effect
      register(
        actions.createWish$.pipe(
          tap((payload) =>
            console.log('[BoardEffects] createWish action received', payload),
          ),
          switchMap(({ wishlistId, data, images }) =>
            this.boardService.createWish(wishlistId, data, images).pipe(
              tap((result) =>
                console.log('[BoardEffects] createWish result', result),
              ),
              catchError((error) => {
                console.error('[BoardEffects] createWish error', error);
                throw error;
              }),
            ),
          ),
          toState(),
        ),
        (state) => {
          console.log('[BoardEffects] createWish state', state);
          if (state.hasValue && state.value) {
            // Trigger a refresh of wishlists after creating a wish
            actions.fetchWishlists();
          }
          createWishState$.next(state);
        },
      );

      // Update wish effect
      register(
        actions.updateWish$.pipe(
          switchMap(({ wishId, data, images }) =>
            this.boardService.updateWish(wishId, data, images),
          ),
          toState(),
        ),
        (state) => {
          if (state.hasValue && state.value) {
            // Trigger a refresh of wishlists after updating a wish
            actions.fetchWishlists();
          }
          updateWishState$.next(state);
        },
      );
    });
  }
}
