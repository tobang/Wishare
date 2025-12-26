import { Signal } from '@angular/core';
import { WishDialogModel } from './wish-dialog.types';

export const createWishDialogViewModel = (store: any) => {
  const activeItemIndex: Signal<WishDialogModel['activeItemIndex']> = store.signal('activeItemIndex');

  return {
    activeItemIndex
  };
};

export type WishDialogViewModel = ReturnType<typeof createWishDialogViewModel>;
