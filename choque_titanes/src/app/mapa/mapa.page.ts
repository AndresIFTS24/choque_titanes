import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  NgZone // Ya lo estás usando, excelente
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { FirebaseDbService } from '../services/firebase-db.service';
import { BALL } from '../services/models';
import * as L from 'leaflet';

@Component({
  standalone: true,
  selector: 'app-mapa',
  templateUrl: 'mapa.page.html',
  styleUrls: ['mapa.page.scss'],
  imports: [IonicModule, CommonModule]
})
export class MapaPage implements OnInit, OnDestroy, AfterViewInit {
  latitud: number | null = null;
  longitud: number | null = null;
  error: string | null = null;
  private intervaloId: any;
  private mapa!: L.Map;
  private ballsMarkers: Map<string, L.Marker> = new Map();
  private jugadorMarker?: L.Marker;

  constructor(
    // DomSanitizer no es necesario si solo usas rutas directas de assets
    // private sanitizer: DomSanitizer,
    private firebaseService: FirebaseDbService,
    private ngZone: NgZone // Muy importante para Leaflet dentro de Angular
  ) {}

  ngOnInit() {
    this.firebaseService.Conectar_al_Mapa();
    // Suscribirse a las bolas aquí para asegurar que las actualizaciones lleguen al mapa
    this.firebaseService.obsBalls.subscribe((bolas: Map<string, BALL>) => {
      this.ngZone.run(() => { // Asegura que los cambios se detecten en Angular
        this.actualizarBolasEnMapa(bolas);
      });
    });
  }

  // ngAfterViewInit es el hook donde el DOM del componente está completamente inicializado.
  ngAfterViewInit() {
    // Es posible que el DOM necesite un microtask o un frame para que sus dimensiones se asienten
    // completamente después de ngAfterViewInit, especialmente en Ionic.
    // Usaremos un setTimeout sin zona de Angular para esto.
    this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
            this.obtenerUbicacionYCrearMapa();
        }, 100); // Pequeño retraso para dar tiempo al DOM a estabilizarse
    });
  }

  ngOnDestroy() {
    this.detenerActualizacion();
    if (this.mapa) {
      this.mapa.remove(); // Limpia el mapa de Leaflet
      // @ts-ignore
      this.mapa = null; // Elimina la referencia para evitar fugas de memoria
      console.log('Mapa de Leaflet destruido.');
    }
  }

  async obtenerUbicacionYCrearMapa() {
    try {
      const posicion = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const lat = posicion.coords.latitude;
      const lng = posicion.coords.longitude;

      this.latitud = lat;
      this.longitud = lng;

      this.inicializarMapa(lat, lng);

      if (this.mapa) { // Solo iniciar actualización si el mapa se inicializó con éxito
        this.iniciarActualizacionContinua();
      }

    } catch (err: any) {
      this.error = 'No se pudo obtener la ubicación: ' + err.message;
      console.error('Error al obtener ubicación:', err);
    }
  }

  private inicializarMapa(lat: number, lng: number) {
    const elemento = document.getElementById('mapa');
    if (!elemento) {
      console.error('Elemento del mapa (#mapa) no encontrado en el DOM.');
      return;
    }

    // Asegurarse de que no haya un mapa duplicado si se llama varias veces
    if (this.mapa) {
      this.mapa.remove();
      console.log('Mapa existente removido antes de reinicializar.');
    }

    // Inicializar el mapa de Leaflet
    this.mapa = L.map(elemento, {
        zoomControl: false // Oculta los botones de zoom si no los necesitas, gestionas el zoom con tu app
    }).setView([lat, lng], 17); // Nivel de zoom inicial

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19 // Limita el zoom máximo para consistencia
    }).addTo(this.mapa);

    // Añadir marcador del jugador
    this.jugadorMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'assets/icon/player.png', // Asegúrate de que esta ruta sea correcta
        iconSize: [35, 35], // Tamaño del ícono
        iconAnchor: [17, 35], // Punto "inferior" del ícono que se ancla a la lat/lng
      }),
    }).addTo(this.mapa);

    // **CRUCIAL PARA IONIC/ANGULAR**: Forzar a Leaflet a recalcular el tamaño de su contenedor.
    // Ejecutar fuera de la zona de Angular para evitar problemas de rendimiento y re-renderizado.
    this.ngZone.runOutsideAngular(() => {
        // Un setTimeout más generoso o incluso un retraso escalonado
        setTimeout(() => {
            if (this.mapa) {
                this.mapa.invalidateSize();
                console.log('mapa.invalidateSize() llamado con éxito.');
            }
        }, 750); // Aumentado a 750ms para mayor seguridad
    });
    console.log('Mapa de Leaflet inicializado.');
  }

  private actualizarBolasEnMapa(bolas: Map<string, BALL>) {
    if (!this.mapa) {
        console.warn('Mapa no inicializado, no se pueden actualizar las bolas.');
        return;
    }

    // Eliminar bolas que ya no están en la lista de Firebase
    this.ballsMarkers.forEach((marker, id) => {
      if (!bolas.has(id)) {
        this.mapa.removeLayer(marker);
        this.ballsMarkers.delete(id);
      }
    });

    // Actualizar o añadir bolas nuevas
    bolas.forEach((ball: BALL, id: string) => {
      const existente = this.ballsMarkers.get(id);
      if (existente) {
        existente.setLatLng([ball.lat, ball.long]);
      } else {
        // Asegúrate de que las propiedades lat/long existen antes de crear el marcador
        if (typeof ball.lat === 'number' && typeof ball.long === 'number') {
            const marker = L.marker([ball.lat, ball.long], {
              icon: L.icon({
                iconUrl: 'assets/icon/ball.png', // Asegúrate de que esta ruta sea correcta
                iconSize: [30, 30],
                iconAnchor: [15, 30],
              }),
            }).addTo(this.mapa);
            this.ballsMarkers.set(id, marker);
        } else {
            console.warn(`Datos de bola incompletos o inválidos para ID: ${id}`, ball);
        }
      }
    });
  }

  iniciarActualizacionContinua() {
    if (!this.mapa) {
      console.warn('Mapa no inicializado, no se puede iniciar actualización continua.');
      return;
    }

    this.detenerActualizacion(); // Limpiar cualquier intervalo anterior

    this.actualizarPosicion(); // Ejecutar una vez inmediatamente al iniciar

    this.intervaloId = setInterval(() => {
      this.actualizarPosicion();
      this.verificarColisiones();
    }, 1000); // Actualiza cada segundo
    console.log('Actualización de ubicación y bolas iniciada.');
  }

  detenerActualizacion() {
    if (this.intervaloId) {
      clearInterval(this.intervaloId);
      this.intervaloId = null;
      console.log('Actualización de ubicación y bolas detenida.');
    }
  }

  async actualizarPosicion() {
    try {
      const posicion = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const nuevaLat = posicion.coords.latitude;
      const nuevaLong = posicion.coords.longitude;

      // Un pequeño umbral para evitar actualizaciones constantes por cambios mínimos
      const umbralCambio = 0.000001; // Aproximadamente 0.1 metros de cambio en lat/long
      const latCambio = this.latitud === null ? Infinity : Math.abs(this.latitud - nuevaLat);
      const longCambio = this.longitud === null ? Infinity : Math.abs(this.longitud - nuevaLong);

      if (latCambio > umbralCambio || longCambio > umbralCambio) {
        this.firebaseService.setPosicion(nuevaLat, nuevaLong);
        // Ojo: `crearBall` cada segundo crearía MUCHAS bolas. Considera moverlo a una interacción específica del usuario.
        // this.firebaseService.crearBall(nuevaLat, nuevaLong);

        this.latitud = nuevaLat;
        this.longitud = nuevaLong;
        this.actualizarMarcadorJugador(nuevaLat, nuevaLong);
        // Opcional: Centrar el mapa en el jugador mientras se mueve (desactiva si quieres mover el mapa manualmente)
        // if (this.mapa && this.jugadorMarker) {
        //   this.mapa.panTo(this.jugadorMarker.getLatLng());
        // }
      }
    } catch (err: any) {
      this.error = 'Error al obtener la ubicación: ' + err.message;
      console.error('Error en actualizarPosicion:', err);
      // Podrías detener la actualización si hay un error persistente
      // this.detenerActualizacion();
    }
  }

  actualizarMarcadorJugador(lat: number, long: number) {
    if (this.jugadorMarker) {
      this.jugadorMarker.setLatLng([lat, long]);
    } else {
      // Si el marcador no se ha inicializado por alguna razón, créalo ahora
      if (this.mapa) {
        this.jugadorMarker = L.marker([lat, long], {
          icon: L.icon({
            iconUrl: 'assets/icon/player.png',
            iconSize: [35, 35],
            iconAnchor: [17, 35],
          }),
        }).addTo(this.mapa);
      } else {
          console.warn('No se puede crear marcador de jugador: mapa no inicializado.');
      }
    }
  }

  verificarColisiones() {
    if (!this.latitud || !this.longitud) return;

    this.firebaseService.listaBalls.forEach((ball, id) => {
      // Asegurarse de que ball tenga lat/long válidos
      if (typeof ball.lat === 'number' && typeof ball.long === 'number') {
        const distancia = this.calcularDistancia(this.latitud!, this.longitud!, ball.lat, ball.long);
        const radioColisionMetros = 5; // Ajusta este valor según el tamaño visual de las bolas y jugadores
        if (distancia < radioColisionMetros && ball.OWNER !== this.firebaseService.authid) {
          this.firebaseService.eliminarBall(id);
          if (this.firebaseService.jugadorActual) {
            this.firebaseService.jugadorActual.PUNTOS += 1;
            this.firebaseService.setPuntos(this.firebaseService.jugadorActual.PUNTOS);
            console.log(`¡Colisión! Puntos: ${this.firebaseService.jugadorActual.PUNTOS}`);
          }
        }
      } else {
        console.warn(`Ball con ID ${id} tiene lat/long inválidos para colisión:`, ball);
      }
    });
  }

  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en metros
  }

  // Este método parece no estar en uso directo en tu plantilla actual, pero lo mantengo.
  modificarJugadorVisual(seteo: { Nick: string; Icono: number; Color: string }) {
    console.log('Actualizar visual del jugador:', seteo);
    // Podrías usar esto para cambiar dinámicamente el icono del jugador
    // if (this.jugadorMarker && this.mapa) {
    //     const nuevoIcono = L.icon({
    //         iconUrl: `assets/icon/${seteo.Icono}.png`, // Asegúrate que el Icono se mapea a un nombre de archivo
    //         iconSize: [35, 35],
    //         iconAnchor: [17, 35],
    //     });
    //     this.jugadorMarker.setIcon(nuevoIcono);
    // }
  }
}