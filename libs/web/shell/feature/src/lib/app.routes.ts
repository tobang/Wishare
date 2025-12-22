import { Routes } from '@angular/router';
import { AuthGuard } from '@wishare/web/auth/data-access';
import { LayoutComponent } from '@wishare/web/shell/ui/layout';

export const appRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@wishare/web/landing-page/feature').then(
            (m) => m.LandingPageComponent
          ),
      },
      {
        path: 'wishlists',
        loadComponent: () =>
          import('@wishare/web/board/feature/board').then(
            (m) => m.BoardComponent
          ),
        canActivate: [AuthGuard],
      },
    ],
  },
];
