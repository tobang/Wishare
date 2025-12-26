
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiButton } from '@taiga-ui/core';
import { scopeLoader } from 'scoped-translations';

@Component({
  selector: 'wishare-wish-type',
  standalone: true,
  imports: [TranslocoModule, TuiButton],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'wishtype',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`)
        ),
      },
    },
  ],
  templateUrl: './wish-type.component.html',
  styleUrls: ['./wish-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishTypeComponent {
  @Output() createManual = new EventEmitter<void>();
  @Output() createAutomatic = new EventEmitter<void>();

  onCreateManual() {
    this.createManual.emit();
  }

  onCreateAutomatic() {
    this.createAutomatic.emit();
  }
}
