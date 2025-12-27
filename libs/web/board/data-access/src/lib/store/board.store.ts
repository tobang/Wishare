import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';

import { WithInitializer } from '@wishare/web/shared/utils';
import { catchError, map, of, switchMap, tap, type Observable } from 'rxjs';
import { BoardService } from '../services/board.service';
import type { Models } from 'appwrite';
import type { Wishlist } from '@wishare/web/wishlist/data-access';
import { createBoardViewModel } from './board.selectors';
import { BoardActions, BoardStateModel } from './board.types';

/**
 * Store managing the state for the board feature.
 *
 * Key responsibilities:
 * - Managing wishlists
 * - Creating new wishlists
 * - Fetching board data
 */
@Injectable()
export class BoardStore implements WithInitializer {
  private readonly boardService = inject(BoardService);
  public readonly actions = rxActions<BoardActions>();

  public readonly store = rxState<BoardStateModel>(({ connect, set }) => {
    set({ wishLists: [], loading: true });

    type BoardData = (Wishlist & {
      [x: string]: Models.DocumentList<Models.Document>;
    })[];

    connect(
      this.actions.fetchWishlists$.pipe(
        switchMap(() =>
          this.boardService.getBoard().pipe(
            tap((data) => console.log('Board', data)),
            map((data) => ({ wishLists: data as BoardData, loading: false })),
            catchError(
              (): Observable<{ wishLists: BoardData; loading: boolean }> =>
                of({ wishLists: [], loading: false }),
            ),
          ),
        ),
      ),
    );
  });

  public readonly vm = createBoardViewModel(this.store);

  initialize(): void {
    this.actions.fetchWishlists();
  }

  createWishlist(): void {
    this.actions.createWishlist();
  }
}
