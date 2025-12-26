import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormPath,
  form,
} from '@angular/forms/signals';
import {
  TranslocoModule,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';
import {
  TuiButton,
  TuiError,
  TuiHint,
  TuiTextfield,
  TuiLabel,
  TuiIcon,
} from '@taiga-ui/core';
import {
  TuiFieldErrorPipe,
  TuiPassword,
} from '@taiga-ui/kit';
import { scopeLoader } from 'scoped-translations';

import { vestValidation } from '@wishare/web/shared/validators';
import { emailLoginValidationSuite, EmailLoginFormModel } from './email-login.validation';

@Component({
  selector: 'wishare-email-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    TuiTextfield,
    TuiLabel,
    TuiIcon,
    TuiButton,
    TuiHint,
    TuiFieldErrorPipe,
    TuiError,
    TuiPassword,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'emaillogin',
        loader: scopeLoader(
          (lang: string, root: string) => import(`./${root}/${lang}.json`),
        ),
      },
    },
  ],
  templateUrl: './email-login.component.html',
  styleUrls: ['./email-login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailLoginComponent {
  @Output() login = new EventEmitter<{ email: string; password: string }>();
  @Output() forgotPassword = new EventEmitter<void>();

  private readonly initialModel: EmailLoginFormModel = {
    email: '',
    password: '',
  };

  readonly loginForm = form(this.initialModel, (path: FormPath<EmailLoginFormModel>) => {
    vestValidation(path, emailLoginValidationSuite);
  });

  onLogin(): void {
    if (!this.loginForm.valid()) {
      return;
    }
    const { email, password } = this.loginForm.value();
    this.login.emit({ email, password });
  }

  onForgotPassword() {
    this.forgotPassword.emit();
  }
}
