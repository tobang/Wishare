import { AbstractControl, Validators } from '@angular/forms';

const urlReg =
  /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

export function urlValidator(field: AbstractControl): Validators | null {
  return field.value && urlReg.test(field.value)
    ? null
    : {
        url: field.value,
      };
}
