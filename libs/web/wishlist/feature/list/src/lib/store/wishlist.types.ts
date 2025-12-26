import { Wish } from '@wishare/web/wishlist/data-access';

/**
 * State model for wishlist feature (currently no state)
 */
export interface WishlistStateModel {}

/**
 * Actions for wishlist management
 */
export interface WishlistActions {
  createWish: void;
  editWish: Wish;
  deleteWish: Wish;
}
