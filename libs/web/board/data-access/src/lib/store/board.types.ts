import { Wishlist } from '@wishare/web/wishlist/data-access';
import { Models } from 'appwrite';

/**
 * State model for board/wishlists
 */
export interface BoardStateModel {
  wishLists: (Wishlist & {
    [x: string]: Models.DocumentList<Models.Document>;
  })[];
  loading: boolean;
}

/**
 * Actions for board state management
 */
export interface BoardActions {
  fetchWishlists: void;
  fetchBoard: void;
  createWishlist: void;
}
