import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';
import {
  TuiButton,
  TuiError,
  TuiTextfieldOptionsDirective,
} from '@taiga-ui/core';
import {
  TuiFieldErrorPipe,
  TuiInput,
  TUI_VALIDATION_ERRORS,
} from '@taiga-ui/kit';
import { scopeLoader } from 'scoped-translations';

import { urlValidator } from '@wishare/web/shared/validators';

export function validationErrorsFactory(transloco: TranslocoService) {
  return {
    required: transloco.translate('wishurl.step-url.errors.required'),
    url: transloco.translate('wishurl.step-url.errors.invalid'),
  };
}
@Component({
  selector: 'wishare-url-type',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiButton,
    TuiError,
    TuiFieldErrorPipe,
    TuiInput,
    TuiTextfieldOptionsDirective,
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
    {
      provide: TUI_VALIDATION_ERRORS,
      useFactory: validationErrorsFactory,
      deps: [TranslocoService],
    },
  ],
  templateUrl: './url-type.component.html',
  styleUrls: ['./url-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlTypeComponent {
  @Output() getUrl = new EventEmitter<string>();

  frmUrl = new FormGroup({
    url: new FormControl('', [Validators.required, urlValidator]),
  });

  submitUrl() {
    this.frmUrl.markAllAsTouched();
    if (!this.frmUrl.valid) {
      return;
    }
    const { url } = this.frmUrl.value;
    this.getUrl.emit(url as string);
  }
}
