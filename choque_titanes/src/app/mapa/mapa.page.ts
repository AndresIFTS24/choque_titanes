import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { DomSanitizer } from '@angular/platform-browser';
import { UrlSeguraPipe } from '../pipes/url-segura.pipe';
import { FirebaseDbService } from '../services/firebase-db.service';

@Component({
  standalone: true,
  selector: 'app-mapa',
  templateUrl: 'mapa.page.html',
  styleUrls: ['mapa.page.scss'],
  imports: [IonicModule, CommonModule, UrlSeguraPipe]
})
export class MapaPage implements OnInit, OnDestroy {

  latitud: number | null = null;
  longitud: number | null = null;
  error: string | null = null;
  googleMapsUrl: string | null = null;

  private intervaloId: any;

  constructor(
    private sanitizer: DomSanitizer, 
    private firebaseService: FirebaseDbService)
  
   { }

  ngOnInit() {
    this.firebaseService.Conectar_al_Mapa();
    this.iniciarActualizacionContinua();
  }

  ngOnDestroy() {
    this.detenerActualizacion();
  }

  async actualizarPosicion() {
    try {
      const posicion = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.latitud = posicion.coords.latitude;
      this.longitud = posicion.coords.longitude;
      const url = `https://www.google.com/maps?q=${this.latitud},${this.longitud}&output=embed`;
      this.googleMapsUrl = url;
      this.error = null;
    } catch (err: any) {
      this.error = 'Error al obtener la ubicación: ' + err.message;
    }
  }

  iniciarActualizacionContinua() {
    this.actualizarPosicion(); // Obtener al instante
    this.intervaloId = setInterval(() => this.actualizarPosicion(), 500); // cada medio segundo
  }

  detenerActualizacion() {
    if (this.intervaloId) {
      clearInterval(this.intervaloId);
      this.intervaloId = null;
    }
  }
}
