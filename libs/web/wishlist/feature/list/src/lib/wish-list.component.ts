import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TuiButton } from '@taiga-ui/core';
import { TuiIsland } from '@taiga-ui/kit';
import { WishComponent } from '@wishare/web/wish/feature/wish';

import { WishlistUi } from '@wishare/web/wishlist/data-access';
import { WishlistAdapter } from './wish-list.adapter';

@Component({
  selector: '[wishare-wish-list]',
  standalone: true,
  imports: [
    CommonModule,
    WishComponent,
    DragDropModule,
    TuiButton,
    TuiIsland,
  ],
  providers: [WishlistAdapter],
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishListComponent {
  @Input() wishlist!: WishlistUi;
  constructor(private adapter: WishlistAdapter) {}

  createWish() {
    this.adapter.createWish();
  }
}
