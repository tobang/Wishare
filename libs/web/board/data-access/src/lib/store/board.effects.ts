import { inject, Injectable } from '@angular/core';
import { RxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';

import {
  from,
  map,
  Observable,
  ReplaySubject,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { StreamState, toState } from '@wishare/web/shared/utils';
import { WishlistFlat } from '@wishare/web/wishlist/data-access';

import { BoardService } from '../services/board.service';
import { BoardActions, BoardResult, BoardWishlist } from './board.types';

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

    this._fetchState$ = fetchState$.asObservable();
    this._createState$ = createState$.asObservable();
    this._editState$ = editState$.asObservable();
    this._reorderState$ = reorderState$.asObservable();

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

            // Update current wishlists optimistically
            this._currentWishlists$.next(reorderedWishlists);

            // Create priority updates ONLY for wishlists whose priority changed
            // Priority is 1-based, with lower numbers appearing first
            const updates = reorderedWishlists
              .map((wishlist, index) => ({
                id: wishlist.$id,
                oldPriority: wishlist.priority,
                newPriority: index + 1,
              }))
              .filter((update) => update.oldPriority !== update.newPriority)
              .map((update) => ({
                id: update.id,
                priority: update.newPriority,
                oldPriority: update.oldPriority,
              }));

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
    });
  }
}
