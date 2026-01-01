import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { scopeLoader } from 'scoped-translations';
import {
  Field,
  SchemaPath,
  SchemaPathTree,
  form,
} from '@angular/forms/signals';
import { TuiButton, TuiTextfield, TuiInput, TuiLabel } from '@taiga-ui/core';
import { TuiTextarea } from '@taiga-ui/kit';
import { TuiForm } from '@taiga-ui/layout';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';

import { vestValidation } from '@wishare/web/shared/validators';
import { FieldErrorComponent } from '@wishare/web/shared/utils';
import {
  CreateWishlistFormModel,
  createWishlistValidationSuite,
} from './create-wishlist.validation';

export type CreateWishlistDialogResult = {
  title: string;
  description: string;
};

export type CreateWishlistDialogInput = {
  title?: string;
  description?: string;
  editMode?: boolean;
};

@Component({
  selector: 'wishare-create-wishlist-dialog',
  standalone: true,
  imports: [
    Field,
    TuiButton,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    TuiTextarea,
    TuiForm,
    FieldErrorComponent,
    TranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'board',
        loader: scopeLoader((lang: string) => import(`../i18n/${lang}.json`)),
      },
    },
  ],
  templateUrl: './create-wishlist-dialog.component.html',
  styleUrls: ['./create-wishlist-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateWishlistDialogComponent {
  private readonly context =
    inject<
      TuiDialogContext<
        CreateWishlistDialogResult | null,
        CreateWishlistDialogInput
      >
    >(POLYMORPHEUS_CONTEXT);

  protected readonly editMode = this.context.data?.editMode ?? false;

  private readonly model = signal<CreateWishlistFormModel>({
    title: this.context.data?.title ?? '',
    description: this.context.data?.description ?? '',
  });

  protected readonly wishlistForm = form(
    this.model,
    (
      path: SchemaPath<CreateWishlistFormModel> &
        SchemaPathTree<CreateWishlistFormModel>,
    ) => {
      vestValidation(path, createWishlistValidationSuite);
    },
  );

  protected cancel(): void {
    this.context.completeWith(null);
  }

  protected submit(): void {
    if (!this.wishlistForm().valid()) {
      return;
    }
    const { title, description } = this.wishlistForm().value();
    this.context.completeWith({
      title,
      description,
    });
  }
}
