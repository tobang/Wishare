import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { TuiNavigation } from '@taiga-ui/layout';
import { TuiIcon } from '@taiga-ui/core';
import { LayoutTranslationProvider } from '../layout.translation';

@Component({
  selector: 'wishare-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TuiIcon, TranslocoModule],
  providers: [LayoutTranslationProvider],
  template: `
    <aside class="sidebar">
      <header class="sidebar-header">
        <a routerLink="/" class="logo-link">
          <img
            src="assets/images/ws_logo_white.svg"
            alt="Wishare Logo"
            class="logo"
          />
        </a>
      </header>

      <div class="menu-items">
        <a
          routerLink="/"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="menu-item"
        >
          <tui-icon icon="@tui.home" />
          <span>{{ 'navbar.homepage' | transloco }}</span>
        </a>

        <a routerLink="/wishlists" routerLinkActive="active" class="menu-item">
          <tui-icon icon="@tui.heart" />
          <span>{{ 'navbar.wishlists' | transloco }}</span>
        </a>
      </div>
    </aside>
  `,
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {}
