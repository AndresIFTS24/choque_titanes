import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage), canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },

  {
    path: 'mapa',
    loadComponent: () => import('./mapa/mapa.page').then((m) => m.MapaPage), canActivate: [authGuard]
  },
  
  {
    path: 'fb',
    loadComponent: () => import('./firebase-test/firebase-test.page').then(m => m.FirebaseTestPage),
  },
];
