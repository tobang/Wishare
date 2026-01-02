import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TranslocoModule,
  TRANSLOCO_SCOPE,
  TranslocoService,
} from '@jsverse/transloco';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import { TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiAvatar, TuiInitialsPipe } from '@taiga-ui/kit';

import { scopeLoader } from 'scoped-translations';

@Component({
  selector: 'wishare-nav-bar',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    RouterLink,
    TuiAvatar,
    TuiInitialsPipe,
    TuiDropdown,
    TuiDataList,
    TuiActiveZone,
    TuiObscured,
    TuiIcon,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'navbar',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`),
        ),
      },
    },
  ],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBarComponent {
  private readonly transloco = inject(TranslocoService);

  // Inputs - receive data from parent
  readonly authenticated = input.required<boolean>();
  readonly userName = input<string | null>(null);

  // Outputs - emit actions to parent
  readonly logout = output<void>();
  readonly switchLanguage = output<string>();

  // Available languages with flag emojis
  readonly availableLanguages = [
    { code: 'da', name: 'Dansk', flag: '🇩🇰' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  // Local UI state (not business state)
  menuOpen = false;
  avatarMenuOpen = false;
  currentLang = signal<string>(this.transloco.getActiveLang());

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

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
      this.avatarMenuOpen = false;
      this.switchLanguage.emit(langCode);
    }
  }
}
