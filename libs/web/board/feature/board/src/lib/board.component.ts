import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RxFor } from '@rx-angular/template/for';
import { RxLet } from '@rx-angular/template/let';
import { BoardAdapter } from '@wishare/web/board/data-access';
import { WishlistUi, type Wishlist } from '@wishare/web/wishlist/data-access';
import { WishListComponent } from '@wishare/web/wishlist/feature/list';
import type { Models } from 'appwrite';

@Component({
  selector: 'wishare-board',
  standalone: true,
  imports: [
    DragDropModule,
    RxFor,
    RxLet,
    WishListComponent
],
  providers: [BoardAdapter],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  private boardAdapter = inject(BoardAdapter);
  public readonly wishLists$ = this.boardAdapter.select('wishLists');

  constructor() {
    this.boardAdapter.initialize();
  }

  drop(wishList: CdkDragDrop<(Wishlist & { [x: string]: Models.DocumentList<Models.Document> })[]>) {
    console.log('Dropped', wishList);
  }
}
