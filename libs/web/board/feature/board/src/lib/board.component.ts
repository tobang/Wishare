import {
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  DragDropModule,
} from '@angular/cdk/drag-drop';

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
} from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { scopeLoader } from 'scoped-translations';
import { TuiButton, TuiDialogService, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { BoardStore, type BoardWishlist } from '@wishare/web/board/data-access';
import { WishListComponent } from '@wishare/web/wishlist/feature/list';
import { filter } from 'rxjs';
import {
  CreateWishlistDialogComponent,
  CreateWishlistDialogInput,
  CreateWishlistDialogResult,
} from './create-wishlist-dialog';
import { WishlistUi } from '@wishare/web/wishlist/data-access';

@Component({
  selector: 'wishare-board',
  standalone: true,
  imports: [
    DragDropModule,
    CdkDragPreview,
    CdkDragPlaceholder,
    TuiButton,
    TuiCardLarge,
    TuiHeader,
    TuiIcon,
    TuiSkeleton,
    TuiTitle,
    WishListComponent,
    TranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'board',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`),
        ),
      },
    },
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
          closable: true,
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

  editWishlist(wishlist: WishlistUi) {
    const dialogInput: CreateWishlistDialogInput = {
      title: wishlist.title,
      description: wishlist.description,
      editMode: true,
    };

    this.dialogService
      .open<CreateWishlistDialogResult | null>(
        new PolymorpheusComponent(CreateWishlistDialogComponent, this.injector),
        {
          label: 'Edit Wishlist',
          size: 'm',
          closable: true,
          dismissible: true,
          data: dialogInput,
        },
      )
      .pipe(filter((result): result is CreateWishlistDialogResult => !!result))
      .subscribe((result) => {
        this.boardStore.actions.editWishlist({
          wishlistId: wishlist.$id,
          title: result.title,
          description: result.description,
        });
      });
  }
}
