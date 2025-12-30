import { Signal } from '@angular/core';
import { WishlistStateModel } from './wishlist.types';

/**
 * Interface for the store object used in view model creation.
 * Matches the shape returned by rxState() from @rx-angular/state.
 */
type RxStateStore<T extends object> = {
  signal<K extends keyof T>(key: K): Signal<T[K]>;
};

/**
 * Creates and returns view model signals for the Wishlist feature.
 * @param store The store instance.
 * @returns An object containing Signals for the component.
 */
export const createWishlistViewModel = (
  store: RxStateStore<WishlistStateModel>,
) => {
  // Currently no state selectors needed as this store manages dialog workflows.
  // Add selectors here as state properties are added to WishlistStateModel.
  return {};
};

export type WishlistViewModel = ReturnType<typeof createWishlistViewModel>;
