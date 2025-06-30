import { Injectable } from '@angular/core';
import { JUGADOR, SETEO, POS, BALL } from './models';

@Injectable({ providedIn: 'root' })
export class MapaBridgeService {
  // BALLS
  crearBall?: (id: string, data: BALL) => void;
  borrarBall?: (id: string) => void;

  // JUGADORES
  crear_jugador?: (uid: string, datos: JUGADOR) => void;
  borrarJugador?: (uid: string) => void;

  // MODIFICACIONES DE JUGADOR
  modjugador_seteo?: (uid: string, nuevoSeteo: SETEO) => void;
  modjugador_POS?: (uid: string, nuevaPos: POS) => void;
  modjugador_puntos?: (uid: string, nuevosPuntos: number) => void;
}
