import { inject, Injectable, Injector } from '@angular/core';
import { rxEffects } from '@rx-angular/state/effects';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { notNullOrUndefined } from '@wishare/web/shared/utils';
import {
  WishDialogComponent,
  WishDialogInput,
} from '@wishare/web/wish/ui/dialog';
import { EMPTY, filter, switchMap } from 'rxjs';

/**
 * Effects for wishlist dialog operations.
 *
 * Handles:
 * - Opening create wish dialog
 * - Opening edit wish dialog
 */
@Injectable()
export class WishlistDialogEffects {
  private readonly componentInjector = inject(Injector);
  private readonly dialogService = inject(TuiDialogService);

  register(actions: any) {
    return rxEffects(({ register }) => {
      register(
        actions['createWish$'].pipe(
          switchMap(() =>
            this.dialogService
              .open<WishDialogInput>(
                new PolymorpheusComponent(
                  WishDialogComponent,
                  this.componentInjector,
                ),
                {
                  dismissible: false,
                  data: { wish: {}, images: [], editMode: false },
                  size: 'l',
                },
              )
              .pipe(
                filter(notNullOrUndefined),
                switchMap(() => EMPTY),
              ),
          ),
        ),
      );
    });
  }
}
