import { Injectable } from '@angular/core';
import { Database, ref, set, update, remove, push } from '@angular/fire/database';

@Injectable({ providedIn: 'root' })
export class FirebaseDbService {
  constructor(private db: Database) {}

  // ONLINE
  setOnline(uid: string) {
    return set(ref(this.db, `ONLINE/${uid}`), 1);
  }

  removeOnline(uid: string) {
    return remove(ref(this.db, `ONLINE/${uid}`));
  }

  // PERFIL
  setPerfil(uid: string, nick: string, icono: number, color: string) {
    return set(ref(this.db, `PERFILES/${uid}/seteo`), {
      nick,
      icono,
      color
    });
  }

  setPosicion(uid: string, lat: number, long: number) {
    return set(ref(this.db, `PERFILES/${uid}/pos`), {
      lat,
      long
    });
  }

  setPuntos(uid: string, puntos: number) {
    return set(ref(this.db, `PERFILES/${uid}/puntos`), puntos);
  }

  // BALLS
  crearBall(uid: string, lat: number, long: number) {
    const ballRef = push(ref(this.db, 'BALLS'));
    return set(ballRef, {
      owner: uid,
      lat,
      long
    });
  }

  eliminarBall(ballId: string) {
    return remove(ref(this.db, `BALLS/${ballId}`));
  }
}
