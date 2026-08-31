import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'gastos',
    loadComponent: () =>
      import('./features/gastos/gastos-list.component').then(
        (m) => m.GastosListComponent,
      ),
  },
];
