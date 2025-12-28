import { computed, Signal } from '@angular/core';
import { AuthStateModel, LoginResult } from './auth.types';
import { StreamState } from '@wishare/web/shared/utils';

/**
 * Interface for the store object used in view model creation.
 * Matches the shape returned by rxState() from @rx-angular/state.
 */
interface RxStateStore<T extends object> {
  signal<K extends keyof T>(key: K): Signal<T[K]>;
}

/**
 * Creates and returns view model signals for the Auth feature.
 * @param store The store instance.
 * @returns An object containing Signals for the component.
 */
export const createAuthViewModel = (store: RxStateStore<AuthStateModel>) => {
  const session: Signal<AuthStateModel['session']> = store.signal('session');
  const account: Signal<AuthStateModel['account']> = store.signal('account');
  const loginState: Signal<StreamState<LoginResult>> =
    store.signal('loginState');
  const registerState: Signal<StreamState<LoginResult>> =
    store.signal('registerState');
  const logoutState: Signal<StreamState<void>> = store.signal('logoutState');

  const preferences = computed(() => {
    const acc = account();
    return acc ? acc.prefs : {};
  });

  /**
   * Whether the user has been authenticated (account loaded, regardless of guest status).
   * Returns false while account is still loading (undefined).
   */
  const isAuthenticated = computed(() => {
    const acc = account();
    return acc !== null && acc !== undefined;
  });

  /**
   * Whether the user is logged in as a real user (not a guest).
   * Returns true only when authenticated AND not a guest.
   */
  const isLoggedIn = computed(() => {
    return isAuthenticated();
  });

  const isLoading = computed(() => {
    return (
      loginState().isLoading ||
      registerState().isLoading ||
      logoutState().isLoading
    );
  });

  const hasError = computed(() => {
    return (
      loginState().hasError ||
      registerState().hasError ||
      logoutState().hasError
    );
  });

  /**
   * Returns the first error encountered from any auth operation.
   * Returns null if no errors are present.
   */
  const error = computed(() => {
    if (loginState().hasError) return loginState().error;
    if (registerState().hasError) return registerState().error;
    if (logoutState().hasError) return logoutState().error;
    return null;
  });

  return {
    session,
    account,
    preferences,
    isAuthenticated,
    isLoggedIn,
    loginState,
    registerState,
    logoutState,
    isLoading,
    hasError,
    error,
  };
};

export type AuthViewModel = ReturnType<typeof createAuthViewModel>;
