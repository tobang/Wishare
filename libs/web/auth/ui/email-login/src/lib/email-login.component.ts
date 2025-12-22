import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
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
  TuiHint,
  TuiTextfieldOptionsDirective,
} from '@taiga-ui/core';
import {
  TuiFieldErrorPipe,
  TuiInput,
  TuiInputPassword,
  TUI_VALIDATION_ERRORS,
} from '@taiga-ui/kit';
import { scopeLoader } from 'scoped-translations';

export function validationErrorsFactory(transloco: TranslocoService) {
  return {
    required: transloco.translate('emaillogin.form.required'),
    email: transloco.translate('emaillogin.form.email-error'),
  };
}

@Component({
  selector: 'wishare-email-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
        scope: 'emaillogin',
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
  templateUrl: './email-login.component.html',
  styleUrls: ['./email-login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailLoginComponent {
  @Output() login = new EventEmitter<{ email: string; password: string }>();
  @Output() forgotPassword = new EventEmitter<void>();

  private readonly fb: FormBuilder = inject(FormBuilder);

  readonly loginForm = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', Validators.required),
  });

  onLogin(): void {
    this.loginForm.markAllAsTouched();
    if (!this.loginForm.valid) {
      return;
    }
    const { email, password } = this.loginForm.value;
    this.login.emit({ email: email as string, password: password as string });
  }

  onForgotPassword() {
    this.forgotPassword.emit();
  }
}
