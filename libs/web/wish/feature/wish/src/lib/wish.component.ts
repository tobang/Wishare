
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { Wish } from '@wishare/web/wishlist/data-access';

@Component({
  selector: 'wishare-wish',
  standalone: true,
  imports: [TuiCardLarge],
  templateUrl: './wish.component.html',
  styleUrls: ['./wish.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishComponent {
  @Input() wish!: Wish;
  @Input() selected = false;
}
