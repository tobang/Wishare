/* eslint-disable @angular-eslint/component-selector */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TuiLoader, TuiIcon, TuiButton } from '@taiga-ui/core';
import { WishlistDetailsStore } from './store/wishlist-details.store';
import { WishCardComponent } from '@wishare/web/wish/ui/card';
import { TuiTitle } from '@taiga-ui/core';
import { TuiHeader } from '@taiga-ui/layout';
import { HeaderContentDirective } from '@wishare/web/shared/services';

@Component({
  selector: 'wishare-wishlist-details',
  standalone: true,
  imports: [
    CommonModule,
    TuiLoader,
    WishCardComponent,
    TuiHeader,
    TuiTitle,
    TuiIcon,
    TuiButton,
    HeaderContentDirective,
  ],
  providers: [WishlistDetailsStore],
  templateUrl: './wishlist-details.component.html',
  styleUrls: ['./wishlist-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistDetailsComponent implements OnInit {
  private readonly store = inject(WishlistDetailsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public readonly wishlistStream = this.store.wishlist;

  public navigateToBoard(): void {
    this.router.navigate(['/wishlists']);
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('wishlistId');
      if (id) {
        this.store.actions.loadWishlist(id);
      }
    });
  }
}
