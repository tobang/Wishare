import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';

/**
 * A simple error component for Angular Signal Forms.
 * Displays the first error message when the field is invalid and touched.
 *
 * @example
 * ```html
 * <wishare-field-error [field]="loginForm.email" />
 * ```
 */
@Component({
  selector: 'wishare-field-error',
  standalone: true,
  template: `
    @if (showError()) {
      <div class="field-error" role="alert">
        <span class="error-message">{{ errorMessage() }}</span>
      </div>
    }
  `,
  styles: `
    .field-error {
      color: var(--tui-status-negative);
      font-size: 0.75rem;
      animation: fadeIn 0.2s ease-in-out;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldErrorComponent {
  /**
   * The field from a signal form to display errors for.
   * Can be either a FieldTree (callable) or FieldState.
   */
  readonly field = input.required<FieldTree<unknown> | FieldState<unknown>>();

  /**
   * Whether to show error only when the field has been touched.
   * Defaults to true.
   */
  readonly showOnlyWhenTouched = input<boolean>(true);

  protected readonly fieldState = computed(() => {
    const f = this.field();
    // FieldTree is a function that returns FieldState
    return typeof f === 'function' ? f() : f;
  });

  protected readonly showError = computed(() => {
    const state = this.fieldState();
    if (!state) return false;

    const hasErrors = state.errors().length > 0;
    const shouldShow = this.showOnlyWhenTouched()
      ? state.touched() && hasErrors
      : hasErrors;

    return shouldShow;
  });

  protected readonly errorMessage = computed(() => {
    const state = this.fieldState();
    if (!state) return '';

    const errors = state.errors();
    if (errors.length === 0) return '';

    // Return the first error message
    const firstError = errors[0];
    return firstError.message ?? firstError.kind;
  });
}
