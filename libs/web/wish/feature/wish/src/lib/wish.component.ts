import { CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { BoardService } from '@wishare/web/board/data-access';
import { WishFlat } from '@wishare/web/wishlist/data-access';

@Component({
  selector: 'wishare-wish',
  standalone: true,
  imports: [CdkDragHandle, TuiIcon],
  templateUrl: './wish.component.html',
  styleUrls: ['./wish.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishComponent {
  private readonly boardService = inject(BoardService);

  readonly wish = input.required<WishFlat>();
  readonly selected = input(false);
  readonly wishClick = output<WishFlat>();

  @HostListener('click')
  onClick() {
    this.wishClick.emit(this.wish());
  }

  getImageUrl(fileId: string): string {
    return this.boardService.getWishImagePreviewUrl(fileId);
  }
}
