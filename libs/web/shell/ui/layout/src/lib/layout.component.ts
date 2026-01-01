import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { tuiIsPresent } from '@taiga-ui/cdk';
import { AuthStore } from '@wishare/web/auth/data-access';
import { MainViewComponent } from '@wishare/web/shell/ui/main-view';
import { NavBarComponent } from '@wishare/web/shell/ui/nav-bar';
import { computed } from '@angular/core';

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

  // Use computed signals for derived state
  public readonly authenticated = computed(() =>
    tuiIsPresent(this.authStore.vm.account()),
  );
  public readonly userName = computed(
    () => this.authStore.vm.account()?.name ?? null,
  );

  logout() {
    this.authStore.actions.logout();
  }
}
