import { Wish } from '@wishare/web/wishlist/data-access';

/**
 * State model for wishlist feature.
 * This store primarily manages dialog workflows.
 */
export type WishlistStateModel = Record<string, never>;

/**
 * Actions for wishlist state management.
 * Includes both UI actions (for triggering effects) and internal state actions.
 */
export type WishlistActions = {
  // UI Actions - trigger effects
  createWish: void;
  editWish: Wish;
  deleteWish: Wish;
};
