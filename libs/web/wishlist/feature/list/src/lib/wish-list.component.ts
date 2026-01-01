import { CdkDragHandle, DragDropModule } from '@angular/cdk/drag-drop';

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { scopeLoader } from 'scoped-translations';

import { TuiButton, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { WishComponent } from '@wishare/web/wish/feature/wish';

import { WishlistUi } from '@wishare/web/wishlist/data-access';

@Component({
  selector: '[wishare-wish-list]',
  standalone: true,
  imports: [
    WishComponent,
    DragDropModule,
    CdkDragHandle,
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

  // Outputs - emit actions to parent
  readonly createWishClick = output<string>();
  readonly editWishlistClick = output<WishlistUi>();
  readonly deleteWishlistClick = output<string>();

  createWish() {
    this.createWishClick.emit(this.wishlist().$id);
  }

  editWishlist() {
    this.editWishlistClick.emit(this.wishlist());
  }

  deleteWishlist() {
    this.deleteWishlistClick.emit(this.wishlist().$id);
  }
}
