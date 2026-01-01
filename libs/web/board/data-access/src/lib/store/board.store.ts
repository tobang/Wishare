import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';

import { resetStreamState, WithInitializer } from '@wishare/web/shared/utils';
import { WishlistFlat } from '@wishare/web/wishlist/data-access';
import { filter, map, merge } from 'rxjs';

import { createBoardViewModel, BoardViewModel } from './board.selectors';
import { BoardActions, BoardResult, BoardStateModel } from './board.types';
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
  private readonly effects = inject(BoardEffects);

  public readonly actions = rxActions<BoardActions>();

  // Register effects early so streams are available for state connections
  private readonly _effectsRegistered = this.effects.register(this.actions);

  readonly vm: BoardViewModel;

  // #region State
  private readonly store = rxState<BoardStateModel>(({ connect, set }) => {
    // Initialize with empty state
    set({
      wishLists: [],
      fetchState: resetStreamState<BoardResult>(),
      createState: resetStreamState<WishlistFlat>(),
      editState: resetStreamState<WishlistFlat>(),
      reorderState: resetStreamState<void>(),
      deleteState: resetStreamState<void>(),
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
    connect('fetchState', this.effects.fetchState$);
    connect('createState', this.effects.createState$);
    connect('editState', this.effects.editState$);
    connect('reorderState', this.effects.reorderState$);
    connect('deleteState', this.effects.deleteState$);

    /**
     * Consolidated wishLists updates from board operations.
     * Updates are triggered when fetch succeeds or optimistic reorder happens.
     */
    connect(
      merge(
        this.effects.fetchState$.pipe(
          filter((state) => state.hasValue && state.value !== null),
          map((state) => ({
            wishLists: state.value?.wishLists ?? [],
          })),
        ),
        this.effects.currentWishlists$.pipe(
          map((wishLists) => ({
            wishLists,
          })),
        ),
      ),
    );

    // Reset StreamState properties
    connect(this.actions.resetFetchState$, () => ({
      fetchState: resetStreamState<BoardResult>(),
    }));

    connect(this.actions.resetCreateState$, () => ({
      createState: resetStreamState<WishlistFlat>(),
    }));

    connect(this.actions.resetDeleteState$, () => ({
      deleteState: resetStreamState<void>(),
    }));
  });
  // #endregion State

  constructor() {
    // Initialize view model
    this.vm = createBoardViewModel(this.store);
  }

  initialize(): void {
    this.actions.fetchWishlists();
  }
}
