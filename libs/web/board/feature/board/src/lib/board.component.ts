import {
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  DragDropModule,
} from '@angular/cdk/drag-drop';

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
} from '@angular/core';
import {
  TuiAppearance,
  TuiButton,
  TuiDialogService,
  TuiIcon,
  TuiTitle,
} from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { BoardStore, type BoardWishlist } from '@wishare/web/board/data-access';
import { WishListComponent } from '@wishare/web/wishlist/feature/list';
import { filter } from 'rxjs';
import {
  CreateWishlistDialogComponent,
  CreateWishlistDialogResult,
} from './create-wishlist-dialog';

@Component({
  selector: 'wishare-board',
  standalone: true,
  imports: [
    DragDropModule,
    CdkDragPreview,
    CdkDragPlaceholder,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiHeader,
    TuiIcon,
    TuiSkeleton,
    TuiTitle,
    WishListComponent,
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  private readonly boardStore = inject(BoardStore);
  private readonly dialogService = inject(TuiDialogService);
  private readonly injector = inject(Injector);

  public readonly wishLists = this.boardStore.vm.wishLists;
  public readonly isLoading = this.boardStore.vm.isLoading;

  constructor() {
    console.log('BoardComponent initialized');
    this.boardStore.initialize();
  }

  drop(event: CdkDragDrop<BoardWishlist[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // Trigger the store action to persist the new order to the backend
    // The effects will handle the optimistic update and reordering
    this.boardStore.actions.reorderWishlists({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });
  }

  createWishlist() {
    this.dialogService
      .open<CreateWishlistDialogResult | null>(
        new PolymorpheusComponent(CreateWishlistDialogComponent, this.injector),
        {
          label: 'Create New Wishlist',
          size: 'm',
          closeable: true,
          dismissible: true,
        },
      )
      .pipe(filter((result): result is CreateWishlistDialogResult => !!result))
      .subscribe((result) => {
        this.boardStore.actions.createWishlist({
          title: result.title,
          description: result.description,
        });
      });
  }
}
