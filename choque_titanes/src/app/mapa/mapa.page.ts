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
import { ball } from '../services/models';
import { jugador } from '../services/models';
import OlMap from 'ol/Map';
// Importaciones de OpenLayers
import { View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import { Geometry } from 'ol/geom';
import { Subscription } from 'rxjs'; // Importamos Subscription
import { MapaBridgeService } from '../services/mapa-bridge.service';
import { AuthService } from '../services/auth.service';


import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, ModalController } from '@ionic/angular/standalone';
import { UrlSeguraPipe } from '../pipes/url-segura.pipe';
import { JugadoresComponent } from '../jugadores/jugadores.component';

import { Style, Icon, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { VibracionService } from '../services/vibracion.service';


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
  private jugadoresEnMapa: globalThis.Map<string, jugador> = new globalThis.Map();
  private ballsEnMapa: globalThis.Map<string, ball> = new globalThis.Map();
  // Propiedades de OpenLayers
  private mapa!: OlMap;
  private vectorSource!: VectorSource<Feature<Geometry>>;
  private jugadorFeature!: Feature<Point>;
  private ballsFeatures: globalThis.Map<string, Feature<Point>> = new globalThis.Map<string, Feature<Point>>();
  private ballsSubscription!: Subscription; // Para gestionar la suscripción de las bolas
  private jugadoresFeatures: Map<string, Feature<Point>> = new Map();

  constructor(
    private authService: AuthService,
    public firebaseService: FirebaseDbService,
    private mapaBridge: MapaBridgeService,
    private ngZone: NgZone,
    private modalCtrl: ModalController,
    private vibracion: VibracionService
  ) { }

  ngOnInit() {
    // Solo conectamos al servicio Firebase aquí.
    // La suscripción a las bolas se hará una vez que el mapa esté listo.
   

    this.mapaBridge.crearBall = this.crearBall.bind(this);
    this.mapaBridge.borrarBall = this.borrarBall.bind(this);
    this.mapaBridge.crear_jugador = this.crearJugador.bind(this);
    this.mapaBridge.borrarJugador = this.borrarJugador.bind(this);
    this.mapaBridge.modjugador_seteo = this.actualizarSeteoJugador.bind(this);
    this.mapaBridge.modjugador_POS = this.actualizarPosJugador.bind(this);
    this.mapaBridge.modjugador_puntos = this.actualizarPuntosJugador.bind(this);


    

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.obtenerUbicacionYCrearMapa();
      }, 100);
    });
  }

  getAvatarUrl(icono: number): string {
    return `assets/icon/avatar-${icono}.png`; // Ajustá la ruta según tu carpeta de íconos
  }

  
  //boton Logout
  cerrarSesion(){
    this.authService.cerrarSesion();
  }

crearBall(id: string, data: ball) {
  console.log("🟢 Ball creada:", id, data);

  if (!this.mapa || !this.vectorSource) return;

  const coordenadaBall = fromLonLat([data.long, data.lat]);

  const ballFeature = new Feature({
    geometry: new Point(coordenadaBall),
  });

  const esPropia = data.owner === this.firebaseService.authid;

  // Colores: amarilla si es propia, roja si es de otro
  const colorBall = esPropia ? '#ffff00' : '#ff0000';

  ballFeature.setStyle(new Style({
    image: new Icon({
      src: 'assets/icon/ball.png',
      scale: 0.07,
      anchor: [0.5, 1],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      crossOrigin: 'anonymous',
      color: colorBall
    }),
  }));

  this.vectorSource.addFeature(ballFeature);
  this.ballsFeatures.set(id, ballFeature);

}

borrarBall(id: string) {
  console.log("🔴 Ball eliminada:", id);

  const ballFeature = this.ballsFeatures.get(id);
  if (ballFeature && this.vectorSource) {
    this.vectorSource.removeFeature(ballFeature);
    this.ballsFeatures.delete(id);
  }
}


crearJugador(uid: string, jugador: jugador) {
  console.log("🧍 Jugador creado:", uid, jugador);
  this.jugadoresEnMapa.set(uid, jugador);

  if (!this.vectorSource) return;

  const coord = fromLonLat([jugador.pos.long, jugador.pos.lat]);

  const feature = new Feature({
    geometry: new Point(coord)
  });

  const iconoUrl = this.getAvatarUrl(jugador.seteo.icono);
  const colorHex = (typeof jugador.seteo?.color === 'string')
    ? jugador.seteo.color.toLowerCase()
    : '#000000';

  const nick = jugador.seteo?.nick ?? 'SinNick';
  const puntos = jugador.puntos ?? 0;

  const iconScale = 0.06; // Ajustá según tamaño del ícono real

  // Estilo del ícono centrado
  const estiloIcono = new Style({
    image: new Icon({
      src: iconoUrl,
      scale: iconScale,
      anchor: [0.5, 0.5], // Centrado total
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      crossOrigin: 'anonymous'
    }),
  });

  // Estilo del círculo de color (borde tipo aura)
  const estiloBorde = new Style({
    image: new CircleStyle({
      radius: 32, // Ajustá al tamaño del ícono (por fuera)
      fill: new Fill({ color: 'rgba(0,0,0,0)' }), // Transparente, solo borde
      stroke: new Stroke({ color: colorHex, width: 4 })
    })
  });

  // Estilo del texto (nick y puntos)
  const estiloTexto = new Style({
    text: new Text({
      text: `${nick} - ${puntos}`,
      font: '12px sans-serif',
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
      offsetY: -35, // Texto sobre el jugador
    })
  });

  // Se aplican los tres estilos: borde, ícono, y texto
  feature.setStyle([estiloBorde, estiloIcono, estiloTexto]);

  this.vectorSource.addFeature(feature);
  this.jugadoresFeatures.set(uid, feature);
}

borrarJugador(uid: string) {
  console.log("🚫 Jugador eliminado:", uid);
  this.jugadoresEnMapa.delete(uid);

  const feature = this.jugadoresFeatures.get(uid);
  if (feature && this.vectorSource) {
    this.vectorSource.removeFeature(feature);
    this.jugadoresFeatures.delete(uid);
  }
}

actualizarSeteoJugador(uid: string, nuevoSeteo: jugador['seteo']) {
  console.log("🎨 Seteo actualizado:", uid, nuevoSeteo);
  const jugador = this.jugadoresEnMapa.get(uid);
  if (jugador) {
    jugador.seteo = nuevoSeteo;
    this.jugadoresEnMapa.set(uid, jugador);

    const feature = this.jugadoresFeatures.get(uid);
    if (feature) {
      const colorHex = (typeof nuevoSeteo.color === 'string') ? nuevoSeteo.color.toLowerCase() : '#000000';
      const iconoUrl = this.getAvatarUrl(nuevoSeteo.icono);

      // Actualizar estilos manteniendo texto
      const estiloIcono = new Style({
        image: new Icon({
          src: iconoUrl,
          scale: 0.06,
          anchor: [0.5, 0.5],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          crossOrigin: 'anonymous'
        }),
      });

      const estiloBorde = new Style({
        image: new CircleStyle({
          radius: 32,
          fill: new Fill({ color: 'rgba(0,0,0,0)' }),
          stroke: new Stroke({ color: colorHex, width: 4 })
        })
      });

      const estiloTexto = new Style({
        text: new Text({
          text: `${nuevoSeteo.nick ?? 'SinNick'} - ${jugador.puntos ?? 0}`,
          font: '12px sans-serif',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
          offsetY: -35,
        })
      });

      feature.setStyle([estiloBorde, estiloIcono, estiloTexto]);
    }
  }
}

  actualizarPosJugador(uid: string, nuevaPos: jugador['pos']) {
    console.log("📍 Posición actualizada:", uid, nuevaPos);
    const jugador = this.jugadoresEnMapa.get(uid);
    if (jugador) {
      jugador.pos = nuevaPos;
      this.jugadoresEnMapa.set(uid, jugador);

      const feature = this.jugadoresFeatures.get(uid);
      if (feature) {
        const newCoord = fromLonLat([nuevaPos.long, nuevaPos.lat]);
        (feature.getGeometry() as Point).setCoordinates(newCoord);
      }
    }
}

actualizarPuntosJugador(uid: string, nuevosPuntos: number) {
  console.log("⭐ Puntos actualizados:", uid, nuevosPuntos);
  const jugador = this.jugadoresEnMapa.get(uid);
  if (jugador) {
    jugador.puntos = nuevosPuntos;
    this.jugadoresEnMapa.set(uid, jugador);

    const feature = this.jugadoresFeatures.get(uid);
    if (feature) {
      const estiloActual = feature.getStyle() as Style | Style[];
      if (Array.isArray(estiloActual)) {
        // Actualizar el estilo de texto dentro del arreglo
        estiloActual.forEach(estilo => {
          const texto = estilo.getText();
          if (texto) {
            texto.setText(`${jugador.seteo.nick ?? 'SinNick'} - ${nuevosPuntos}`);
          }
        });
        feature.setStyle(estiloActual);
      } else {
        const texto = estiloActual.getText();
        if (texto) {
          texto.setText(`${jugador.seteo.nick ?? 'SinNick'} - ${nuevosPuntos}`);
          feature.setStyle(estiloActual);
        }
      }
    }
  }
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
    this.firebaseService.Conectar_al_Mapa();
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

    const coordenadaInicial = fromLonLat([lng, lat]);

    this.vectorSource = new VectorSource<Feature<Point>>();
    const vectorLayer = new VectorLayer({
      source: this.vectorSource,
    });

    this.mapa = new OlMap({
      target: elemento,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: coordenadaInicial,
        zoom: 17,
        projection: 'EPSG:3857'
      }),
      controls: []
    });

    this.jugadorFeature = new Feature({
      geometry: new Point(coordenadaInicial),
    });

    this.jugadorFeature.setStyle(new Style({
      image: new Icon({
        src: 'https://cdn-icons-png.flaticon.com/512/61/61109.png',
        size: [35, 35],
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        crossOrigin: 'anonymous'
      }),
    }));

    this.vectorSource.addFeature(this.jugadorFeature);

    // Forzar el centrado del mapa en el jugador al inicio
    this.mapa.getView().setCenter(coordenadaInicial);

  }


  iniciarActualizacionContinua() {
    if (!this.mapa) {
      console.warn('Mapa no inicializado, no se puede iniciar actualización continua.');
      return;
    }

    //this.detenerActualizacion();

    this.actualizarPosicion(); // Llama una vez inmediatamente

    this.intervaloId = setInterval(() => {
      this.actualizarPosicion(); 
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

        this.firebaseService.crearBall(nuevaLat,nuevaLong);
        this.verificarColisiones();
      // CENTRAR EL MAPA EN LA NUEVA POSICIÓN DEL JUGADOR
        if (this.mapa) {
          const coordenadas = fromLonLat([nuevaLong, nuevaLat]);
          this.mapa.getView().setCenter(coordenadas);
        }
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
    console.log('Verificando colisiones...');
    if (!this.latitud || !this.longitud) {
      console.log('Posición no definida aún');
      return;
    }
    this.firebaseService.listaBalls.forEach((ball, id) => {


      console.log(`Revisando ball ${id} de owner ${ball.owner} y yo yosy ${this.firebaseService.authid}`);
      if (typeof ball.lat === 'number' && typeof ball.long === 'number' && ball.owner) {
        const distancia = this.calcularDistancia(this.latitud!, this.longitud!, ball.lat, ball.long);
        console.log(`Distancia a ball ${id}: ${distancia} metros`);
        if (distancia < 5 && ball.owner !== this.firebaseService.authid) { 
          console.log(`¡Consumir ball ${id}!`);
          this.ConsumirBall(id);
        }
      } else {
        console.warn(`BALL inválida ID ${id}`, ball);
      }
    });
  }

  ConsumirBall(id: string) {
    // Elimina la BALL de la base de datos
    this.firebaseService.eliminarBall(id);

    // Verifica que el jugador esté definido antes de sumar puntos
    if (this.firebaseService.jugadorActual) {
      // Suma un punto al jugador local
      this.firebaseService.jugadorActual.puntos += 1;

      // Actualiza los puntos en la base de datos
      this.firebaseService.setPuntos(this.firebaseService.jugadorActual.puntos);
      this.vibracion.vibrarLigero(); 
      // Log para debug
      console.log(`¡Colisión con BALL ${id},  Puntos: ${this.firebaseService.jugadorActual.puntos}`);
    }
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




    async editarPerfil() {
    const modal = await this.modalCtrl.create({
      component: JugadoresComponent,
      componentProps: {
        nickActual: this.firebaseService.jugadorActual?.seteo.nick,
        colorActual: this.firebaseService.jugadorActual?.seteo.color,
        iconoActual: this.firebaseService.jugadorActual?.seteo.icono 
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
        const perfilActualizado = await this.firebaseService.obtenerPerfil(user.uid);
        this.firebaseService.jugadorActual = perfilActualizado;
      }
    }
}
}