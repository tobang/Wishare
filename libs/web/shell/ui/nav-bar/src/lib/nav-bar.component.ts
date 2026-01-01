import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { RxState } from '@rx-angular/state';
import { RxActionFactory } from '@rx-angular/state/actions';
import { RxLet } from '@rx-angular/template/let';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import { TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiAvatar, TuiInitialsPipe } from '@taiga-ui/kit';
import { switchMap } from 'rxjs';

import { coerceObservable, RxInputType } from '@wishare/web/shared/utils';
import { scopeLoader } from 'scoped-translations';

type Actions = {
  menuOpenToggle: boolean;
};

type NavbarModel = {
  menuOpen: boolean;
  authenticated: boolean;
  userName: string | null;
};

@Component({
  selector: 'wishare-nav-bar',
  standalone: true,
  imports: [
    CommonModule,
    RxLet,
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
    RxState,
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
  private state = inject(RxState<NavbarModel>);
  private actionsFactory = inject(RxActionFactory<Actions>);

  readonly ui = this.actionsFactory.create();
  readonly vm$ = this.state.select();
  readonly authenticated = input.required<RxInputType<boolean>>();
  readonly userName = input<RxInputType<string | null>>(null);
  readonly logout = output<void>();
  readonly switchLanguage = output<void>();

  avatarMenuOpen = false;

  constructor() {
    this.state.set({ menuOpen: false, userName: null });
    this.state.connect('menuOpen', this.ui.menuOpenToggle$);
    this.state.connect(
      'authenticated',
      toObservable(this.authenticated).pipe(
        switchMap((value) => coerceObservable(value)),
      ),
    );
    this.state.connect(
      'userName',
      toObservable(this.userName).pipe(
        switchMap((value) => coerceObservable(value)),
      ),
    );
  }

  onLogout() {
    this.avatarMenuOpen = false;
    this.logout.emit();
  }

  onSwitchLanguage() {
    this.avatarMenuOpen = false;
    this.switchLanguage.emit();
  }

  toggleAvatarMenu() {
    this.avatarMenuOpen = !this.avatarMenuOpen;
  }

  onAvatarMenuObscured(obscured: boolean) {
    if (obscured) {
      this.avatarMenuOpen = false;
    }
  }

  onAvatarMenuActiveZone(active: boolean) {
    this.avatarMenuOpen = active && this.avatarMenuOpen;
  }

  toggleMenu() {
    this.ui.menuOpenToggle(!this.state.get('menuOpen'));
  }
}
