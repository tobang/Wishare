import { Wish } from '@wishare/web/wishlist/data-access';

/**
 * Data for creating a new wish (subset of WishData without system fields).
 * Note: priority is not included here as it's set programmatically based on
 * the wish's position in the wishlist (ordering field, not user-facing).
 */
export type CreateWishData = {
  title: string;
  description?: string;
  url?: string;
  price: number | null;
  quantity: number;
};

/**
 * Result from the wish dialog - either a new wish to create or an existing wish that was edited
 */
export type WishDialogResult = {
  /** The wish data - either CreateWishData for new wishes or full Wish for edits */
  wishData: CreateWishData;
  /** The existing wish being edited (only present in edit mode) */
  existingWish?: Wish;
  /** Image files to be uploaded to storage */
  imageFiles?: File[];
};

export type WishDialogInput = {
  /** Whether we're editing an existing wish */
  editMode: boolean;
  /** The existing wish to edit (required when editMode is true) */
  wish?: Wish;
  /** Existing images */
  images?: (string | ArrayBuffer)[];
};
