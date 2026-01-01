import { WishFlat, WishlistFlat } from '@wishare/web/wishlist/data-access';
import { StreamState } from '@wishare/web/shared/utils';
import { Models } from 'appwrite';

/**
 * Extended wishlist type with joined wishes data
 */
export type BoardWishlist = WishlistFlat & {
  wishes?: Models.RowList<WishFlat>;
};

/**
 * Result of a successful wishlist fetch or create operation
 */
export type BoardResult = {
  wishLists: BoardWishlist[];
};

/**
 * State model for board/wishlists
 */
export type BoardStateModel = {
  wishLists: BoardWishlist[];
  fetchState: StreamState<BoardResult>;
  createState: StreamState<WishlistFlat>;
  editState: StreamState<WishlistFlat>;
  reorderState: StreamState<void>;
};

/**
 * Data for creating a new wishlist
 */
export type CreateWishlistData = {
  title: string;
  description: string;
};

/**
 * Data for reordering wishlists
 */
export type ReorderWishlistsData = {
  previousIndex: number;
  currentIndex: number;
};

/**
 * Data for editing a wishlist
 */
export type EditWishlistData = {
  wishlistId: string;
  title: string;
  description: string;
};

/**
 * Actions for board state management.
 * Includes both UI actions (for triggering effects) and internal state actions.
 */
export type BoardActions = {
  // UI Actions - trigger effects
  fetchWishlists: void;
  createWishlist: CreateWishlistData;
  editWishlist: EditWishlistData;
  reorderWishlists: ReorderWishlistsData;

  // State Actions - update store state
  updateBoardState: Partial<BoardStateModel>;
  resetFetchState: void;
  resetCreateState: void;
};
