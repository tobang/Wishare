import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { ReactiveFormsModule, FormPath, form } from '@angular/forms/signals';

import {
  TranslocoModule,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';
import {
  TuiButton,
  TuiError,
} from '@taiga-ui/core';
import {
  TuiFieldErrorPipe,
} from '@taiga-ui/kit';
import {
  TuiInputModule,
} from '@taiga-ui/legacy';
import { scopeLoader } from 'scoped-translations';

import { vestValidation } from '@wishare/web/shared/validators';
import { urlValidationSuite, UrlFormModel } from './url-type.validation';

@Component({
  selector: 'wishare-url-type',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiButton,
    TuiError,
    TuiFieldErrorPipe,
    TuiInputModule,
    TranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'wishurl',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`)
        ),
      },
    },
  ],
  templateUrl: './url-type.component.html',
  styleUrls: ['./url-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlTypeComponent {
  @Output() getUrl = new EventEmitter<string>();

  private readonly initialModel: UrlFormModel = {
    url: '',
  };

  readonly frmUrl = form(this.initialModel, (path: FormPath<UrlFormModel>) => {
    vestValidation(path, urlValidationSuite);
  });

  submitUrl() {
    if (!this.frmUrl.valid()) {
      return;
    }
    const { url } = this.frmUrl.value();
    this.getUrl.emit(url);
  }
}
