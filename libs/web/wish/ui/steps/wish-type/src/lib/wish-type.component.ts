import {
  ChangeDetectionStrategy,
  Component,
  output,
  inject,
} from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiIcon } from '@taiga-ui/core';
import { scopeLoader } from 'scoped-translations';

@Component({
  selector: 'wishare-wish-type',
  standalone: true,
  imports: [TranslocoModule, TuiIcon],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'wishtype',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`),
        ),
      },
    },
  ],
  templateUrl: './wish-type.component.html',
  styleUrls: ['./wish-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishTypeComponent {
  readonly createManual = output<void>();
  readonly createAutomatic = output<void>();

  onCreateManual() {
    this.createManual.emit();
  }

  onCreateAutomatic() {
    this.createAutomatic.emit();
  }
}
