import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiButton, TuiLink } from '@taiga-ui/core';
import { TuiIsland } from '@taiga-ui/kit';
import { AuthEffects } from '@wishare/web/auth/data-access';
import { LoginComponent } from '@wishare/web/auth/feature/login';
import { scopeLoader } from 'scoped-translations';
@Component({
  selector: 'wishare-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    TuiIsland,
    TuiButton,
    TuiLink,
    LoginComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'landing',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`)
        ),
      },
    },
  ],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly authEffects = inject(AuthEffects);
  testEffect() {
    this.authEffects.ui.logout();
  }
}
