import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { RxState } from '@rx-angular/state';
import { RxActionFactory } from '@rx-angular/state/actions';
import { RxLet } from '@rx-angular/template/let';

import { coerceObservable, RxInputType } from '@wishare/web/shared/utils';
import { scopeLoader } from 'scoped-translations';

type Actions = {
  menuOpenToggle: boolean;
};

interface NavbarModel {
  menuOpen: boolean;
  authenticated: boolean;
}

@Component({
  selector: 'wishare-nav-bar',
  standalone: true,
  imports: [CommonModule, RxLet, TranslocoModule, RouterLink],
  providers: [
    RxState,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'navbar',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`)
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
  
  @Input()
  set authenticated(authenticated$: RxInputType<boolean>) {
    this.state.connect('authenticated', coerceObservable(authenticated$));
  }
  @Output() logout = new EventEmitter<void>();

  constructor() {
    this.state.set({ menuOpen: false });
    this.state.connect('menuOpen', this.ui.menuOpenToggle$);
  }

  onLogout() {
    this.logout.emit();
  }

  toggleMenu() {
    this.ui.menuOpenToggle(!this.state.get('menuOpen'));
  }
}
