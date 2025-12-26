import { inject, Injectable } from '@angular/core';
import { BoardWishlistEffects } from './effects';

/**
 * Main effects orchestrator for board.
 *
 * Coordinates all effect domains:
 * - Wishlist operations
 */
@Injectable()
export class BoardEffects {
  private readonly wishlistEffects = inject(BoardWishlistEffects);
  private effectSubscriptions: unknown[] = [];

  constructor() {
    this.effectSubscriptions.push(
      this.wishlistEffects.register()
    );
  }
}
