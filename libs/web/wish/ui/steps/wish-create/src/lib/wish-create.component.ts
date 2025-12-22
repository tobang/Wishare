import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'wishare-wish-create',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wish-create.component.html',
  styleUrls: ['./wish-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishCreateComponent {}
