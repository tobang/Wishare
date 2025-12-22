import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ForModule } from '@rx-angular/template/for';
import { LetModule } from '@rx-angular/template/let';
import { TuiSvg } from '@taiga-ui/core';
import { BoardAdapter } from '@wishare/web/board/data-access';
import { WishlistUi } from '@wishare/web/wishlist/data-access';
import { WishListComponent } from '@wishare/web/wishlist/feature/list';

@Component({
  selector: 'wishare-board',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    ForModule,
    LetModule,
    TuiSvg,
    WishListComponent,
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

  drop(wishList: CdkDragDrop<WishlistUi[]>) {
    console.log('Dropped', wishList);
  }
}
