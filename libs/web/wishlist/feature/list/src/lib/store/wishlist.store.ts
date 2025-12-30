import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';

import {
  createWishlistViewModel,
  WishlistViewModel,
} from './wishlist.selectors';
import { WishlistActions, WishlistStateModel } from './wishlist.types';
import { WishlistEffects } from './wishlist.effects';

/**
 * Store managing the state for the wishlist feature.
 *
 * Key responsibilities:
 * - Managing wish dialog operations (create, edit, delete)
 * - Coordinating dialog-based workflows
 *
 * @see WishlistStateModel for the complete state shape
 * @see WishlistEffects for dialog side effects
 */
@Injectable()
export class WishlistStore {
  private readonly effects = inject(WishlistEffects);

  public readonly actions = rxActions<WishlistActions>();

  // Register effects early so streams are available for state connections
  private readonly _effectsRegistered = this.effects.register(this.actions);

  readonly vm: WishlistViewModel;

  // #region State
  private readonly store = rxState<WishlistStateModel>(({ set }) => {
    // Initialize with empty state
    set({});
  });
  // #endregion State

  constructor() {
    // Initialize view model
    this.vm = createWishlistViewModel(this.store);
  }
}
