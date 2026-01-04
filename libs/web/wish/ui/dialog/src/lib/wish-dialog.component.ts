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
import { ScrapedMetadata } from '@wishare/web/shared/services';

import { UrlTypeComponent } from '@wishare/web/wish/ui/steps/url-type';
import { WishTypeComponent } from '@wishare/web/wish/ui/steps/wish-type';
import {
  WishCreateComponent,
  CreateWishFormModel,
  createWishValidationSuite,
  ImagePreview,
} from '@wishare/web/wish/ui/steps/wish-create';
import {
  WishDialogResult,
  WishDialogInput,
  CreateWishData,
} from './models/wish-dialog.model';
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
    price: '',
    quantity: '1',
  });

  // Image state managed by this smart component
  readonly images = signal<ImagePreview[]>([]);

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

  /**
   * Handles scraped metadata from URL scraping
   * Populates form fields with extracted data and navigates to final step
   */
  onMetadataReceived(metadata: ScrapedMetadata) {
    // Update form with scraped data
    this.model.update((current) => ({
      ...current,
      url: metadata.url || current.url,
      title: metadata.title || current.title,
      description: metadata.description || current.description,
      price: metadata.price || current.price,
    }));

    // If there's a scraped image, add it to the images
    if (metadata.imageEncoded) {
      this.addImageFromDataUrl(metadata.imageEncoded);
    }

    // Navigate to the final step (wish details)
    this.setActiveItemIndex(2);
  }

  /**
   * Adds an image from a base64 data URL
   */
  private addImageFromDataUrl(dataUrl: string): void {
    // Convert data URL to File for consistent handling
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const file = new File([blob], 'scraped-image.' + mimeType.split('/')[1], {
      type: mimeType,
    });

    const imagePreview: ImagePreview = {
      id: crypto.randomUUID(),
      file,
      dataUrl,
    };

    this.images.update((current) => [...current, imagePreview]);
  }

  /**
   * Handles image changes from the child component
   */
  onImagesChange(images: ImagePreview[]): void {
    this.images.set(images);
  }

  onWishSubmit() {
    if (this.wishForm().valid()) {
      const formValue = this.wishForm().value();
      const wishData: CreateWishData = {
        title: formValue.title,
        description: formValue.description || undefined,
        url: formValue.url || undefined,
        price: formValue.price ? parseFloat(formValue.price) : null,
        quantity: formValue.quantity ? parseInt(formValue.quantity, 10) : 1,
      };

      // Include image Files for upload to storage
      const imageFiles = this.images().map((img) => img.file);

      this.context.completeWith({
        wishData,
        imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
      });
    }
  }

  onWishCancel() {
    this.closeDialog();
  }
}
