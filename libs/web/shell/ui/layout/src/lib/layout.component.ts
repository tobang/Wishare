
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { tuiIsPresent } from '@taiga-ui/cdk';
import { AuthEffects, AuthStore } from '@wishare/web/auth/data-access';
import { MainViewComponent } from '@wishare/web/shell/ui/main-view';
import { NavBarComponent } from '@wishare/web/shell/ui/nav-bar';
@Component({
  selector: 'wishare-layout',
  standalone: true,
  imports: [MainViewComponent, NavBarComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private readonly authStore = inject(AuthStore);
  private readonly AuthEffects = inject(AuthEffects);
  public readonly authenticated$ = toObservable(this.authStore.vm.account).pipe(
    map(tuiIsPresent)
  );

  logout() {
    this.AuthEffects.ui.logout();
  }
}
