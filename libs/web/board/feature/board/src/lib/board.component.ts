import {
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  DragDropModule,
} from '@angular/cdk/drag-drop';

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiAppearance, TuiButton, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { BoardStore, type BoardWishlist } from '@wishare/web/board/data-access';
import { WishListComponent } from '@wishare/web/wishlist/feature/list';

@Component({
  selector: 'wishare-board',
  standalone: true,
  imports: [
    DragDropModule,
    CdkDragPreview,
    CdkDragPlaceholder,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiHeader,
    TuiIcon,
    TuiSkeleton,
    TuiTitle,
    WishListComponent,
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  private readonly boardStore = inject(BoardStore);
  public readonly wishLists = this.boardStore.vm.wishLists;
  public readonly isLoading = this.boardStore.vm.isLoading;

  constructor() {
    console.log('BoardComponent initialized');
    this.boardStore.initialize();
  }

  drop(wishList: CdkDragDrop<BoardWishlist[]>) {
    console.log('Dropped', wishList);
  }

  createWishlist() {
    this.boardStore.ui.createWishlist();
  }
}
