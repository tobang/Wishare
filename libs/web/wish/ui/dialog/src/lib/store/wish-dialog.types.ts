import { TuiDialogContext } from '@taiga-ui/core';
import { WishDialog, WishDialogInput } from '../models/wish-dialog.model';

export type WishDialogModel = {
  activeItemIndex: number;
};

export type WishDialogActions = {
  closeDialog: TuiDialogContext<WishDialog | null, WishDialogInput>;
  updateActiveIndex: number;
};
