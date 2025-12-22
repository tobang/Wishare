import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { AuthState } from './auth.state';

@Injectable({ providedIn: 'root' })
export class AuthGuard  {
  private authState = inject(AuthState);
  private router = inject(Router);

  canActivate(): Observable<boolean> | boolean {
    return this.checkLogin().pipe(
      tap((loggedIn) => {
        if (!loggedIn) {
          this.router.navigateByUrl('/');
        }
      })
    );
  }

  canActivateChild(): boolean | Observable<boolean> {
    return this.canActivate();
  }

  canLoad(): boolean | Observable<boolean> {
    return this.checkLogin();
  }

  checkLogin(): Observable<boolean> {
    return this.authState.account$.pipe(map((account) => !!account));
  }
}
