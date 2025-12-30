import { Wishlist } from '@wishare/web/wishlist/data-access';
import { StreamState } from '@wishare/web/shared/utils';
import { Models } from 'appwrite';

/**
 * Extended wishlist type with joined document data
 */
export type BoardWishlist = Wishlist & {
  [x: string]: Models.DocumentList<Models.Document>;
};

/**
 * Result of a successful wishlist fetch or create operation
 */
export interface BoardResult {
  wishLists: BoardWishlist[];
}

/**
 * State model for board/wishlists
 */
export interface BoardStateModel {
  wishLists: BoardWishlist[];
  fetchState: StreamState<BoardResult>;
  createState: StreamState<Wishlist>;
  reorderState: StreamState<void>;
}

/**
 * Actions for board state management
 */
export interface BoardActions {
  fetchWishlists: void;
  updateBoardState: Partial<BoardStateModel>;
  resetFetchState: void;
  resetCreateState: void;
}

/**
 * Data for creating a new wishlist
 */
export interface CreateWishlistData {
  title: string;
  description: string;
}

/**
 * Data for reordering wishlists
 */
export interface ReorderWishlistsData {
  previousIndex: number;
  currentIndex: number;
}

/**
 * UI Actions for board effects (used by components)
 */
export interface BoardUIActions {
  fetchWishlists: void;
  createWishlist: CreateWishlistData;
  reorderWishlists: ReorderWishlistsData;
}
