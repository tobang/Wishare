import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TranslocoModule } from '@ngneat/transloco';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';

import { UrlTypeComponent } from '@wishare/web/wish/ui/steps/url-type';
import { WishTypeComponent } from '@wishare/web/wish/ui/steps/wish-type';
import {
  WishCreateComponent,
  CreateWishFormModel,
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

  closeDialog() {
    this.adapter.closeDialog(this.context);
  }

  setActiveItemIndex(index: number) {
    this.adapter.updateActiveIndex(index);
  }

  createManual() {
    this.setActiveItemIndex(3);
  }

  createAutomatic() {
    this.setActiveItemIndex(1);
  }

  onUrlSubmit(url: string) {
    // TODO: Implement URL fetching logic
    // For now, just move to the create step with the URL pre-filled
    this.setActiveItemIndex(3);
  }

  onWishCreated(result: CreateWishFormModel) {
    const wishData = {
      title: result.title,
      description: result.description,
      url: result.url,
      price: result.price,
      quantity: result.quantity,
    };
    this.context.completeWith({ wishData });
  }
}
