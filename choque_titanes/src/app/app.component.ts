import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode/ngx';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  providers: [BackgroundMode]
})

export class AppComponent {
  constructor(private platform: Platform, private backgroundMode: BackgroundMode) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();

    // Activar modo segundo plano
    this.backgroundMode.enable();
    this.backgroundMode.on('activate').subscribe(() => {
      console.log('Modo segundo plano activado');
    });

  }

async vibrarConEstilo() {
  await Haptics.impact({ style: ImpactStyle.Heavy });
}

}