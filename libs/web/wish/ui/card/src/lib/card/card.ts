import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  CommonModule,
  CurrencyPipe,
  DatePipe,
  registerLocaleData,
} from '@angular/common';
import localeDa from '@angular/common/locales/da';
import { WishFlat } from '@wishare/web/wishlist/data-access';
import { TuiIcon } from '@taiga-ui/core';
import { BoardService } from '@wishare/web/board/data-access';
import { TranslocoService } from '@jsverse/transloco';

// Register Danish locale data
registerLocaleData(localeDa);

@Component({
  selector: 'wishare-wish-card',
  standalone: true,
  imports: [CommonModule, TuiIcon, DatePipe, CurrencyPipe],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishCardComponent {
  private readonly boardService = inject(BoardService);
  private readonly transloco = inject(TranslocoService);

  readonly wish = input.required<WishFlat>();

  get locale(): string {
    return this.transloco.getActiveLang();
  }

  getImageUrl(fileId: string): string {
    return this.boardService.getWishImagePreviewUrl(fileId);
  }

  getPriorityColor(priority: number): string {
    switch (priority) {
      case 1:
        return 'green';
      case 2:
        return 'blue';
      case 3:
        return 'purple';
      default:
        return 'blue';
    }
  }

  getPriorityLabel(priority: number): string {
    switch (priority) {
      case 1:
        return 'Low';
      case 2:
        return 'Medium';
      case 3:
        return 'High';
      default:
        return 'Normal';
    }
  }
}
