import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { tuiIsPresent } from '@taiga-ui/cdk';
import { AuthStore } from '@wishare/web/auth/data-access';
import { MainViewComponent } from '@wishare/web/shell/ui/main-view';
import { NavBarComponent } from '@wishare/web/shell/ui/nav-bar';
import { computed } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AppHeaderComponent } from './header/header.component';

@Component({
  selector: 'wishare-layout',
  standalone: true,
  imports: [
    MainViewComponent,
    NavBarComponent,
    SidebarComponent,
    AppHeaderComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private readonly authStore = inject(AuthStore);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);

  // Use computed signals for derived state
  public readonly authenticated = computed(() =>
    tuiIsPresent(this.authStore.vm.account()),
  );
  public readonly userName = computed(
    () => this.authStore.vm.account()?.name ?? null,
  );

  public readonly isPublicPage = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
      map((url) => {
        // Handle root, login, and fragments/query params if necessary
        // Simple check for now as requested
        const path = url.split('?')[0].split('#')[0];
        return path === '/' || path.startsWith('/login');
      }),
    ),
    { initialValue: true },
  );

  logout() {
    this.authStore.actions.logout();
  }

  switchLanguage(langCode: string) {
    this.transloco.setActiveLang(langCode);
  }
}
