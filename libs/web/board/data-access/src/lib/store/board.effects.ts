import { inject, Injectable } from '@angular/core';
import { rxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';

import { map, ReplaySubject, switchMap, tap, withLatestFrom } from 'rxjs';
import { StreamState, toState } from '@wishare/web/shared/utils';
import { Wishlist } from '@wishare/web/wishlist/data-access';

import { BoardService } from '../services/board.service';
import { BoardResult, BoardUIActions, BoardWishlist } from './board.types';

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

  // Public actions for UI interactions
  public readonly actions = rxActions<BoardUIActions>();

  // Internal state update streams
  // These are populated by effects and consumed by the store
  // Using ReplaySubject(1) so late subscribers get the last emitted value
  private readonly _fetchState$ = new ReplaySubject<StreamState<BoardResult>>(
    1,
  );
  private readonly _createState$ = new ReplaySubject<StreamState<Wishlist>>(1);
  private readonly _reorderState$ = new ReplaySubject<StreamState<void>>(1);

  // Observable to track current wishlists for reordering
  private readonly _currentWishlists$ = new ReplaySubject<BoardWishlist[]>(1);

  readonly fetchState$ = this._fetchState$.asObservable();
  readonly createState$ = this._createState$.asObservable();
  readonly reorderState$ = this._reorderState$.asObservable();

  /**
   * Updates the current wishlists (called by the store when wishlists change)
   */
  updateCurrentWishlists(wishlists: BoardWishlist[]): void {
    this._currentWishlists$.next(wishlists);
  }

  // Effects registered directly
  private readonly effects = rxEffects(({ register }) => {
    register(
      this.actions.fetchWishlists$.pipe(
        switchMap(() =>
          this.boardService.getBoard().pipe(
            tap((data) => console.log('Board data:', data)),
            map((wishLists) => ({ wishLists }) as BoardResult),
          ),
        ),
        toState(),
      ),
      (state) => {
        this._fetchState$.next(state);
        // Update current wishlists when fetch succeeds
        if (state.hasValue && state.value) {
          this._currentWishlists$.next(state.value.wishLists);
        }
      },
    );

    register(
      this.actions.createWishlist$.pipe(
        switchMap((data) => this.boardService.createWishlist(data)),
        toState(),
      ),
      (state) => {
        if (state.hasValue && state.value) {
          // Trigger a refresh of wishlists after creating a new one
          this.actions.fetchWishlists();
        }
        if (state.hasError) {
          console.error('Create wishlist error:', state.error);
        }
        this._createState$.next(state);
      },
    );

    // Reorder wishlists effect
    register(
      this.actions.reorderWishlists$.pipe(
        withLatestFrom(this._currentWishlists$),
        switchMap(([{ previousIndex, currentIndex }, wishlists]) => {
          // Create a copy and reorder
          const reorderedWishlists = [...wishlists];
          const [movedItem] = reorderedWishlists.splice(previousIndex, 1);
          reorderedWishlists.splice(currentIndex, 0, movedItem);

          // Update current wishlists optimistically
          this._currentWishlists$.next(reorderedWishlists);

          // Create priority updates based on new positions
          // Priority is 1-based, with lower numbers appearing first
          const updates = reorderedWishlists.map((wishlist, index) => ({
            id: wishlist.$id,
            priority: index + 1,
          }));

          return this.boardService.updateWishlistPriorities(updates);
        }),
        toState(),
      ),
      (state) => {
        if (state.hasError) {
          console.error('Reorder wishlists error:', state.error);
          // On error, refresh to get the correct order from the backend
          this.actions.fetchWishlists();
        }
        this._reorderState$.next(state);
      },
    );
  });
}
