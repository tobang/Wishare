import { inject, Injectable, Injector } from '@angular/core';
import { RxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { TranslocoService } from '@jsverse/transloco';
import { notNullOrUndefined } from '@wishare/web/shared/utils';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogInput,
} from '@wishare/web/shared/ui/confirmation-dialog';
import {
  WishDialogComponent,
  WishDialogInput,
} from '@wishare/web/wish/ui/dialog';
import { EMPTY, filter, switchMap, tap } from 'rxjs';
import { BoardService, BoardStore } from '@wishare/web/board/data-access';
import { flattenWish, WishlistUi } from '@wishare/web/wishlist/data-access';

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
  private readonly boardService = inject(BoardService);
  private readonly boardStore = inject(BoardStore);
  private readonly transloco = inject(TranslocoService);

  // Wishlist to be deleted - set by the component
  wishlistToDelete: WishlistUi | null = null;

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
                  data: {
                    wish: flattenWish(wish),
                    images: [],
                    editMode: true,
                  },
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

      // Delete wish effect - can be extended with confirmation dialog
      register(actions.deleteWish$, (wish) => {
        // TODO: Add delete confirmation dialog and API call
        console.log('Delete wish:', wish);
      });

      // Delete wishlist effect with confirmation
      register(
        actions.deleteWishlist$.pipe(
          switchMap(() => {
            if (!this.wishlistToDelete) {
              return EMPTY;
            }

            const dialogData: ConfirmationDialogInput = {
              title: this.transloco.translate('wishlist.delete-confirm-title'),
              message: this.transloco.translate(
                'wishlist.delete-confirm-message',
                { title: this.wishlistToDelete.title },
              ),
              confirmText: this.transloco.translate(
                'wishlist.delete-confirm-yes',
              ),
              cancelText: this.transloco.translate(
                'wishlist.delete-confirm-no',
              ),
            };

            // Show confirmation dialog
            return this.dialogService
              .open<boolean>(
                new PolymorpheusComponent(
                  ConfirmationDialogComponent,
                  this.componentInjector,
                ),
                {
                  dismissible: true,
                  label: dialogData.title,
                  size: 's',
                  data: dialogData,
                },
              )
              .pipe(
                filter((confirmed) => confirmed === true),
                switchMap(() => {
                  const wishlistId = this.wishlistToDelete!.$id;
                  return this.boardService.deleteWishlist(wishlistId);
                }),
                tap(() => {
                  // Refresh the board to show updated wishlist
                  this.boardStore.actions.fetchWishlists();
                  this.wishlistToDelete = null;
                }),
              );
          }),
        ),
      );
    });
  }
}
