import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@jsverse/transloco';
import { TuiButton, TuiLink } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { AuthStore } from '@wishare/web/auth/data-access';
import { EmbeddedLoginComponent } from '@wishare/web/auth/feature/login';
import { scopeLoader } from 'scoped-translations';
@Component({
  selector: 'wishare-landing-page',
  standalone: true,
  imports: [
    TranslocoModule,
    TuiCardLarge,
    TuiButton,
    TuiLink,
    EmbeddedLoginComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'landing',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`),
        ),
      },
    },
  ],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly authStore = inject(AuthStore);
  protected readonly transloco = inject(TranslocoService);

  testEffect() {
    this.authStore.actions.logout();
  }
}
