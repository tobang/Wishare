import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TuiIsland } from '@taiga-ui/kit';
import { Wish } from '@wishare/web/wishlist/data-access';

@Component({
  selector: 'wishare-wish',
  standalone: true,
  imports: [CommonModule, TuiIsland],
  templateUrl: './wish.component.html',
  styleUrls: ['./wish.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishComponent {
  @Input() wish!: Wish;
  @Input() selected = false;
}
