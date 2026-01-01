import { TuiRoot } from '@taiga-ui/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-wishare-root',
  imports: [RouterModule, TuiRoot, TranslocoModule],
  template: `
    <tui-root>
      <router-outlet />
    </tui-root>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
