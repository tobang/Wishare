import { CdkDragHandle, DragDropModule } from '@angular/cdk/drag-drop';

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';

import { TuiAppearance, TuiButton, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { WishComponent } from '@wishare/web/wish/feature/wish';

import { WishlistUi } from '@wishare/web/wishlist/data-access';
import { WishlistStore, WishlistEffects } from './store';
import { WishlistDialogEffects } from './store/effects';

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
  providers: [WishlistStore, WishlistEffects, WishlistDialogEffects],
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishListComponent {
  @Input() wishlist!: WishlistUi;
  private adapter = inject(WishlistStore);

  createWish() {
    this.adapter.createWish();
  }
}
