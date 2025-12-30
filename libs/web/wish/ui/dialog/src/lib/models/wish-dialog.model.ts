import { Wish } from '@wishare/web/wishlist/data-access';

export type WishDialog = {
  wish: Wish;
  id?: string;
  images?: (string | ArrayBuffer)[];
};

export type WishDialogInput = WishDialog & {
  editMode: boolean;
};
