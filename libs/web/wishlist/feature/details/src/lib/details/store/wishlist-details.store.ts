import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';
import { switchMap } from 'rxjs/operators';
import {
  StreamState,
  toState,
  resetStreamState,
} from '@wishare/web/shared/utils';
import { BoardWishlist, BoardService } from '@wishare/web/board/data-access';

export type WishlistDetailsStateModel = {
  wishlist: StreamState<BoardWishlist>;
};

type WishlistDetailsActions = {
  loadWishlist: string;
};

@Injectable()
export class WishlistDetailsStore {
  private readonly boardService = inject(BoardService);
  public readonly actions = rxActions<WishlistDetailsActions>();

  private readonly store = rxState<WishlistDetailsStateModel>(
    ({ set, connect }) => {
      set({
        wishlist: resetStreamState(),
      });

      connect(
        'wishlist',
        this.actions.loadWishlist$.pipe(
          switchMap((id) => this.boardService.getWishlist(id).pipe(toState())),
        ),
      );
    },
  );

  public readonly wishlist = this.store.signal('wishlist');
}
