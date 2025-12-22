import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { map } from 'rxjs';

import { tuiIsPresent } from '@taiga-ui/cdk';
import { AuthEffects, AuthState } from '@wishare/web/auth/data-access';
import { MainViewComponent } from '@wishare/web/shell/ui/main-view';
import { NavBarComponent } from '@wishare/web/shell/ui/nav-bar';
@Component({
  selector: 'wishare-layout',
  standalone: true,
  imports: [CommonModule, MainViewComponent, NavBarComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private readonly authState = inject(AuthState);
  private readonly AuthEffects = inject(AuthEffects);
  public readonly authenticated$ = this.authState.account$.pipe(
    map(tuiIsPresent)
  );

  logout() {
    this.AuthEffects.ui.logout();
  }
}
