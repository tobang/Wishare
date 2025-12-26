import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { BoardStore, BoardEffects } from '@wishare/web/board/data-access';
import { type Wishlist } from '@wishare/web/wishlist/data-access';
import { WishListComponent } from '@wishare/web/wishlist/feature/list';
import type { Models } from 'appwrite';

@Component({
  selector: 'wishare-board',
  standalone: true,
  imports: [DragDropModule, TuiButton, WishListComponent],
  providers: [BoardStore, BoardEffects],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  private boardStore = inject(BoardStore);
  public readonly wishLists = this.boardStore.vm.wishLists;

  constructor() {
    console.log('BoardComponent initialized');
    this.boardStore.initialize();
  }

  drop(
    wishList: CdkDragDrop<
      (Wishlist & { [x: string]: Models.DocumentList<Models.Document> })[]
    >,
  ) {
    console.log('Dropped', wishList);
  }

  createWishlist() {
    this.boardStore.createWishlist();
  }
}
