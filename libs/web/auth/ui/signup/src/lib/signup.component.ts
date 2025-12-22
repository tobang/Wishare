import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';
import {
  TuiButton,
  TuiError,
  TuiHint,
  TuiTextfieldOptionsDirective,
} from '@taiga-ui/core';
import {
  TuiFieldErrorPipe,
  TuiInput,
  TuiInputPassword,
  TUI_VALIDATION_ERRORS,
} from '@taiga-ui/kit';
import { passwordMatchValidator } from '@wishare/web/auth/utils';
import { scopeLoader } from 'scoped-translations';

export function validationErrorsFactory(transloco: TranslocoService) {
  return {
    required: transloco.translate('signup.form.required'),
    email: transloco.translate('signup.form.email-error'),
    minlength: transloco.translate('signup.form.password-error'),
    passwordmatch: transloco.translate('signup.form.password-confirm-error'),
  };
}

@Component({
  selector: 'wishare-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    TuiInput,
    TuiTextfieldOptionsDirective,
    TuiButton,
    TuiHint,
    TuiFieldErrorPipe,
    TuiError,
    TuiInputPassword,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'signup',
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
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent {
  @Output() signUp = new EventEmitter<{ email: string; password: string }>();

  private readonly fb: FormBuilder = inject(FormBuilder);
  readonly signUpForm = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    passwordConfirm: this.fb.control('', [
      Validators.required,
      passwordMatchValidator,
    ]),
  });

  signup(): void {
    this.signUpForm.markAllAsTouched();
    if (!this.signUpForm.valid) {
      return;
    }
    const { email, password } = this.signUpForm.value;
    this.signUp.emit({ email: email as string, password: password as string });
  }
}
