import { inject, Injectable, Injector } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { RxActionFactory } from '@rx-angular/state/actions';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { notNullOrUndefined } from '@wishare/web/shared/utils';
import {
  WishDialogComponent,
  WishDialogInput,
} from '@wishare/web/wish/ui/dialog';
import { Wish } from '@wishare/web/wishlist/data-access';
import { EMPTY, filter, switchMap } from 'rxjs';

type Actions = {
  createWish: void;
  editWish: Wish;
  deleteWish: Wish;
};

@Injectable()
export class WishlistAdapter extends RxState<never> {
  private readonly componentInjector = inject(Injector);
  private readonly dialogService = inject(TuiDialogService);
  readonly commands = new RxActionFactory<Actions>().create();
  constructor() {
    super();
    this.holdCreateWish();
  }

  // Public api
  createWish() {
    this.commands.createWish();
  }

  private holdCreateWish() {
    this.hold(
      this.commands.createWish$.pipe(
        switchMap(() =>
          this.dialogService
            .open<WishDialogInput>(
              new PolymorpheusComponent(WishDialogComponent, this.componentInjector),
              {
                dismissible: false,
                data: { wish: {}, images: [], editMode: false },
                size: 'l',
              }
            )
            .pipe(
              filter(notNullOrUndefined),
              switchMap(() => EMPTY)
            )
        )
      )
    );
  }
}
