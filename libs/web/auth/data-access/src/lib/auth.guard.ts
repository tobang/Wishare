import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, Observable, tap, filter, take } from 'rxjs';
import { AuthStore } from './store/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private readonly account$ = toObservable(this.authStore.vm.account);

  canActivate(): Observable<boolean> | boolean {
    return this.checkLogin().pipe(
      tap((loggedIn) => {
        if (!loggedIn) {
          this.router.navigateByUrl('/login');
        }
      }),
    );
  }

  canActivateChild(): boolean | Observable<boolean> {
    return this.canActivate();
  }

  canLoad(): boolean | Observable<boolean> {
    return this.checkLogin();
  }

  checkLogin(): Observable<boolean> {
    // Wait for the account state to be initialized (not undefined)
    // This ensures APP_INITIALIZER has completed before deciding
    return this.account$.pipe(
      filter((account) => account !== undefined),
      take(1),
      map((account) => !!account),
    );
  }
}
