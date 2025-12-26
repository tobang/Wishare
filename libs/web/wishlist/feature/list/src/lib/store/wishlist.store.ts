import { inject, Injectable, Injector } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';
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
export class WishlistStore {
  private readonly componentInjector = inject(Injector);
  private readonly dialogService = inject(TuiDialogService);
  public readonly commands = rxActions<Actions>();
  
  public readonly store = rxState<never>(({}) => {});

  constructor() {
    rxEffects(({ register }) => {
      register(
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
    });
  }

  createWish() {
    this.commands.createWish();
  }
}

// Backwards compatibility
export { WishlistStore as WishlistAdapter };
