import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';
import { Wish } from '@wishare/web/wishlist/data-access';

import { createWishlistViewModel } from './wishlist.selectors';
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
 * @see WishlistDialogEffects for dialog side effects
 */
@Injectable()
export class WishlistStore {
  private readonly wishlistEffects = inject(WishlistEffects);

  public readonly actions = rxActions<WishlistActions>();

  // Expose UI actions from effects for external use
  public readonly ui = {
    createWish: () => this.wishlistEffects.actions.createWish(),
    editWish: (wish: Wish) => this.wishlistEffects.actions.editWish(wish),
    deleteWish: (wish: Wish) => this.wishlistEffects.actions.deleteWish(wish),
  };

  public readonly store = rxState<WishlistStateModel>(({ set }) => {
    // Initialize with empty state
    set({});
  });

  public readonly vm = createWishlistViewModel(this.store);
}
