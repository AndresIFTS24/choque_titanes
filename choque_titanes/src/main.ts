import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Configuración Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyDkHFTWy3TNcQ_VyLybaQjZA8e_vA1fqyI',
  authDomain: 'choquetitanes-8e520.firebaseapp.com',
  databaseURL: 'https://choquetitanes-8e520-default-rtdb.firebaseio.com',
  projectId: 'choquetitanes-8e520',
  storageBucket: 'choquetitanes-8e520.firebasestorage.app',
  messagingSenderId: '1030182772199',
  appId: '1:1030182772199:web:63da5a8502d64d9578b142',
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Inicialización Firebase App
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    // Proveedor Firebase Database
    provideDatabase(() => getDatabase()),
  ],
});
