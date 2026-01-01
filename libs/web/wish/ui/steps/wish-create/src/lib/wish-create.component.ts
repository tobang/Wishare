import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import {
  TuiButton,
  TuiTextfield,
  TuiLabel,
  TuiIcon,
  TuiInput,
} from '@taiga-ui/core';
import { TuiTextarea, TuiTooltip } from '@taiga-ui/kit';
import { TuiForm } from '@taiga-ui/layout';
import { Field, form } from '@angular/forms/signals';
import { scopeLoader } from 'scoped-translations';
import { FieldErrorComponent } from '@wishare/web/shared/utils';
import { CreateWishFormModel } from './wish-create.validation';

@Component({
  selector: 'wishare-wish-create',
  standalone: true,
  imports: [
    TranslocoModule,
    TuiButton,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    TuiIcon,
    TuiTooltip,
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
  // Inputs - receive form from parent
  readonly wishForm =
    input.required<ReturnType<typeof form<CreateWishFormModel>>>();

  // Outputs - emit actions to parent
  readonly submit = output<void>();
  readonly cancel = output<void>();

  // Getter for form validation state
  get isValid(): boolean {
    // wishForm() is the input signal value (FieldTree)
    // wishForm()() calls the FieldTree to get FieldState
    // .valid is a signal on FieldState that needs to be called
    return this.wishForm()().valid();
  }

  onSubmit() {
    this.submit.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
