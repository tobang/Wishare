import { DragDropModule } from '@angular/cdk/drag-drop';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { WishComponent } from '@wishare/web/wish/feature/wish';

import { WishlistUi } from '@wishare/web/wishlist/data-access';
import { WishlistStore, WishlistEffects } from './store';
import { WishlistDialogEffects } from './store/effects';

@Component({
  selector: '[wishare-wish-list]',
  standalone: true,
  imports: [WishComponent, DragDropModule, TuiButton, TuiCardLarge],
  providers: [WishlistStore, WishlistEffects, WishlistDialogEffects],
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishListComponent {
  @Input() wishlist!: WishlistUi;
  constructor(private adapter: WishlistStore) {}

  createWish() {
    this.adapter.createWish();
  }
}
