/* eslint-disable @angular-eslint/component-selector */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TuiLoader,
  TuiIcon,
  TuiButton,
  TuiDialogService,
} from '@taiga-ui/core';
import { WishlistDetailsStore } from './store/wishlist-details.store';
import { WishCardComponent } from '@wishare/web/wish/ui/card';
import { TuiTitle } from '@taiga-ui/core';
import { TuiHeader } from '@taiga-ui/layout';
import { HeaderContentDirective } from '@wishare/web/shared/services';
import { WishFlat } from '@wishare/web/wishlist/data-access';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import {
  WishDialogComponent,
  WishDialogInput,
  WishDialogResult,
} from '@wishare/web/wish/ui/dialog';
import { filter } from 'rxjs';

@Component({
  selector: 'wishare-wishlist-details',
  standalone: true,
  imports: [
    CommonModule,
    TuiLoader,
    WishCardComponent,
    TuiHeader,
    TuiTitle,
    TuiIcon,
    TuiButton,
    HeaderContentDirective,
  ],
  providers: [WishlistDetailsStore],
  templateUrl: './wishlist-details.component.html',
  styleUrls: ['./wishlist-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistDetailsComponent implements OnInit {
  protected readonly store = inject(WishlistDetailsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogService = inject(TuiDialogService);
  private readonly injector = inject(Injector);

  public readonly wishlistStream = this.store.wishlist;

  public navigateToBoard(): void {
    this.router.navigate(['/wishlists']);
  }

  /**
   * Checks if the current user is the owner of a wish.
   */
  isWishOwner(wish: WishFlat): boolean {
    return this.store.isWishOwner(wish);
  }

  /**
   * Checks if the current user has reserved a wish.
   */
  isReservedByCurrentUser(wish: WishFlat): boolean {
    return this.store.isReservedByCurrentUser(wish);
  }

  /**
   * Handles the reserve action from a wish card.
   */
  onReserveWish(wishId: string): void {
    this.store.actions.reserveWish(wishId);
  }

  /**
   * Handles the unreserve action from a wish card.
   */
  onUnreserveWish(wishId: string): void {
    this.store.actions.unreserveWish(wishId);
  }

  /**
   * Handles the delete action from a wish card.
   */
  onDeleteWish(wishId: string): void {
    this.store.actions.deleteWish(wishId);
  }

  /**
   * Handles the edit action from a wish card.
   */
  onEditWish(wishId: string): void {
    const wishlist = this.store.wishlist();
    if (!wishlist.hasValue || !wishlist.value) return;

    const wish = wishlist.value.wishes?.rows?.find(
      (w: WishFlat) => w.$id === wishId,
    );
    if (!wish) return;

    this.dialogService
      .open<WishDialogResult | null>(
        new PolymorpheusComponent(WishDialogComponent, this.injector),
        {
          dismissible: true,
          data: {
            wish: wish,
            images: wish.files || [],
            editMode: true,
          } as WishDialogInput,
          size: 'l',
        },
      )
      .pipe(filter((result): result is WishDialogResult => result != null))
      .subscribe((result) => {
        this.store.actions.updateWish({
          wishId: wish.$id,
          data: result.wishData,
          images: result.imageFiles,
        });
      });
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('wishlistId');
      if (id) {
        this.store.actions.loadWishlist(id);
      }
    });
  }
}
