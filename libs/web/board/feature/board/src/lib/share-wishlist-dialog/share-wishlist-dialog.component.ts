import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { scopeLoader } from 'scoped-translations';
import { TuiButton, TuiTextfield, TuiInput } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';

export type ShareWishlistDialogInput = {
  wishlistId: string;
};

@Component({
  selector: 'wishare-share-wishlist-dialog',
  standalone: true,
  imports: [TuiButton, TuiTextfield, TuiInput, TranslocoModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'board',
        loader: scopeLoader((lang: string) => import(`../i18n/${lang}.json`)),
      },
    },
  ],
  templateUrl: './share-wishlist-dialog.component.html',
  styleUrls: ['./share-wishlist-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareWishlistDialogComponent {
  private readonly context =
    inject<TuiDialogContext<void, ShareWishlistDialogInput>>(
      POLYMORPHEUS_CONTEXT,
    );

  protected readonly copied = signal(false);

  protected readonly shareableLink = `${location.origin}/share/wishlist/${this.context.data.wishlistId}`;

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareableLink);
      this.copied.set(true);

      // Reset copied state after 2 seconds
      setTimeout(() => this.copied.set(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  close(): void {
    this.context.completeWith();
  }
}
