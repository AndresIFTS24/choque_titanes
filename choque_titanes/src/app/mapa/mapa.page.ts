import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, ModalController } from '@ionic/angular/standalone';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation'
import { UrlSeguraPipe } from '../pipes/url-segura.pipe';
import { AuthService } from '../services/auth.service';
import { FirebaseDbService } from '../services/firebase-db.service';
import { jugador } from '../services/models';
import { IonicModule } from '@ionic/angular';
import { JugadoresComponent } from '../jugadores/jugadores.component';

@Component({
  selector: 'app-mapa',
  templateUrl: 'mapa.page.html',
  styleUrls: ['mapa.page.scss'],
  standalone: true,
  imports: [IonicModule ,UrlSeguraPipe],
})
export class MapaPage implements OnInit{

  //Variables que vamos a utilizar
  latitud?: number;
  longitud?: number;
  error?: string;
  jugador: jugador | null = null;

  // Inyecto el AuthService para cerrar sesion
  constructor(private authService: AuthService, private firebaseDb: FirebaseDbService, private modalCtrl: ModalController) {}

  async ngOnInit() {
    const user = this.authService.getUsuarioActual();
    if (!user) return;

    const perfil = await this.firebaseDb.obtenerPerfil(user.uid);
    if (perfil) {
      this.jugador = perfil;
    }
  }

  getAvatarUrl(icono: number): string {
    return `assets/icon/avatar-${icono}.png`; // Ajustá la ruta según tu carpeta de íconos
  }
  //boton Logout
  cerrarSesion(){
    this.authService.cerrarSesion();
  
  }

    async editarPerfil() {
    const modal = await this.modalCtrl.create({
      component: JugadoresComponent,
      componentProps: {
        nickActual: this.jugador?.seteo.nick,
        colorActual: this.jugador?.seteo.color,
        iconoActual: this.jugador?.seteo.icono 
      },
      backdropDismiss: false,
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.9
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    console.log(data);
    if (role === 'confirm') {
      // Actualizar jugador después de la edición
      const user = this.authService.getUsuarioActual();
      if (user) {
        const perfilActualizado = await this.firebaseDb.obtenerPerfil(user.uid);
        this.jugador = perfilActualizado;
      }
    }
  }
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