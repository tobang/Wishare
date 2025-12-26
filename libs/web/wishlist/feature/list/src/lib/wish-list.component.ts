import { DragDropModule } from '@angular/cdk/drag-drop';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { WishComponent } from '@wishare/web/wish/feature/wish';

import { WishlistUi } from '@wishare/web/wishlist/data-access';
import { WishlistAdapter } from './wish-list.adapter';

@Component({
  selector: '[wishare-wish-list]',
  standalone: true,
  imports: [WishComponent, DragDropModule, TuiButton, TuiCardLarge, TuiIcon],
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
