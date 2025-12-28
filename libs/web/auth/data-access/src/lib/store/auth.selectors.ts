import { computed, Signal } from '@angular/core';
import { AuthStateModel, LoginResult } from './auth.types';
import { StreamState } from '@wishare/web/shared/utils';

/**
 * Creates and returns view model signals for the Auth feature.
 * @param store The store instance.
 * @returns An object containing Signals for the component.
 */
export const createAuthViewModel = (store: any) => {
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

  const isGuest = computed(() => {
    const prefs = preferences();
    return (
      Object.prototype.hasOwnProperty.call(prefs, 'guest') &&
      prefs.guest === true
    );
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

  return {
    session,
    account,
    preferences,
    isGuest,
    loginState,
    registerState,
    logoutState,
    isLoading,
    hasError,
  };
};

export type AuthViewModel = ReturnType<typeof createAuthViewModel>;
