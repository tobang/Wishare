import { ChangeDetectionStrategy, Component } from '@angular/core';


@Component({
  selector: 'wishare-wish-spinner',
  standalone: true,
  imports: [],
  templateUrl: './wish-spinner.component.html',
  styleUrls: ['./wish-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishSpinnerComponent {}
