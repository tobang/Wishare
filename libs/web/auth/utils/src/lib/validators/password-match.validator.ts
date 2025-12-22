import { AbstractControl, Validators } from '@angular/forms';

export function passwordMatchValidator(
  control: AbstractControl
): Validators | null {
  const password = control.parent?.get('password')?.value;
  if (password === control.value) {
    return null;
  }

  return { passwordmatch: true };
}
