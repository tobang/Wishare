import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TuiLoader } from '@taiga-ui/core';
import { WishlistDetailsStore } from './store/wishlist-details.store';
import { WishComponent } from '@wishare/web/wish/feature/wish';
import { TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiHeader } from '@taiga-ui/layout';

@Component({
  selector: 'wishare-wishlist-details',
  standalone: true,
  imports: [CommonModule, TuiLoader, WishComponent, TuiHeader, TuiTitle],
  providers: [WishlistDetailsStore],
  templateUrl: './wishlist-details.component.html',
  styleUrls: ['./wishlist-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistDetailsComponent implements OnInit {
  private readonly store = inject(WishlistDetailsStore);
  private readonly route = inject(ActivatedRoute);

  public readonly wishlistStream = this.store.wishlist;

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('wishlistId');
      if (id) {
        this.store.actions.loadWishlist(id);
      }
    });
  }
}
