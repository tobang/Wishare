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
import {
  TuiButton,
  TuiTextfield,
  TuiInput,
  TuiLabel,
  TuiIcon,
} from '@taiga-ui/core';
import { TuiPassword, TuiTooltip } from '@taiga-ui/kit';
import { scopeLoader } from 'scoped-translations';

import { vestValidation } from '@wishare/web/shared/validators';
import { FieldErrorComponent } from '@wishare/web/shared/utils';
import { signupValidationSuite, SignupFormModel } from './signup.validation';

@Component({
  selector: 'wishare-signup',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    Field,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    TuiIcon,
    TuiButton,
    TuiTooltip,
    FieldErrorComponent,
    TuiPassword,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'signup',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`),
        ),
      },
    },
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent {
  readonly signUp = output<{ email: string; password: string }>();

  private readonly model = signal<SignupFormModel>({
    email: '',
    password: '',
    passwordConfirm: '',
  });

  readonly signUpForm = form(
    this.model,
    (path: SchemaPath<SignupFormModel> & SchemaPathTree<SignupFormModel>) => {
      vestValidation(path, signupValidationSuite);
    },
  );

  signup(event: Event): void {
    event.preventDefault();
    if (!this.signUpForm().valid()) {
      return;
    }
    const { email, password } = this.signUpForm().value();
    this.signUp.emit({ email, password });
  }
}
