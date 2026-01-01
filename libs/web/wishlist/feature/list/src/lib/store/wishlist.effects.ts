import { inject, Injectable, Injector } from '@angular/core';
import { RxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { notNullOrUndefined } from '@wishare/web/shared/utils';
import {
  WishDialogComponent,
  WishDialogInput,
} from '@wishare/web/wish/ui/dialog';
import { EMPTY, filter, switchMap } from 'rxjs';

import { WishlistActions } from './wishlist.types';

/**
 * Effects for wishlist dialog operations.
 *
 * Handles:
 * - Opening create wish dialog
 * - Opening edit wish dialog
 * - Handling delete wish confirmation
 *
 * @see WishlistStore for the store that coordinates these effects
 */
@Injectable()
export class WishlistEffects {
  private readonly componentInjector = inject(Injector);
  private readonly dialogService = inject(TuiDialogService);

  /**
   * Register effects with the store's actions.
   * This method is called by the store during initialization.
   */
  register(actions: RxActions<WishlistActions, object>) {
    rxEffects(({ register }) => {
      // Create wish dialog effect
      register(
        actions.createWish$.pipe(
          switchMap(() =>
            this.dialogService
              .open<WishDialogInput>(
                new PolymorpheusComponent(
                  WishDialogComponent,
                  this.componentInjector,
                ),
                {
                  dismissible: true,
                  data: { wish: {}, images: [], editMode: false },
                  size: 'auto',
                },
              )
              .pipe(
                filter(notNullOrUndefined),
                switchMap(() => EMPTY),
              ),
          ),
        ),
      );

      // Edit wish dialog effect
      register(
        actions.editWish$.pipe(
          switchMap((wish) =>
            this.dialogService
              .open<WishDialogInput>(
                new PolymorpheusComponent(
                  WishDialogComponent,
                  this.componentInjector,
                ),
                {
                  dismissible: true,
                  data: { wish, images: [], editMode: true },
                  size: 'auto',
                },
              )
              .pipe(
                filter(notNullOrUndefined),
                switchMap(() => EMPTY),
              ),
          ),
        ),
      );

      // Delete wish effect - can be extended with confirmation dialog
      register(actions.deleteWish$, (wish) => {
        // TODO: Add delete confirmation dialog and API call
        console.log('Delete wish:', wish);
      });
    });
  }
}
