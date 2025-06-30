import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { FirebaseDbService } from '../services/firebase-db.service';
import { BALL } from '../services/models';

// Importaciones de OpenLayers
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Style } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import { Geometry } from 'ol/geom';
import { Subscription } from 'rxjs'; // Importamos Subscription

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

  // Propiedades de OpenLayers
  private mapa!: Map;
  private vectorSource!: VectorSource<Feature<Geometry>>;
  private jugadorFeature!: Feature<Point>;
  private ballsFeatures: globalThis.Map<string, Feature<Point>> = new globalThis.Map<string, Feature<Point>>();
  private ballsSubscription!: Subscription; // Para gestionar la suscripción de las bolas

  constructor(
    private firebaseService: FirebaseDbService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Solo conectamos al servicio Firebase aquí.
    // La suscripción a las bolas se hará una vez que el mapa esté listo.
    this.firebaseService.Conectar_al_Mapa();
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      // Usamos un setTimeout para asegurar que el DOM esté completamente listo,
      // aunque ya estamos en ngAfterViewInit.
      setTimeout(() => {
        this.obtenerUbicacionYCrearMapa();
      }, 100);
    });
  }

  ngOnDestroy() {
    this.detenerActualizacion();
    // Aseguramos que la suscripción a las bolas se desuscriba
    if (this.ballsSubscription) {
      this.ballsSubscription.unsubscribe();
      console.log('Suscripción a bolas de Firebase terminada.');
    }
    if (this.mapa) {
      this.mapa.setTarget(undefined);
      // @ts-ignore
      this.mapa = null;
      console.log('Mapa de OpenLayers destruido.');
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

      if (this.mapa) {
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

    if (this.mapa) {
      this.mapa.setTarget(undefined);
      console.log('Mapa existente removido antes de reinicializar.');
    }

    // ORIGINAL: Se centra en tu ubicación actual
    // const coordenadaInicial = fromLonLat([lng, lat]);

    // *** TEMPORALMENTE: Centrar en una de las bolas para depuración ***
    // (Recuerda volver a la línea original después de la prueba)
    const coordenadaDeUnaBola = fromLonLat([-58.4390227, -34.5971658]); // Usa una de las coordenadas de tus bolas
    // *******************************************************************


    this.vectorSource = new VectorSource<Feature<Point>>();
    const vectorLayer = new VectorLayer({
      source: this.vectorSource,
    });

    this.mapa = new Map({
      target: elemento,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        // *** CAMBIO AQUÍ PARA CENTRAR EN LA BOLA ***
        center: coordenadaDeUnaBola, // Usa la coordenada de la bola para depuración
        // *****************************************
        zoom: 17, // Puedes probar con un zoom menor como 14 o 12 para ver más área
        projection: 'EPSG:3857'
      }),
      controls: []
    });

    this.jugadorFeature = new Feature({
      geometry: new Point(fromLonLat([lng, lat])), // El jugador sigue en tu posición real
    });

    this.jugadorFeature.setStyle(new Style({
      image: new Icon({
        src: 'https://cdn-icons-png.flaticon.com/512/61/61109.png', // Icono de persona genérico
        size: [35, 35],
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        crossOrigin: 'anonymous'
      }),
    }));

    this.vectorSource.addFeature(this.jugadorFeature);
    console.log('Mapa de OpenLayers inicializado con jugador.');

    // MOVIDO AQUÍ: Suscribirse a las bolas solo después de que el mapa esté inicializado
    this.ballsSubscription = this.firebaseService.obsBalls.subscribe((bolas: globalThis.Map<string, BALL>) => {
      this.ngZone.run(() => {
        this.actualizarBolasEnMapa(bolas);
      });
    });
    console.log('Suscripción a obsBalls activada después de inicializar mapa.');
  }

  private actualizarBolasEnMapa(bolas: globalThis.Map<string, BALL>) {
    if (!this.mapa || !this.vectorSource) {
        // Este console.warn ya no debería aparecer con la lógica corregida
        console.warn('Mapa o vectorSource no inicializado, no se pueden actualizar las bolas. (Este mensaje no debería verse)');
        return;
    }

    // Primero, elimina las bolas del mapa que ya no existen en los datos de Firebase
    this.ballsFeatures.forEach((feature: Feature<Point>, id: string) => {
      if (!bolas.has(id)) {
        this.vectorSource.removeFeature(feature);
        this.ballsFeatures.delete(id);
      }
    });

    // Luego, añade o actualiza las bolas restantes
    bolas.forEach((ball: BALL, id: string) => {
      const existente = this.ballsFeatures.get(id);
      // Aseguramos que lat, long y OWNER existan y sean números válidos para lat/long
      if (typeof ball.lat === 'number' && typeof ball.long === 'number' && ball.OWNER) {
        const coordenadaBall = fromLonLat([ball.long, ball.lat]);
        if (existente) {
          (existente.getGeometry() as Point).setCoordinates(coordenadaBall);
          console.log(`✅ Bola ID: ${id} actualizada en el vectorSource.`); // Log para bolas actualizadas
        } else {
          const ballFeature = new Feature({
            geometry: new Point(coordenadaBall),
          });
          // CAMBIO IMPORTANTE AQUÍ: Usando un icono externo para la bola
          ballFeature.setStyle(new Style({
            image: new Icon({
              src: 'https://cdn-icons-png.flaticon.com/512/2875/2875560.png', // Icono de bola de billar
              size: [30, 30],
              anchor: [0.5, 1],
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              crossOrigin: 'anonymous'
            }),
          }));
          this.vectorSource.addFeature(ballFeature);
          this.ballsFeatures.set(id, ballFeature);
          console.log(`✅ Bola ID: ${id} añadida al vectorSource.`); // Log para bolas añadidas
        }
      } else {
        // Mejoramos el mensaje de advertencia para indicar qué falta
        console.warn(`⚠️ BALL inválida ignorada (ID: ${id}): falta lat/long válidos o OWNER.`, ball);
      }
    });
  }

  iniciarActualizacionContinua() {
    if (!this.mapa) {
      console.warn('Mapa no inicializado, no se puede iniciar actualización continua.');
      return;
    }

    this.detenerActualizacion();

    this.actualizarPosicion(); // Llama una vez inmediatamente

    this.intervaloId = setInterval(() => {
      this.actualizarPosicion();
      this.verificarColisiones();
    }, 1000);
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

      const umbralCambio = 0.000001;
      const latCambio = this.latitud === null ? Infinity : Math.abs(this.latitud - nuevaLat);
      const longCambio = this.longitud === null ? Infinity : Math.abs(this.longitud - nuevaLong);

      if (latCambio > umbralCambio || longCambio > umbralCambio) {
        this.firebaseService.setPosicion(nuevaLat, nuevaLong);

        this.latitud = nuevaLat;
        this.longitud = nuevaLong;
        this.actualizarMarcadorJugador(nuevaLat, nuevaLong);
        // Si el mapa NO está centrado en la bola para depuración, asegúrate de que se mueva con el jugador
        // if (this.mapa && this.jugadorFeature) {
        //   const playerCoordinates = (this.jugadorFeature.getGeometry() as Point).getCoordinates();
        //   this.mapa.getView().setCenter(playerCoordinates);
        // }
      }
    } catch (err: any) {
      this.error = 'Error al obtener la ubicación: ' + err.message;
      console.error('Error en actualizarPosicion:', err);
    }
  }

  actualizarMarcadorJugador(lat: number, long: number) {
    if (this.jugadorFeature) {
      const nuevaCoordenada = fromLonLat([long, lat]);
      (this.jugadorFeature.getGeometry() as Point).setCoordinates(nuevaCoordenada);
    } else {
      if (this.mapa && this.vectorSource) {
          console.warn('Jugador Feature no encontrada, creándola de nuevo.');
          const coordenadaJugador = fromLonLat([long, lat]);
          this.jugadorFeature = new Feature({
              geometry: new Point(coordenadaJugador),
          });
          this.jugadorFeature.setStyle(new Style({
              image: new Icon({
                  src: 'https://cdn-icons-png.flaticon.com/512/61/61109.png', // Icono de persona genérico
                  size: [35, 35],
                  anchor: [0.5, 1],
                  anchorXUnits: 'fraction',
                  anchorYUnits: 'fraction',
                  crossOrigin: 'anonymous'
              }),
          }));
          this.vectorSource.addFeature(this.jugadorFeature);
      } else {
          console.warn('No se puede crear marcador de jugador: mapa o vectorSource no inicializado.');
      }
    }
  }

  verificarColisiones() {
    if (!this.latitud || !this.longitud) return;

    this.firebaseService.listaBalls.forEach((ball, id) => {
      // Aseguramos que lat, long y OWNER existan y sean números válidos para lat/long
      if (typeof ball.lat === 'number' && typeof ball.long === 'number' && ball.OWNER) {
        const distancia = this.calcularDistancia(this.latitud!, this.longitud!, ball.lat, ball.long);
        const radioColisionMetros = 5;
        if (distancia < radioColisionMetros && ball.OWNER !== this.firebaseService.authid) {
          this.firebaseService.eliminarBall(id);
          if (this.firebaseService.jugadorActual) {
            this.firebaseService.jugadorActual.PUNTOS += 1;
            this.firebaseService.setPuntos(this.firebaseService.jugadorActual.PUNTOS);
            console.log(`¡Colisión! Puntos: ${this.firebaseService.jugadorActual.PUNTOS}`);
          }
        }
      } else {
        console.warn(`⚠️ BALL con ID ${id} tiene lat/long inválidos o falta OWNER para colisión:`, ball);
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
    return R * c;
  }

  modificarJugadorVisual(seteo: { Nick: string; Icono: number; Color: string }) {
    console.log('Actualizar visual del jugador:', seteo);
    if (this.jugadorFeature) {
      this.jugadorFeature.setStyle(new Style({
        image: new Icon({
          src: 'https://cdn-icons-png.flaticon.com/512/61/61109.png', // Mantenemos el icono de prueba para asegurar visibilidad
          size: [35, 35],
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          crossOrigin: 'anonymous'
        }),
      }));
    }
  }
}