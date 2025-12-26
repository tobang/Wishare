import { TuiDialogContext } from '@taiga-ui/core';
import { WishDialog, WishDialogInput } from '../models/wish-dialog.model';

export interface WishDialogModel {
  activeItemIndex: number;
}

export interface WishDialogActions {
  closeDialog: TuiDialogContext<WishDialog | null, WishDialogInput>;
  updateActiveIndex: number;
}
