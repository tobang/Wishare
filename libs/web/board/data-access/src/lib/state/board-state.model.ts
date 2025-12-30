import { WishFlat, WishlistFlat } from '@wishare/web/wishlist/data-access';
import { Models } from 'appwrite';

/**
 * Extended wishlist type with joined wishes data
 */
export type BoardWishlist = WishlistFlat & {
  wishes?: Models.RowList<WishFlat>;
};

export type BoardStateModel = {
  wishLists: BoardWishlist[];
};
