import {
  Directive,
  Input,
  OnDestroy,
  AfterViewInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { TemplatePortal } from '@angular/cdk/portal';
import { HeaderPortalService } from './header-portal.service';

export type HeaderContentPosition = 'left' | 'center' | 'right';

/**
 * Directive to project content into the application header.
 *
 * Use this directive to place navigation buttons, page titles, or action buttons
 * in the header from any child page.
 *
 * @example
 * ```html
 * <!-- Back button on the left -->
 * <ng-template headerContent="left">
 *   <button tuiIconButton appearance="flat" (click)="goBack()">
 *     <tui-icon icon="@tui.chevron-left" />
 *   </button>
 * </ng-template>
 *
 * <!-- Page title in the center -->
 * <ng-template headerContent="center">
 *   <h1>My Page Title</h1>
 * </ng-template>
 *
 * <!-- Action button on the right -->
 * <ng-template headerContent="right">
 *   <button tuiButton appearance="primary" (click)="addItem()">Add</button>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[headerContent]',
  standalone: true,
})
export class HeaderContentDirective implements AfterViewInit, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly templateRef = inject<TemplateRef<any>>(TemplateRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly headerPortal = inject(HeaderPortalService);

  /**
   * Position in the header: 'left', 'center', or 'right'
   */
  @Input({ required: true, alias: 'headerContent' })
  position: HeaderContentPosition = 'left';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private portal: TemplatePortal<any> | null = null;

  ngAfterViewInit(): void {
    // Create the portal after the view is initialized
    const portal = new TemplatePortal(this.templateRef, this.viewContainerRef);
    this.portal = portal;

    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      switch (this.position) {
        case 'left':
          this.headerPortal.setLeftContent(portal);
          break;
        case 'center':
          this.headerPortal.setCenterContent(portal);
          break;
        case 'right':
          this.headerPortal.setRightContent(portal);
          break;
      }
    });
  }

  ngOnDestroy(): void {
    switch (this.position) {
      case 'left':
        this.headerPortal.clearLeftContent();
        break;
      case 'center':
        this.headerPortal.clearCenterContent();
        break;
      case 'right':
        this.headerPortal.clearRightContent();
        break;
    }
    this.portal = null;
  }
}
