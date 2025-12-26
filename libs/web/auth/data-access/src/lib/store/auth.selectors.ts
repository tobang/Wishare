import { computed, Signal } from '@angular/core';
import { AuthStateModel } from './auth.types';

/**
 * Creates and returns view model signals for the Auth feature.
 * @param store The store instance.
 * @returns An object containing Signals for the component.
 */
export const createAuthViewModel = (store: any) => {
  const session: Signal<AuthStateModel['session']> = store.signal('session');
  const account: Signal<AuthStateModel['account']> = store.signal('account');

  const preferences = computed(() => {
    const acc = account();
    return acc ? acc.prefs : {};
  });

  const isGuest = computed(() => {
    const prefs = preferences();
    return Object.prototype.hasOwnProperty.call(prefs, 'guest') &&
      prefs.guest === true;
  });

  return {
    session,
    account,
    preferences,
    isGuest
  };
};

export type AuthViewModel = ReturnType<typeof createAuthViewModel>;
