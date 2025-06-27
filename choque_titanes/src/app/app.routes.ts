import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'mapa',
    loadComponent: () => import('./mapa/mapa.page').then((m) => m.MapaPage),
  },
  {
    path: '',
    redirectTo: 'mapa',
    pathMatch: 'full',
  },
  {
    path: 'fb',
    loadComponent: () => import('./firebase-test/firebase-test.page').then(m => m.FirebaseTestPage),
  },
];
