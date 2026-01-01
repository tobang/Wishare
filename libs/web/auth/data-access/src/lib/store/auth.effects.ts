import {
  inject,
  Injectable,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { Router } from '@angular/router';
import { RxActions } from '@rx-angular/state/actions';
import { rxEffects } from '@rx-angular/state/effects';

import { TranslocoService } from '@jsverse/transloco';
import { TuiAlertService } from '@taiga-ui/core';
import { APPWRITE } from '@wishare/web/shared/app-config';

import {
  catchError,
  EMPTY,
  from,
  map,
  Observable,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { Account, ID, Models, OAuthProvider, TablesDB } from 'appwrite';
import { StreamState, toState } from '@wishare/web/shared/utils';

import { AuthActions, LoginResult } from './auth.types';

/**
 * Maps an Appwrite account to a LoginResult
 */
const mapAccountToLoginResult = (
  account: Models.User<Models.Preferences>,
): LoginResult => ({
  account: account as Models.User<{ guest?: boolean }>,
});

/**
 * Effects for authentication actions.
 *
 * Handles:
 * - Login with credentials
 * - Registration with credentials
 * - Logout
 * - OAuth login
 * - Error handling and navigation
 */
@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private readonly injector = inject(Injector);
  private readonly appwrite: { tablesDb: TablesDB; account: Account } =
    inject(APPWRITE);

  // TuiAlertService and TranslocoService are injected lazily because
  // AuthEffects is instantiated during APP_INITIALIZER before TuiRoot is available
  private _alertService: TuiAlertService<unknown> | null = null;
  private get alertService(): TuiAlertService<unknown> {
    if (!this._alertService) {
      this._alertService = this.injector.get(TuiAlertService);
    }
    return this._alertService;
  }

  private _transloco: TranslocoService | null = null;
  private get transloco(): TranslocoService {
    if (!this._transloco) {
      this._transloco = this.injector.get(TranslocoService);
    }
    return this._transloco;
  }

  // Router is injected lazily to avoid circular dependency:
  // Router -> LayoutComponent -> AuthStore -> AuthEffects -> Router
  private _router: Router | null = null;
  private get router(): Router {
    if (!this._router) {
      this._router = this.injector.get(Router);
    }
    return this._router;
  }

  // State streams - initialized lazily when register() is called
  private _loginState$!: Observable<StreamState<LoginResult>>;
  private _registerState$!: Observable<StreamState<LoginResult>>;
  private _logoutState$!: Observable<StreamState<void>>;

  get loginState$(): Observable<StreamState<LoginResult>> {
    return this._loginState$;
  }

  get registerState$(): Observable<StreamState<LoginResult>> {
    return this._registerState$;
  }

  get logoutState$(): Observable<StreamState<void>> {
    return this._logoutState$;
  }

  /**
   * Register effects with the store's actions.
   * This method is called by the store during initialization.
   */
  register(actions: RxActions<AuthActions, object>) {
    // Create shared observables for state streams
    this._loginState$ = actions.loginWithCredentials$.pipe(
      switchMap(({ email, password }) =>
        from(
          this.appwrite.account.createEmailPasswordSession({
            email,
            password,
          }),
        ).pipe(
          switchMap(() => this.appwrite.account.get()),
          map(mapAccountToLoginResult),
        ),
      ),
      toState(),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this._registerState$ = actions.registerWithCredentials$.pipe(
      switchMap(({ email, name, password }) =>
        from(
          this.appwrite.account.create({
            userId: ID.unique(),
            email,
            password,
            name: name ?? undefined,
          }),
        ).pipe(
          switchMap(() =>
            this.appwrite.account.createEmailPasswordSession({
              email,
              password,
            }),
          ),
          switchMap(() => this.appwrite.account.get()),
          map(mapAccountToLoginResult),
        ),
      ),
      toState(),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this._logoutState$ = actions.logout$.pipe(
      switchMap(() =>
        from(
          this.appwrite.account.deleteSession({ sessionId: 'current' }),
        ).pipe(
          map(() => undefined as void),
          catchError((error) => {
            console.error('Logout session deletion error:', error);
            // Continue with local cleanup even if server logout fails
            return EMPTY;
          }),
        ),
      ),
      toState(),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    // Pass injector to rxEffects to provide injection context
    // This is needed because register() is called during field initialization
    // runInInjectionContext ensures rxEffects gets DestroyRef from AuthEffects' context
    // rather than from the calling component's context, avoiding circular dependency
    runInInjectionContext(this.injector, () => {
      rxEffects(({ register }) => {
        // Handle login success/error side effects
        register(this._loginState$, (state) => {
          if (state.hasError) {
            actions.loginError();
          } else if (state.hasValue && state.value?.account) {
            // Update account in store before navigating to ensure auth guard has access
            actions.setAccount(state.value.account);
            this.router.navigate(['/wishlists']);
          }
        });

        // Handle register success/error side effects
        register(this._registerState$, (state) => {
          if (state.hasError) {
            console.error('Registration error:', state.error);
          } else if (state.hasValue && state.value?.account) {
            // Update account in store before navigating to ensure auth guard has access
            actions.setAccount(state.value.account);
            this.router.navigate(['/wishlists']);
          }
        });

        // Handle logout side effects
        register(this._logoutState$, (state) => {
          if (state.hasValue) {
            localStorage.clear();
            sessionStorage.clear();
            this.router.navigate(['/login']);
          }
        });

        register(
          actions.loginError$.pipe(
            switchMap(() =>
              this.transloco.selectTranslate(
                'server-error.invalid-credentials',
                {},
                'login',
              ),
            ),
            switchMap((trans: string) =>
              this.alertService.open(trans).pipe(
                catchError((error) => {
                  console.error('Alert service error:', error);
                  return EMPTY;
                }),
              ),
            ),
          ),
        );

        // Note: OAuth redirects the browser away, so this stream won't complete normally.
        // The success/failure URLs handle the redirect back to the app.
        register(
          actions.loginWithGoogle$.pipe(
            tap(() =>
              this.appwrite.account.createOAuth2Session({
                provider: OAuthProvider.Google,
                success: location.origin,
                failure: `${location.origin}/login`,
              }),
            ),
          ),
        );
      });
    });
  }
}
