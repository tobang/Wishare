import { inject, Injectable } from '@angular/core';
import { WishlistDialogEffects } from './effects';

/**
 * Main effects orchestrator for wishlist.
 *
 * Coordinates all effect domains:
 * - Dialog operations
 */
@Injectable()
export class WishlistEffects {
  private readonly dialogEffects = inject(WishlistDialogEffects);
  private effectSubscriptions: unknown[] = [];

  register(actions: any) {
    this.effectSubscriptions.push(
      this.dialogEffects.register(actions)
    );
  }
}
