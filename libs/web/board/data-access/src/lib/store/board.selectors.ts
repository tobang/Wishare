import { computed, Signal } from '@angular/core';
import { StreamState } from '@wishare/web/shared/utils';
import { Wishlist } from '@wishare/web/wishlist/data-access';
import { BoardResult, BoardStateModel, BoardWishlist } from './board.types';

/**
 * Interface for the store object used in view model creation.
 * Matches the shape returned by rxState() from @rx-angular/state.
 */
interface RxStateStore<T extends object> {
  signal<K extends keyof T>(key: K): Signal<T[K]>;
}

/**
 * Creates and returns view model signals for the Board feature.
 * @param store The store instance.
 * @returns An object containing Signals for the component.
 */
export const createBoardViewModel = (store: RxStateStore<BoardStateModel>) => {
  const wishLists: Signal<BoardWishlist[]> = store.signal('wishLists');
  const fetchState: Signal<StreamState<BoardResult>> =
    store.signal('fetchState');
  const createState: Signal<StreamState<Wishlist>> =
    store.signal('createState');

  /**
   * Whether the board is currently loading (fetching wishlists).
   */
  const isLoading = computed(() => {
    return fetchState().isLoading;
  });

  /**
   * Whether there is an error in any board operation.
   */
  const hasError = computed(() => {
    return fetchState().hasError || createState().hasError;
  });

  /**
   * Returns the first error encountered from any board operation.
   * Returns null if no errors are present.
   */
  const error = computed(() => {
    if (fetchState().hasError) return fetchState().error;
    if (createState().hasError) return createState().error;
    return null;
  });

  /**
   * Whether wishlists have been successfully loaded.
   */
  const hasWishlists = computed(() => {
    return wishLists().length > 0;
  });

  /**
   * Count of wishlists.
   */
  const wishlistCount = computed(() => {
    return wishLists().length;
  });

  return {
    wishLists,
    fetchState,
    createState,
    isLoading,
    hasError,
    error,
    hasWishlists,
    wishlistCount,
  };
};

export type BoardViewModel = ReturnType<typeof createBoardViewModel>;
