import { inject, Injectable } from '@angular/core';
import { rxActions } from '@rx-angular/state/actions';
import { AuthLoginEffects, AuthSessionEffects } from './effects';

type AuthUIActions = {
  loginWithCredentials: [string, string];
  registerWithCredentials: [string, string, string];
  logout: void;
  loginWithGoogle: void;
  loginError: void;
};

/**
 * Main effects orchestrator for authentication.
 *
 * Coordinates all effect domains:
 * - Login and registration
 * - Session management
 * - OAuth authentication
 */
@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private readonly loginEffects = inject(AuthLoginEffects);
  private readonly sessionEffects = inject(AuthSessionEffects);

  readonly ui = rxActions<AuthUIActions>();

  private effectSubscriptions: unknown[] = [];

  constructor() {
    this.effectSubscriptions.push(
      this.loginEffects.register(this.ui),
      this.sessionEffects.register(this.ui)
    );
  }
}
