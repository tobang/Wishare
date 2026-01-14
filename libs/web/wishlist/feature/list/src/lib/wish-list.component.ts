import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
} from '@angular/cdk/drag-drop';

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { scopeLoader } from 'scoped-translations';

import { TuiButton, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { WishComponent } from '@wishare/web/wish/feature/wish';

import { WishFlat, WishlistUi } from '@wishare/web/wishlist/data-access';

/**
 * Data emitted when wishes are reordered within a wishlist
 */
export interface ReorderWishesEvent {
  wishlistId: string;
  previousIndex: number;
  currentIndex: number;
}

@Component({
  selector: '[wishare-wish-list]',
  standalone: true,
  imports: [
    WishComponent,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    CdkDropList,
    TuiButton,
    TuiCardLarge,
    TuiHeader,
    TuiIcon,
    TuiTitle,
    TranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'wishlist',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`),
        ),
      },
    },
  ],
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishListComponent {
  // Inputs - receive data from parent
  readonly wishlist = input.required<WishlistUi>();

  // Scroll state
  readonly canScrollUp = signal(false);
  readonly canScrollDown = signal(true);

  // Outputs - emit actions to parent
  readonly createWishClick = output<string>();
  readonly editWishlistClick = output<WishlistUi>();
  readonly deleteWishlistClick = output<string>();
  readonly shareWishlistClick = output<string>();
  readonly editWishClick = output<{ wishlistId: string; wish: WishFlat }>();
  readonly reorderWishesClick = output<ReorderWishesEvent>();
  readonly wishListClick = output<string>();

  createWish() {
    this.createWishClick.emit(this.wishlist().$id);
  }

  editWishlist() {
    this.editWishlistClick.emit(this.wishlist());
  }

  deleteWishlist() {
    this.deleteWishlistClick.emit(this.wishlist().$id);
  }

  shareWishlist() {
    this.shareWishlistClick.emit(this.wishlist().$id);
  }

  onWishClick(wish: WishFlat) {
    this.editWishClick.emit({ wishlistId: this.wishlist().$id, wish });
  }

  onWishDrop(event: CdkDragDrop<WishFlat[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    this.reorderWishesClick.emit({
      wishlistId: this.wishlist().$id,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });
  }

  openDetails() {
    this.wishListClick.emit(this.wishlist().$id);
  }

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    this.canScrollUp.set(scrollTop > 5);
    this.canScrollDown.set(scrollTop + clientHeight < scrollHeight - 5);
  }
}
