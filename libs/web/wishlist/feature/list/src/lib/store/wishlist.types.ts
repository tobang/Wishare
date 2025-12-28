import { Wish } from '@wishare/web/wishlist/data-access';

/**
 * State model for wishlist feature.
 * This store primarily manages dialog workflows.
 */
export type WishlistStateModel = Record<string, never>;

/**
 * Actions for wishlist state management.
 * UI-driven actions (createWish, editWish, deleteWish) are handled by WishlistDialogEffects.
 */
export type WishlistActions = Record<string, never>;

/**
 * UI Actions for wishlist dialog effects
 */
export type WishlistDialogUIActions = {
  createWish: void;
  editWish: Wish;
  deleteWish: Wish;
};
