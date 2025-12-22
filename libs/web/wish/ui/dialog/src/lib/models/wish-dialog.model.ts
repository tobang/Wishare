import { Wish } from '@wishare/web/wishlist/data-access';

export interface WishDialog {
  wish: Wish;
  id?: string;
  images?: (string | ArrayBuffer)[];
}

export interface WishDialogInput extends WishDialog {
  editMode: boolean;
}
