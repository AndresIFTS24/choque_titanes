import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root'
})
export class VibracionService {

  async vibrarLigero() {
    await Haptics.impact({ style: ImpactStyle.Light });
  }

  async vibrarMedio() {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }

  async vibrarFuerte() {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }

}
