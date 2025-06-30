import { Injectable, NgZone } from '@angular/core';
import {
  Database,
  ref,
  set,
  get,
  remove,
  push,
  onDisconnect,
  onChildAdded,
  onChildRemoved,
  onChildChanged,
} from '@angular/fire/database';
import { JUGADOR, BALL } from './models';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirebaseDbService {
  authid: string = 'PROVISORIO_AUTH_UID'; // Cambiar por UID real al loguearse
  jugadorActual: JUGADOR | null = null;
  listaJugadores: Map<string, JUGADOR> = new Map();
  listaBalls: Map<string, BALL> = new Map();

  private ballsSubject = new BehaviorSubject<Map<string, BALL>>(new Map());
  public obsBalls: Observable<Map<string, BALL>> = this.ballsSubject.asObservable();

  constructor(private db: Database, private ngZone: NgZone) {}

  Conectar_al_Mapa() {
    this.setOnline()
      .then(() => {
        this.subscribeToOnlineUsers();
        this.subscribeToBalls();
      })
      .catch((err) => console.error('Error al setear online:', err));
  }

  async setOnline() {
    try {
      const userRef = ref(this.db, `ONLINE/${this.authid}`);
      onDisconnect(userRef).remove();
      await set(userRef, 1);
    } catch (err) {
      console.error('Error en setOnline:', err);
    }
  }

  removeOnline() {
    return remove(ref(this.db, `ONLINE/${this.authid}`));
  }

  subscribeToOnlineUsers() {
    const onlineRef = ref(this.db, 'ONLINE');

    onChildAdded(onlineRef, (snapshot) => {
      this.ngZone.run(() => {
        const uid = snapshot.key!;
        if (!this.listaJugadores.has(uid)) {
          const jugadorBasico: JUGADOR = {
            SETEO: { Nick: '', Icono: 0, Color: '#000000' },
            POS: { lat: 0, long: 0 },
            PUNTOS: 0,
          };
          this.listaJugadores.set(uid, jugadorBasico);
          console.log(`🟢 Usuario conectado agregado: ${uid}`);
          this.cargarPerfil_Online(uid);
        }
      });
    });

    onChildRemoved(onlineRef, (snapshot) => {
      this.ngZone.run(() => {
        const uid = snapshot.key!;
        if (this.listaJugadores.has(uid)) {
          this.listaJugadores.delete(uid);
          console.log(`🔴 Usuario desconectado eliminado: ${uid}`);
        }
      });
    });
  }

  async obtenerPerfil(uid: string): Promise<JUGADOR | null> {
    try {
      const perfilRef = ref(this.db, `PERFILES/${uid}`);
      this.authid = uid;

      const snapshot = await get(perfilRef);
      if (snapshot.exists()) {
        const datos: JUGADOR = snapshot.val();
        this.jugadorActual = datos;
        console.log(`📥 Perfil obtenido de ${uid}:`, datos);
        return datos;
      } else {
        console.warn(`⚠️ No se encontró perfil para ${uid}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error al obtener perfil de ${uid}:`, error);
      return null;
    }
  }

  setConfig(nick: string, icono: number, color: string) {
    return set(ref(this.db, `PERFILES/${this.authid}/SETEO`), {
      Nick: nick,
      Icono: icono,
      Color: color,
    });
  }

  setPosicion(lat: number, long: number) {
    return set(ref(this.db, `PERFILES/${this.authid}/POS`), {
      lat,
      long,
    });
  }

  setPuntos(puntos: number) {
    return set(ref(this.db, `PERFILES/${this.authid}/PUNTOS`), puntos);
  }

  cargarPerfil_Online(uid: string) {
    const perfilRef = ref(this.db, `PERFILES/${uid}`);

    get(perfilRef)
      .then((snapshot) => {
        this.ngZone.run(() => {
          if (snapshot.exists()) {
            const datos: JUGADOR = snapshot.val();
            this.listaJugadores.set(uid, datos);
            console.log(`✅ Perfil de ${uid} cargado:`, datos);
            this.subscribeToPerfilChanges(uid);
          } else {
            console.warn(`⚠️ No se encontró perfil para ${uid}`);
          }
        });
      })
      .catch((error) => {
        console.error(`❌ Error al cargar perfil de ${uid}:`, error);
      });
  }

  subscribeToPerfilChanges(uid: string) {
    const perfilRef = ref(this.db, `PERFILES/${uid}`);

    onChildChanged(perfilRef, (snapshot) => {
      this.ngZone.run(() => {
        const propiedad = snapshot.key!;
        const nuevoValor = snapshot.val();

        const jugador = this.listaJugadores.get(uid);
        if (!jugador) {
          console.warn(`Jugador ${uid} no encontrado en listaJugadores`);
          return;
        }

        switch (propiedad) {
          case 'SETEO':
            jugador.SETEO = nuevoValor;
            console.log(`🎨 SETEO actualizado (${uid}):`, nuevoValor);
            break;
          case 'POS':
            jugador.POS = nuevoValor;
            console.log(`📍 POS actualizado (${uid}):`, nuevoValor);
            break;
          case 'PUNTOS':
            jugador.PUNTOS = nuevoValor;
            console.log(`🏅 PUNTOS actualizado (${uid}):`, nuevoValor);
            break;
          default:
            console.log(`ℹ️ Cambio en ${propiedad} (${uid}):`, nuevoValor);
            break;
        }

        this.listaJugadores.set(uid, jugador);
      });
    });
  }

  crearBall(lat: number, long: number) {
    const ballRef = push(ref(this.db, 'BALLS'));
    return set(ballRef, {
      OWNER: this.authid,
      lat,
      long,
    });
  }

  eliminarBall(ballId: string) {
    return remove(ref(this.db, `BALLS/${ballId}`));
  }

  subscribeToBalls() {
    const ballsRef = ref(this.db, 'BALLS');

    onChildAdded(ballsRef, (snapshot) => {
      this.ngZone.run(() => {
        const id = snapshot.key!;
        const ballData = snapshot.val();

        if (
          ballData &&
          typeof ballData === 'object' &&
          'lat' in ballData &&
          'long' in ballData &&
          'OWNER' in ballData
        ) {
          this.listaBalls.set(id, ballData);
          this.emitBalls();
          console.log(`⚪ BALL agregada [${id}]:`, ballData);
        } else {
          console.warn(`⚠️ BALL inválida ignorada:`, ballData);
        }
      });
    });

    onChildRemoved(ballsRef, (snapshot) => {
      this.ngZone.run(() => {
        const id = snapshot.key!;
        if (this.listaBalls.has(id)) {
          this.listaBalls.delete(id);
          this.emitBalls();
          console.log(`🗑️ BALL eliminada [${id}]`);
        }
      });
    });
  }

  private emitBalls() {
    this.ballsSubject.next(new Map(this.listaBalls));
  }
}
