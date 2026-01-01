import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { ConfirmationDialogInput } from './confirmation-dialog.model';

@Component({
  selector: 'wishare-confirmation-dialog',
  standalone: true,
  imports: [TuiButton],
  template: `
    <div class="confirmation-content">
      <p class="confirmation-message">{{ context.data.message }}</p>
      <div class="confirmation-actions">
        <button
          tuiButton
          type="button"
          appearance="secondary"
          size="m"
          (click)="cancel()"
        >
          {{ context.data.cancelText }}
        </button>
        <button
          tuiButton
          type="button"
          appearance="primary"
          size="m"
          (click)="confirm()"
        >
          {{ context.data.confirmText }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .confirmation-content {
        padding: 1rem 0;
      }

      .confirmation-message {
        margin: 0 0 1.5rem 0;
        font-size: 1rem;
        line-height: 1.5;
      }

      .confirmation-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  protected readonly context =
    inject<TuiDialogContext<boolean, ConfirmationDialogInput>>(
      POLYMORPHEUS_CONTEXT,
    );

  confirm(): void {
    this.context.completeWith(true);
  }

  cancel(): void {
    this.context.completeWith(false);
  }
}
