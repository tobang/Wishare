import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  output,
  signal,
} from '@angular/core';
import {
  Field,
  SchemaPath,
  SchemaPathTree,
  form,
} from '@angular/forms/signals';

import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { TuiButton, TuiTextfield, TuiLabel, TuiIcon, TuiInput } from '@taiga-ui/core';
import { scopeLoader } from 'scoped-translations';

import { vestValidation } from '@wishare/web/shared/validators';
import { FieldErrorComponent } from '@wishare/web/shared/utils';
import { urlValidationSuite, UrlFormModel } from './url-type.validation';

@Component({
  selector: 'wishare-url-type',
  standalone: true,
  imports: [
    CommonModule,
    Field,
    TuiButton,
    FieldErrorComponent,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    TuiIcon,
    TranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'wishurl',
        loader: scopeLoader((lang: string, root: string) => {
          return import(`./i18n/${lang}.json`);
        }),
      },
    },
  ],
  templateUrl: './url-type.component.html',
  styleUrls: ['./url-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlTypeComponent {
  readonly getUrl = output<string>();

  private readonly model = signal<UrlFormModel>({
    url: '',
  });

  readonly frmUrl = form(
    this.model,
    (path: SchemaPath<UrlFormModel> & SchemaPathTree<UrlFormModel>) => {
      vestValidation(path, urlValidationSuite);
    },
  );

  submitUrl() {
    if (!this.frmUrl().valid()) {
      return;
    }
    const { url } = this.frmUrl().value();
    this.getUrl.emit(url);
  }
}
