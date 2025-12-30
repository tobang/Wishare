import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';

import { resetStreamState, WithInitializer } from '@wishare/web/shared/utils';
import { Wishlist } from '@wishare/web/wishlist/data-access';
import { filter, map, merge } from 'rxjs';

import { createBoardViewModel } from './board.selectors';
import {
  BoardActions,
  BoardResult,
  BoardStateModel,
  CreateWishlistData,
  ReorderWishlistsData,
} from './board.types';
import { BoardEffects } from './board.effects';

/**
 * Store managing the state for the board feature.
 *
 * Key responsibilities:
 * - Managing wishlists state
 * - Coordinating async operations (fetch, create)
 * - Tracking loading/success/error states of board operations
 *
 * @see BoardStateModel for the complete state shape
 * @see BoardEffects for board side effects
 */
@Injectable({
  providedIn: 'root',
})
export class BoardStore implements WithInitializer {
  private readonly boardEffects = inject(BoardEffects);

  public readonly actions = rxActions<BoardActions>();

  // Expose UI actions from effects for external use
  public readonly ui = {
    fetchWishlists: () => this.boardEffects.actions.fetchWishlists(),
    createWishlist: (data: CreateWishlistData) =>
      this.boardEffects.actions.createWishlist(data),
    reorderWishlists: (data: ReorderWishlistsData) =>
      this.boardEffects.actions.reorderWishlists(data),
  };

  // Internal state update streams for async operations
  // These are populated by effects and should not be exposed as public actions
  readonly fetchState$ = this.boardEffects.fetchState$;
  readonly createState$ = this.boardEffects.createState$;
  readonly reorderState$ = this.boardEffects.reorderState$;

  private readonly store = rxState<BoardStateModel>(({ connect, set }) => {
    // Initialize with empty state
    set({
      wishLists: [],
      fetchState: resetStreamState<BoardResult>(),
      createState: resetStreamState<Wishlist>(),
      reorderState: resetStreamState<void>(),
    });

    connect(this.actions.updateBoardState$, (state, update) => ({
      ...state,
      ...update,
    }));

    /**
     * Connect StreamState properties from effects.
     * These track the loading/success/error states of various async operations.
     * Using StreamState pattern ensures consistent state management across all operations.
     */
    connect('fetchState', this.fetchState$);
    connect('createState', this.createState$);
    connect('reorderState', this.reorderState$);

    /**
     * Consolidated wishLists updates from board operations.
     * Updates are triggered when fetch succeeds.
     */
    connect(
      merge(
        this.fetchState$.pipe(
          filter((state) => state.hasValue && state.value !== null),
          map((state) => ({
            wishLists: state.value?.wishLists ?? [],
          })),
        ),
      ),
    );

    // Reset StreamState properties
    connect(this.actions.resetFetchState$, () => ({
      fetchState: resetStreamState<BoardResult>(),
    }));

    connect(this.actions.resetCreateState$, () => ({
      createState: resetStreamState<Wishlist>(),
    }));
  });

  public readonly vm = createBoardViewModel(this.store);

  initialize(): void {
    this.ui.fetchWishlists();
  }
}
