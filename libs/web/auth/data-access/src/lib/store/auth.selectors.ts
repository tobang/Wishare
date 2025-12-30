import { Signal } from '@angular/core';
import { AuthStateModel } from './auth.types';

/**
 * Interface for the store object used in view model creation.
 * Matches the shape returned by rxState() from @rx-angular/state.
 */
type RxStateStore<T extends object> = {
  signal<K extends keyof T>(key: K): Signal<T[K]>;
};

/**
 * Creates and returns view model signals for the Auth feature.
 * @param store The store instance.
 * @returns An object containing Signals for the component.
 */
export const createAuthViewModel = (store: RxStateStore<AuthStateModel>) => {
  const account: Signal<AuthStateModel['account']> = store.signal('account');

  return {
    account,
  };
};

export type AuthViewModel = ReturnType<typeof createAuthViewModel>;
