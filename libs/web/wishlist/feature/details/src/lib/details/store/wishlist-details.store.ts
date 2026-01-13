import { inject, Injectable } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { rxActions } from '@rx-angular/state/actions';
import { map, switchMap, tap } from 'rxjs/operators';
import {
  StreamState,
  toState,
  resetStreamState,
} from '@wishare/web/shared/utils';
import { BoardWishlist, BoardService } from '@wishare/web/board/data-access';
import { WishFlat } from '@wishare/web/wishlist/data-access';
import { AuthStore } from '@wishare/web/auth/data-access';

export type WishlistDetailsStateModel = {
  wishlist: StreamState<BoardWishlist>;
  reserveState: StreamState<WishFlat>;
  unreserveState: StreamState<WishFlat>;
  deleteState: StreamState<void>;
  currentWishlistId: string | null;
};

type WishlistDetailsActions = {
  loadWishlist: string;
  reserveWish: string;
  unreserveWish: string;
  deleteWish: string;
  resetReserveState: void;
  resetUnreserveState: void;
  resetDeleteState: void;
};

@Injectable()
export class WishlistDetailsStore {
  private readonly boardService = inject(BoardService);
  private readonly authStore = inject(AuthStore);
  public readonly actions = rxActions<WishlistDetailsActions>();

  private readonly store = rxState<WishlistDetailsStateModel>(
    ({ set, connect }) => {
      set({
        wishlist: resetStreamState(),
        reserveState: resetStreamState(),
        unreserveState: resetStreamState(),
        deleteState: resetStreamState(),
        currentWishlistId: null,
      });

      // Store the wishlist ID when loading
      connect(
        'currentWishlistId',
        this.actions.loadWishlist$.pipe(map((id) => id)),
      );

      // Load wishlist
      connect(
        'wishlist',
        this.actions.loadWishlist$.pipe(
          switchMap((id) => this.boardService.getWishlist(id).pipe(toState())),
        ),
      );

      // Reserve wish action - updates reserveState and reloads wishlist
      connect(
        'reserveState',
        this.actions.reserveWish$.pipe(
          switchMap((wishId) =>
            this.boardService.reserveWish(wishId).pipe(
              tap(() => {
                // Reload the wishlist to get updated data
                const wishlistId = this.store.get('currentWishlistId');
                if (wishlistId) {
                  this.actions.loadWishlist(wishlistId);
                }
              }),
              toState(),
            ),
          ),
        ),
      );

      // Unreserve wish action - updates unreserveState and reloads wishlist
      connect(
        'unreserveState',
        this.actions.unreserveWish$.pipe(
          switchMap((wishId) =>
            this.boardService.unreserveWish(wishId).pipe(
              tap(() => {
                // Reload the wishlist to get updated data
                const wishlistId = this.store.get('currentWishlistId');
                if (wishlistId) {
                  this.actions.loadWishlist(wishlistId);
                }
              }),
              toState(),
            ),
          ),
        ),
      );

      // Delete wish action - deletes the wish and reloads wishlist
      connect(
        'deleteState',
        this.actions.deleteWish$.pipe(
          switchMap((wishId) =>
            this.boardService.deleteWish(wishId).pipe(
              tap(() => {
                // Reload the wishlist to get updated data
                const wishlistId = this.store.get('currentWishlistId');
                if (wishlistId) {
                  this.actions.loadWishlist(wishlistId);
                }
              }),
              toState(),
            ),
          ),
        ),
      );

      // Reset states
      connect(this.actions.resetReserveState$, () => ({
        reserveState: resetStreamState<WishFlat>(),
      }));

      connect(this.actions.resetUnreserveState$, () => ({
        unreserveState: resetStreamState<WishFlat>(),
      }));

      connect(this.actions.resetDeleteState$, () => ({
        deleteState: resetStreamState<void>(),
      }));
    },
  );

  public readonly wishlist = this.store.signal('wishlist');
  public readonly reserveState = this.store.signal('reserveState');
  public readonly unreserveState = this.store.signal('unreserveState');
  public readonly deleteState = this.store.signal('deleteState');

  /**
   * Returns the current user ID or null if not authenticated.
   */
  get currentUserId(): string | null {
    return this.authStore.vm.account()?.$id ?? null;
  }

  /**
   * Checks if the current user is the owner of a wish.
   */
  isWishOwner(wish: WishFlat): boolean {
    return wish.uid === this.currentUserId;
  }

  /**
   * Checks if the current user has reserved a wish.
   */
  isReservedByCurrentUser(wish: WishFlat): boolean {
    return wish.reservedBy === this.currentUserId;
  }
}
