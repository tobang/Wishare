import { CdkDragHandle, DragDropModule } from '@angular/cdk/drag-drop';

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { TuiAppearance, TuiButton, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { WishComponent } from '@wishare/web/wish/feature/wish';

import { WishlistUi } from '@wishare/web/wishlist/data-access';
import { WishlistStore, WishlistEffects } from './store';

@Component({
  selector: '[wishare-wish-list]',
  standalone: true,
  imports: [
    WishComponent,
    DragDropModule,
    CdkDragHandle,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiHeader,
    TuiIcon,
    TuiTitle,
  ],
  providers: [WishlistStore, WishlistEffects],
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishListComponent {
  readonly wishlist = input.required<WishlistUi>();
  private store = inject(WishlistStore);

  createWish() {
    this.store.ui.createWish();
  }
}
