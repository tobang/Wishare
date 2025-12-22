import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { LetModule } from '@rx-angular/template/let';

import { TranslocoModule } from '@ngneat/transloco';
import { TuiDialog, TuiDialogContext } from '@taiga-ui/core';
import { TuiStepper } from '@taiga-ui/kit';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

import { UrlTypeComponent } from '@wishare/web/wish/ui/steps/url-type';
import { WishTypeComponent } from '@wishare/web/wish/ui/steps/wish-type';
import { WishDialog, WishDialogInput } from './models/wish-dialog.model';
import { WishDialogAdapter } from './wish-dialog.adapter';

@Component({
  selector: 'wishare-wish-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TuiStepper,
    TuiDialog,
    TranslocoModule,
    LetModule,
    WishTypeComponent,
    UrlTypeComponent,
  ],
  providers: [WishDialogAdapter],
  templateUrl: './wish-dialog.component.html',
  styleUrls: ['./wish-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishDialogComponent {
  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<
      WishDialog | null,
      WishDialogInput
    >,
    public readonly adapter: WishDialogAdapter
  ) {}

  closeDialog() {
    this.adapter.closeDialog(this.context);
  }

  setActiveItemIndex(index: number) {
    this.adapter.updateActiveIndex(index);
  }

  createManual() {
    this.setActiveItemIndex(3);
  }

  createAutomatic() {
    this.setActiveItemIndex(1);
  }
}
