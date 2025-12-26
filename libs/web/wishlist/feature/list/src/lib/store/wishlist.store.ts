import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';

import { createWishlistViewModel } from './wishlist.selectors';
import { WishlistActions, WishlistStateModel } from './wishlist.types';
import { WishlistEffects } from './wishlist.effects';

/**
 * Store managing the state for the wishlist feature.
 *
 * Key responsibilities:
 * - Managing wish dialog operations
 */
@Injectable()
export class WishlistStore {
  public readonly commands = rxActions<WishlistActions>();
  private readonly effects = inject(WishlistEffects);
  
  public readonly store = rxState<WishlistStateModel>(({}) => {});

  public readonly vm = createWishlistViewModel(this.store);

  constructor() {
    this.effects.register(this.commands);
  }

  createWish() {
    this.commands.createWish();
  }
}
