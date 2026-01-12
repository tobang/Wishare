import { Injectable, signal } from '@angular/core';
import { TemplatePortal } from '@angular/cdk/portal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HeaderTemplatePortal = TemplatePortal<any>;

/**
 * Service for managing dynamic content in the application header.
 *
 * This service allows child pages to project their own navigation items,
 * buttons, or other content into the header/navbar area.
 *
 * @example
 * ```typescript
 * // In a child component
 * export class WishlistDetailsComponent {
 *   private headerPortal = inject(HeaderPortalService);
 *
 *   @ViewChild('headerContent') headerContentTemplate!: TemplateRef<unknown>;
 *
 *   ngAfterViewInit() {
 *     const portal = new TemplatePortal(this.headerContentTemplate, this.viewContainerRef);
 *     this.headerPortal.setLeftContent(portal);
 *   }
 *
 *   ngOnDestroy() {
 *     this.headerPortal.clearLeftContent();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class HeaderPortalService {
  /**
   * Signal containing the portal for left-side header content (back buttons, breadcrumbs, etc.)
   */
  readonly leftContent = signal<HeaderTemplatePortal | null>(null);

  /**
   * Signal containing the portal for center header content (page title, etc.)
   */
  readonly centerContent = signal<HeaderTemplatePortal | null>(null);

  /**
   * Signal containing the portal for right-side header content (action buttons, etc.)
   * Note: User avatar is always displayed on the far right
   */
  readonly rightContent = signal<HeaderTemplatePortal | null>(null);

  /**
   * Sets the left content portal (typically for back buttons or breadcrumbs)
   */
  setLeftContent(portal: HeaderTemplatePortal): void {
    this.leftContent.set(portal);
  }

  /**
   * Sets the center content portal (typically for page title)
   */
  setCenterContent(portal: HeaderTemplatePortal): void {
    this.centerContent.set(portal);
  }

  /**
   * Sets the right content portal (typically for action buttons)
   */
  setRightContent(portal: HeaderTemplatePortal): void {
    this.rightContent.set(portal);
  }

  /**
   * Clears the left content portal
   */
  clearLeftContent(): void {
    this.leftContent.set(null);
  }

  /**
   * Clears the center content portal
   */
  clearCenterContent(): void {
    this.centerContent.set(null);
  }

  /**
   * Clears the right content portal
   */
  clearRightContent(): void {
    this.rightContent.set(null);
  }

  /**
   * Clears all content portals
   */
  clearAll(): void {
    this.leftContent.set(null);
    this.centerContent.set(null);
    this.rightContent.set(null);
  }
}
