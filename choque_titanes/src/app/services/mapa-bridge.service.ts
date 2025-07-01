import { Injectable } from '@angular/core';
import { jugador, seteo, pos, ball } from './models';

@Injectable({ providedIn: 'root' })
export class MapaBridgeService {
  // BALLS
  crearBall?: (id: string, data: ball) => void;
  borrarBall?: (id: string) => void;

  // JUGADORES
  crear_jugador?: (uid: string, datos: jugador) => void;
  borrarJugador?: (uid: string) => void;

  // MODIFICACIONES DE JUGADOR
  modjugador_seteo?: (uid: string, nuevoSeteo: seteo) => void;
  modjugador_POS?: (uid: string, nuevaPos: pos) => void;
  modjugador_puntos?: (uid: string, nuevosPuntos: number) => void;
}
