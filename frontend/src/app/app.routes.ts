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
  {
    path: 'ingresos',
    loadComponent: () =>
      import('./features/gastos/gastos-list.component').then(
        (m) => m.GastosListComponent,
      ),
  },
  {
    path: 'ahorros',
    loadComponent: () =>
      import('./features/ahorros/ahorros-list.component').then(
        (m) => m.AhorrosListComponent,
      ),
  },
];
