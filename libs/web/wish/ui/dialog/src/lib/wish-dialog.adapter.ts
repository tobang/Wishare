import { Injectable } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { RxActionFactory } from '@rx-angular/state/actions';
import { TuiDialogContext } from '@taiga-ui/core';
import { WishDialog, WishDialogInput } from './models/wish-dialog.model';

interface WishDialogModel {
  activeItemIndex: number;
}

type Actions = {
  closeDialog: TuiDialogContext<WishDialog | null, WishDialogInput>;
  updateActiveIndex: number;
};

@Injectable()
export class WishDialogAdapter extends RxState<WishDialogModel> {
  readonly commands = new RxActionFactory<Actions>().create();
  public vm$ = this.select();
  constructor() {
    super();
    this.set({ activeItemIndex: 0 });
    this.holdCloseDialog();
    this.holdUpdateActiveIndex();
  }

  // Public api
  closeDialog(context: TuiDialogContext<WishDialog | null, WishDialogInput>) {
    this.commands.closeDialog(context);
  }

  updateActiveIndex(index: number) {
    this.commands.updateActiveIndex(index);
  }

  private holdCloseDialog() {
    this.hold(this.commands.closeDialog$, (context) =>
      context.completeWith(null)
    );
  }

  private holdUpdateActiveIndex() {
    this.hold(this.commands.updateActiveIndex$, (index) =>
      this.set({ activeItemIndex: index })
    );
  }
}
