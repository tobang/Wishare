import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import { TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiAvatar, TuiInitialsPipe } from '@taiga-ui/kit';

import { LayoutTranslationProvider } from '../layout.translation';

@Component({
  selector: 'wishare-app-header',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    TuiAvatar,
    TuiInitialsPipe,
    TuiDropdown,
    TuiDataList,
    TuiActiveZone,
    TuiObscured,
    TuiIcon,
  ],
  providers: [LayoutTranslationProvider],
  template: `
    <header class="app-header" *transloco="let t">
      <div class="header-right">
        @if (userName()) {
          <span
            (tuiActiveZoneChange)="onAvatarMenuActiveZone($event)"
            (tuiObscured)="onAvatarMenuObscured($event)"
          >
            <div
              class="user-avatar"
              size="s"
              [tuiAvatar]="userName()! | tuiInitials"
              [tuiDropdown]="avatarDropdown"
              [tuiDropdownManual]="avatarMenuOpen"
              (click)="toggleAvatarMenu()"
            ></div>
            <ng-template #avatarDropdown>
              <tui-data-list role="menu">
                @for (lang of availableLanguages; track lang.code) {
                  <button
                    tuiOption
                    new
                    type="button"
                    role="menuitem"
                    (click)="onSwitchLanguage(lang.code)"
                    [class.active-language]="currentLang() === lang.code"
                  >
                    <span class="language-flag">{{ lang.flag }}</span>
                    <span>{{ lang.name }}</span>
                    @if (currentLang() === lang.code) {
                      <tui-icon icon="@tui.check" class="language-check" />
                    }
                  </button>
                }
                <button
                  tuiOption
                  new
                  type="button"
                  role="menuitem"
                  (click)="onLogout()"
                >
                  <tui-icon icon="@tui.log-out" />
                  <span>{{ t('navbar.logout') }}</span>
                </button>
              </tui-data-list>
            </ng-template>
          </span>
        }
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeaderComponent {
  private readonly transloco = inject(TranslocoService);

  readonly userName = input<string | null>(null);
  readonly logout = output<void>();
  readonly switchLanguage = output<string>();

  readonly availableLanguages = [
    { code: 'da', name: 'Dansk', flag: '🇩🇰' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  avatarMenuOpen = false;
  currentLang = signal<string>(this.transloco.getActiveLang());

  toggleAvatarMenu() {
    this.avatarMenuOpen = !this.avatarMenuOpen;
  }

  onAvatarMenuActiveZone(active: boolean) {
    if (!active) {
      this.avatarMenuOpen = false;
    }
  }

  onAvatarMenuObscured(obscured: boolean) {
    if (obscured) {
      this.avatarMenuOpen = false;
    }
  }

  onLogout() {
    this.avatarMenuOpen = false;
    this.logout.emit();
  }

  onSwitchLanguage(langCode: string) {
    if (langCode !== this.currentLang()) {
      this.currentLang.set(langCode);
      this.switchLanguage.emit(langCode);
    }
  }
}
