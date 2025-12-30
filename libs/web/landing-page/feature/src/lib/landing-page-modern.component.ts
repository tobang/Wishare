import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';
import { TuiButton, TuiLink } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { EmbeddedLoginComponent } from '@wishare/web/auth/feature/login';
import { scopeLoader } from 'scoped-translations';

@Component({
  selector: 'wishare-landing-page-modern',
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
  templateUrl: './landing-page-modern.component.html',
  styleUrls: ['./landing-page-modern.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageModernComponent {
  protected readonly transloco = inject(TranslocoService);
}
