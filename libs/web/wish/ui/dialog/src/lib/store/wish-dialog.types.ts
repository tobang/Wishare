import { TuiDialogContext } from '@taiga-ui/core';
import { WishDialogResult, WishDialogInput } from '../models/wish-dialog.model';

export type WishDialogModel = {
  activeItemIndex: number;
};

export type WishDialogActions = {
  closeDialog: TuiDialogContext<WishDialogResult | null, WishDialogInput>;
  updateActiveIndex: number;
};
