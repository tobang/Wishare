import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {
  CommonModule,
  CurrencyPipe,
  DatePipe,
  registerLocaleData,
} from '@angular/common';
import localeDa from '@angular/common/locales/da';
import { WishFlat } from '@wishare/web/wishlist/data-access';
import { TuiIcon, TuiButton } from '@taiga-ui/core';
import { BoardService } from '@wishare/web/board/data-access';
import { TranslocoService } from '@jsverse/transloco';

// Register Danish locale data
registerLocaleData(localeDa);

@Component({
  selector: 'wishare-wish-card',
  standalone: true,
  imports: [CommonModule, TuiIcon, TuiButton, DatePipe, CurrencyPipe],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishCardComponent {
  private readonly boardService = inject(BoardService);
  private readonly transloco = inject(TranslocoService);

  readonly wish = input.required<WishFlat>();

  /**
   * Whether the current user owns this wish.
   * When true, reservation UI is hidden.
   */
  readonly isOwner = input<boolean>(false);

  /**
   * Whether the current user has reserved this wish.
   */
  readonly isReservedByMe = input<boolean>(false);

  /**
   * Emits when the user wants to reserve this wish.
   */
  readonly reserve = output<string>();

  /**
   * Emits when the user wants to unreserve this wish.
   */
  readonly unreserve = output<string>();

  get locale(): string {
    return this.transloco.getActiveLang();
  }

  /**
   * Whether the wish is reserved by anyone.
   */
  get isReserved(): boolean {
    return !!this.wish().reservedBy;
  }

  /**
   * Whether the wish is reserved by someone else (not the current user).
   */
  get isReservedByOther(): boolean {
    return this.isReserved && !this.isReservedByMe();
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

  onReserveClick(): void {
    this.reserve.emit(this.wish().$id);
  }

  onUnreserveClick(): void {
    this.unreserve.emit(this.wish().$id);
  }
}
