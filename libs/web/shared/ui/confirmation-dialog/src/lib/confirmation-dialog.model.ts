/**
 * Input data for the confirmation dialog
 */
export interface ConfirmationDialogInput {
  /** The title of the dialog */
  title: string;
  /** The message to display */
  message: string;
  /** Text for the confirm button (e.g., "Delete", "Yes") */
  confirmText: string;
  /** Text for the cancel button (e.g., "Cancel", "No") */
  cancelText: string;
}
