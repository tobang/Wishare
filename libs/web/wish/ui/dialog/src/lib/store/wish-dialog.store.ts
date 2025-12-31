import { Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';
import { TuiDialogContext } from '@taiga-ui/core';
import { WishDialogResult, WishDialogInput } from '../models/wish-dialog.model';
import { createWishDialogViewModel } from './wish-dialog.selectors';
import { WishDialogActions, WishDialogModel } from './wish-dialog.types';

@Injectable()
export class WishDialogStore {
  public readonly commands = rxActions<WishDialogActions>();

  public readonly store = rxState<WishDialogModel>(({ set }) => {
    set({ activeItemIndex: 0 });
  });

  public readonly vm = createWishDialogViewModel(this.store);

  constructor() {
    rxEffects(({ register }) => {
      register(this.commands.closeDialog$, (context) =>
        context.completeWith(null),
      );

      register(this.commands.updateActiveIndex$, (index) =>
        this.store.set({ activeItemIndex: index }),
      );
    });
  }

  closeDialog(
    context: TuiDialogContext<WishDialogResult | null, WishDialogInput>,
  ) {
    this.commands.closeDialog(context);
  }

  updateActiveIndex(index: number) {
    this.commands.updateActiveIndex(index);
  }
}
