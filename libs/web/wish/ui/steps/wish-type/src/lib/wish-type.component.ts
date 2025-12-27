import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiButton } from '@taiga-ui/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'wishare-wish-type',
  standalone: true,
  imports: [TranslocoModule, TuiButton],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useFactory: () => {
        const http = inject(HttpClient);
        return {
          scope: 'wishtype',
          loader: {
            da: () => firstValueFrom(http.get('/assets/i18n/wishtype/da.json')),
            en: () => firstValueFrom(http.get('/assets/i18n/wishtype/en.json')),
          },
        };
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
