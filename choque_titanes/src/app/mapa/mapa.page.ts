import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation'
import { UrlSeguraPipe } from '../pipes/url-segura.pipe';
import { JugadoresComponent } from "../jugadores/jugadores.component"; 

@Component({
  selector: 'app-mapa',
  standalone: true,
  templateUrl: 'mapa.page.html',
  styleUrls: ['mapa.page.scss'],

  imports: [UrlSeguraPipe, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, JugadoresComponent],

})
export class MapaPage {
  //Variables que vamos a utilizar
  latitud?: number;
  longitud?: number;
  error?: string;

  private async verificarPermisosDeUbicacion(): Promise<boolean> {
    //Consultar los permisos actuales
    const permisos = await Geolocation.checkPermissions();

    //Si está concedido devuelve true
    if (permisos.location === 'granted') return true;

    //Si no, pide permiso al usuario
    const solicitud: PermissionStatus = await Geolocation.requestPermissions();

    return solicitud.location === 'granted';
  }

  async obtenerPosicionActual() {
    try {
      //Primero chequeamos o solicitamos permisos
      const tienePermiso = await this.verificarPermisosDeUbicacion();

      //Si no tenemos permiso, mostramos error
      if (!tienePermiso) {
        this.error = 'Permiso de ubicacion denegado';
        this.latitud = undefined;
        this.longitud = undefined;
        return;
      }

      //Si tenemos permiso, pedimos la ubicacion

      const posicion = await Geolocation.getCurrentPosition();

      //Guardar la latitud y longitud para mostrarla en pantalla

      this.latitud = posicion.coords.latitude;
      this.longitud = posicion.coords.longitude;

      //Borrar mensaje de error

      this.error = undefined;


    } catch (err) {
      //Si ocurre algun error (permiso, hardware, etc etc), muestro mensaje
      this.error = "Error obteniendo ubicacion: " + (err as any).message
    }
  }

  get googleMapsUrl(): string | null {
    return this.latitud !== undefined && this.longitud !== undefined ? `https://www.google.com/maps?q=${this.latitud},${this.longitud}&hl=es&z=15&output=embed` : null;
  }
  
}