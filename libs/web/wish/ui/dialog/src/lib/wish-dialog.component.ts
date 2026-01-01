import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import { TranslocoModule } from '@jsverse/transloco';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiConnected, TuiStepper } from '@taiga-ui/kit';
import { form, SchemaPath, SchemaPathTree } from '@angular/forms/signals';
import { vestValidation } from '@wishare/web/shared/validators';

import { UrlTypeComponent } from '@wishare/web/wish/ui/steps/url-type';
import { WishTypeComponent } from '@wishare/web/wish/ui/steps/wish-type';
import {
  WishCreateComponent,
  CreateWishFormModel,
  createWishValidationSuite,
} from '@wishare/web/wish/ui/steps/wish-create';
import { WishDialogResult, WishDialogInput } from './models/wish-dialog.model';
import { WishDialogStore } from './store/wish-dialog.store';

@Component({
  selector: 'wishare-wish-dialog',
  standalone: true,
  imports: [
    TranslocoModule,
    WishTypeComponent,
    UrlTypeComponent,
    WishCreateComponent,
    TuiStepper,
    TuiConnected,
  ],
  providers: [WishDialogStore],
  templateUrl: './wish-dialog.component.html',
  styleUrls: ['./wish-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishDialogComponent {
  private readonly context =
    inject<TuiDialogContext<WishDialogResult | null, WishDialogInput>>(
      POLYMORPHEUS_CONTEXT,
    );
  public readonly adapter = inject(WishDialogStore);

  // Form state managed by this smart component
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

  closeDialog() {
    this.adapter.closeDialog(this.context);
  }

  setActiveItemIndex(index: number) {
    this.adapter.updateActiveIndex(index);
  }

  createManual() {
    this.setActiveItemIndex(2);
  }

  createAutomatic() {
    this.setActiveItemIndex(1);
  }

  onUrlSubmit(url: string) {
    // Pre-fill the URL in the form when automatic mode is used
    this.model.update((current) => ({ ...current, url }));
    this.setActiveItemIndex(2);
  }

  onWishSubmit() {
    if (this.wishForm().valid()) {
      const wishData = this.wishForm().value();
      this.context.completeWith({ wishData });
    }
  }

  onWishCancel() {
    this.closeDialog();
  }
}
