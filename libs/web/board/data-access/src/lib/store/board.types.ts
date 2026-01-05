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
 * Data for creating a new wish (matches dialog output)
 */
export type CreateWishData = {
  title: string;
  description?: string;
  url?: string;
  price: number | null;
  quantity: number;
};

/**
 * Payload for creating a wish including wishlist context and images
 */
export type CreateWishPayload = {
  wishlistId: string;
  data: CreateWishData;
  images?: File[];
};

/**
 * Payload for updating a wish
 */
export type UpdateWishPayload = {
  wishId: string;
  data: CreateWishData;
  images?: File[];
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
  deleteState: StreamState<void>;
  createWishState: StreamState<WishFlat>;
  updateWishState: StreamState<WishFlat>;
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
 * Data for reordering wishes within a wishlist
 */
export type ReorderWishesData = {
  wishlistId: string;
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
  reorderWishes: ReorderWishesData;
  deleteWishlist: string;
  createWish: CreateWishPayload;
  updateWish: UpdateWishPayload;

  // State Actions - update store state
  updateBoardState: Partial<BoardStateModel>;
  resetFetchState: void;
  resetCreateState: void;
  resetDeleteState: void;
  resetCreateWishState: void;
  resetUpdateWishState: void;
};
