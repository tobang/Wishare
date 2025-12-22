import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'wishare-wish-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wish-spinner.component.html',
  styleUrls: ['./wish-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishSpinnerComponent {}
