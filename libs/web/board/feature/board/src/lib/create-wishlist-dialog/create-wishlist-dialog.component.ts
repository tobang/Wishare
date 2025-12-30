import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  Field,
  SchemaPath,
  SchemaPathTree,
  form,
} from '@angular/forms/signals';
import { TuiButton, TuiTextfield, TuiLabel } from '@taiga-ui/core';
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

@Component({
  selector: 'wishare-create-wishlist-dialog',
  standalone: true,
  imports: [
    Field,
    TuiButton,
    TuiTextfield,
    TuiLabel,
    TuiTextarea,
    TuiForm,
    FieldErrorComponent,
  ],
  templateUrl: './create-wishlist-dialog.component.html',
  styleUrls: ['./create-wishlist-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateWishlistDialogComponent {
  private readonly context =
    inject<TuiDialogContext<CreateWishlistDialogResult | null>>(
      POLYMORPHEUS_CONTEXT,
    );

  private readonly model = signal<CreateWishlistFormModel>({
    title: '',
    description: '',
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
