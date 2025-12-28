import { inject, Injectable } from '@angular/core';
import { rxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';

import { map, ReplaySubject, switchMap, tap } from 'rxjs';
import { StreamState, toState } from '@wishare/web/shared/utils';
import { Wishlist } from '@wishare/web/wishlist/data-access';

import { BoardService } from '../services/board.service';
import { BoardResult, BoardUIActions } from './board.types';

/**
 * Effects for board actions.
 *
 * Handles:
 * - Fetching wishlists
 * - Creating new wishlists
 * - Error handling and navigation
 */
@Injectable({
  providedIn: 'root',
})
export class BoardEffects {
  private readonly boardService = inject(BoardService);

  // Public actions for UI interactions
  public readonly actions = rxActions<BoardUIActions>();

  // Internal state update streams
  // These are populated by effects and consumed by the store
  // Using ReplaySubject(1) so late subscribers get the last emitted value
  private readonly _fetchState$ = new ReplaySubject<StreamState<BoardResult>>(
    1,
  );
  private readonly _createState$ = new ReplaySubject<StreamState<Wishlist>>(1);

  readonly fetchState$ = this._fetchState$.asObservable();
  readonly createState$ = this._createState$.asObservable();

  // Effects registered directly
  private readonly effects = rxEffects(({ register }) => {
    register(
      this.actions.fetchWishlists$.pipe(
        switchMap(() =>
          this.boardService.getBoard().pipe(
            tap((data) => console.log('Board data:', data)),
            map((wishLists) => ({ wishLists }) as BoardResult),
          ),
        ),
        toState(),
      ),
      (state) => {
        this._fetchState$.next(state);
      },
    );

    register(
      this.actions.createWishlist$.pipe(
        switchMap(() => this.boardService.createWishlist()),
        toState(),
      ),
      (state) => {
        if (state.hasValue && state.value) {
          // Trigger a refresh of wishlists after creating a new one
          this.actions.fetchWishlists();
        }
        if (state.hasError) {
          console.error('Create wishlist error:', state.error);
        }
        this._createState$.next(state);
      },
    );
  });
}
