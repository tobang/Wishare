import { inject, Injectable } from '@angular/core';
import { rxEffects } from '@rx-angular/state/effects';
import { BoardService } from '../../services/board.service';
import { BoardStore } from '../board.store';

/**
 * Effects for board wishlist operations.
 *
 * Handles:
 * - Creating wishlists
 * - Refreshing board data after operations
 */
@Injectable()
export class BoardWishlistEffects {
  private readonly boardService = inject(BoardService);
  private readonly boardStore = inject(BoardStore);

  register() {
    return rxEffects(({ register }) => {
      register(this.boardStore.actions.createWishlist$, () => {
        this.boardService.createWishlist().subscribe(() => {
          this.boardStore.actions.fetchWishlists();
        });
      });
    });
  }
}
