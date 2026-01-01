import {
  ChangeDetectionStrategy,
  Component,
  output,
  signal,
} from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import {
  TuiButton,
  TuiTextfield,
  TuiLabel,
  TuiIcon,
  TuiHint,
} from '@taiga-ui/core';
import { TuiTextarea } from '@taiga-ui/kit';
import { TuiForm } from '@taiga-ui/layout';
import {
  Field,
  form,
  SchemaPath,
  SchemaPathTree,
} from '@angular/forms/signals';
import { scopeLoader } from 'scoped-translations';
import { vestValidation } from '@wishare/web/shared/validators';
import { FieldErrorComponent } from '@wishare/web/shared/utils';
import {
  CreateWishFormModel,
  createWishValidationSuite,
} from './wish-create.validation';

@Component({
  selector: 'wishare-wish-create',
  standalone: true,
  imports: [
    TranslocoModule,
    TuiButton,
    TuiTextfield,
    TuiLabel,
    TuiIcon,
    TuiHint,
    TuiTextarea,
    TuiForm,
    Field,
    FieldErrorComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'wishcreate',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`),
        ),
      },
    },
  ],
  templateUrl: './wish-create.component.html',
  styleUrls: ['./wish-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishCreateComponent {
  readonly wishCreated = output<CreateWishFormModel>();
  readonly cancelled = output<void>();

  private readonly model = signal<CreateWishFormModel>({
    title: '',
    description: '',
    url: '',
    price: 0,
    quantity: 1,
  });

  readonly wishForm = form(
    this.model,
    (
      path: SchemaPath<CreateWishFormModel> &
        SchemaPathTree<CreateWishFormModel>,
    ) => {
      vestValidation(path, createWishValidationSuite);
    },
  );

  submit() {
    if (this.wishForm().valid()) {
      this.wishCreated.emit(this.wishForm().value());
    }
  }

  cancel() {
    this.cancelled.emit();
  }
}
