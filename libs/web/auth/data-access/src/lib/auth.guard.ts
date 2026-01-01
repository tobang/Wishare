import { inject, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, Observable, tap, filter, take } from 'rxjs';
import { AuthStore } from './store/auth.store';
import { AuthStateModel } from './store/auth.types';

/**
 * Guard that protects routes requiring authentication.
 * Checks the user's authentication status and redirects to login if not authenticated.
 * Uses AuthStore to access the current account state.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard {
  private injector = inject(Injector);
  private router = inject(Router);

  private get authStore() {
    return this.injector.get(AuthStore);
  }

  private _account$: Observable<AuthStateModel['account']> | undefined;

  private get account$() {
    if (!this._account$) {
      this._account$ = toObservable(this.authStore.vm.account, {
        injector: this.injector,
      });
    }
    return this._account$;
  }

  /**
   * Determines if a route can be activated based on authentication status.
   * First checks the signal directly for immediate access. If account state is undefined,
   * falls back to observable to wait for initialization.
   * Redirects to /login if user is not authenticated.
   *
   * @returns true if authenticated, false otherwise. May return an Observable if waiting for initialization.
   */
  canActivate(): Observable<boolean> | boolean {
    // First check the signal directly for immediate access
    const currentAccount = this.authStore.vm.account();
    if (currentAccount !== undefined) {
      const isLoggedIn = !!currentAccount;
      if (!isLoggedIn) {
        this.router.navigateByUrl('/login');
      }
      return isLoggedIn;
    }

    // Fall back to observable if account hasn't been initialized yet
    return this.checkLogin().pipe(
      tap((loggedIn) => {
        if (!loggedIn) {
          this.router.navigateByUrl('/login');
        }
      }),
    );
  }

  /**
   * Determines if child routes can be activated based on authentication status.
   * Delegates to canActivate() for the authentication check.
   *
   * @returns true if authenticated, false otherwise. May return an Observable if waiting for initialization.
   */
  canActivateChild(): boolean | Observable<boolean> {
    return this.canActivate();
  }

  /**
   * Determines if a module can be lazy loaded based on authentication status.
   * Uses checkLogin() to wait for account initialization before allowing the load.
   * Does not redirect to login page (unlike canActivate).
   *
   * @returns Observable that emits true if authenticated, false otherwise.
   */
  canLoad(): boolean | Observable<boolean> {
    return this.checkLogin();
  }

  /**
   * Checks if the user is logged in.
   * Waits for the account state to be initialized (not undefined)
   * before making a decision. This ensures APP_INITIALIZER has completed.
   *
   * Account states:
   * - undefined: Not yet loaded (waiting)
   * - null: Loaded but no user (not authenticated)
   * - User object: Authenticated user
   */
  checkLogin(): Observable<boolean> {
    return this.account$.pipe(
      filter((account) => account !== undefined),
      take(1),
      map((account) => !!account),
    );
  }
}
