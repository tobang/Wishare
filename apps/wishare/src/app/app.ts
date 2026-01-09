import { TuiRoot } from '@taiga-ui/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-wishare-root',
  imports: [RouterModule, TuiRoot, TranslocoModule],
  template: `
    <tui-root>
      <div class="app-shell">
        <div class="app-container">
          <router-outlet />
        </div>
      </div>
    </tui-root>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }

      tui-root {
        display: block;
        height: 100%;
      }

      .app-shell {
        height: 100%;
        width: 100%;
        box-sizing: border-box;
        padding: 1.5rem;
        background-color: #f7f9fc;
        background-image:
          radial-gradient(
            circle at 15% 55%,
            rgba(52, 98, 108, 0.4) 0%,
            transparent 40%
          ),
          radial-gradient(
            circle at 85% 15%,
            rgba(0, 136, 145, 0.4) 0%,
            transparent 40%
          ),
          radial-gradient(
            circle at 85% 85%,
            rgba(15, 48, 87, 0.3) 0%,
            transparent 45%
          );
        background-attachment: fixed;
        background-size: cover;
        overflow: hidden;
      }

      .app-container {
        width: 100%;
        height: 100%;
        background: transparent;
        border-radius: 24px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        position: relative;
        display: block; /* Changed from flex to block for reliable child height */
      }

      /* Hide router-outlet so it doesn't take up space */
      router-outlet {
        display: none;
      }

      /* Target the component routed into the outlet */
      .app-container > *:not(router-outlet) {
        display: block;
        width: 100%;
        height: 100%; /* Fill the container space */
        overflow-y: auto; /* Scroll strictly inside this element */
        overflow-x: hidden;
        position: relative; /* Ensure it establishes a positioning context */
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
