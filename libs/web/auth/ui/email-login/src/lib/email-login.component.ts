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
import {
  emailLoginValidationSuite,
  EmailLoginFormModel,
} from './email-login.validation';

@Component({
  selector: 'wishare-email-login',
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
  readonly login = output<{ email: string; password: string }>();
  readonly forgotPassword = output<void>();

  private readonly model = signal<EmailLoginFormModel>({
    email: '',
    password: '',
  });

  readonly loginForm = form(
    this.model,
    (
      path: SchemaPath<EmailLoginFormModel> &
        SchemaPathTree<EmailLoginFormModel>,
    ) => {
      vestValidation(path, emailLoginValidationSuite);
    },
  );

  onLogin(event: Event): void {
    event.preventDefault();
    if (!this.loginForm().valid()) {
      return;
    }
    const { email, password } = this.loginForm().value();
    this.login.emit({ email, password });
  }

  onForgotPassword() {
    this.forgotPassword.emit();
  }
}
