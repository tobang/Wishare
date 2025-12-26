import { inject, Injectable } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { RxActionFactory } from '@rx-angular/state/actions';
import { BoardStateModel } from './board-state.model';

import { WithInitializer } from '@wishare/web/shared/utils';
import { catchError, map, of, switchMap, tap, type Observable } from 'rxjs';
import { BoardService } from '../services/board.service';
import type { Models } from 'appwrite';
import type { Wishlist } from '@wishare/web/wishlist/data-access';

export interface BoardCommand {
  fetchWishlists: void;
  fetchBoard: void;
}

@Injectable()
export class BoardAdapter
  extends RxState<BoardStateModel>
  implements WithInitializer
{
  private readonly rxAction = inject(RxActionFactory<BoardCommand>);
  private readonly boardService = inject(BoardService);
  private readonly actions = this.rxAction.create();

  constructor() {
    super();

    type BoardData = (Wishlist & {
      [x: string]: Models.DocumentList<Models.Document>;
    })[];

    this.connect(
      'wishLists',
      this.actions.fetchWishlists$.pipe(
        switchMap(() =>
          this.boardService.getBoard().pipe(
            tap((data) => console.log('Board', data)),
            map((data) => data as BoardData),
            catchError((): Observable<BoardData> => of([])),
          ),
        ),
      ),
    );
  }

  initialize(): void {
    this.actions.fetchWishlists();
  }
}
