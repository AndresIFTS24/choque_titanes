import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { UrlSeguraPipe } from '../pipes/url-segura.pipe';
import { FirebaseDbService } from '../services/firebase-db.service';
import {LocalNotifications} from '@capacitor/local-notifications'

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
      const permisoNotificacion = await this.perdirPerminoNotificaciones();
      this.latitud = posicion.coords.latitude;
      this.longitud = posicion.coords.longitude;
      const url = `https://www.google.com/maps?q=${this.latitud},${this.longitud}&output=embed`;
      this.googleMapsUrl = url;
      this.error = null;
      if (permisoNotificacion && this.latitud && this.longitud) {
        await this.mostrarNotificacion('Ubicacion actulizada', 'Latitud: ${this.latitud.toFixed(5), Longitud: ${this.longitud.toFixed(5)}}')
      }
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

  async perdirPerminoNotificaciones () {
    const permiso = await LocalNotifications.requestPermissions();
    if (permiso.display !=='granted') {
      alert ('No se otorgaron los permisos para las notificaciones') 
      return false
    }
    return true
  }

  async mostrarNotificacion(titulo:string, cuerpo:string) { 
    await LocalNotifications.schedule({
      notifications: [
        {
          title:titulo,
          body:cuerpo,
          id: new Date().getTime(),
          schedule: {at: new Date(Date.now() + 2000)}, 
          actionTypeId: '',
          extra: null,
        }
      ]
    })
  }

}
