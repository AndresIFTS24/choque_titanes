import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirebaseDbService } from '../services/firebase-db.service';
import { MapaBridgeService } from '../services/mapa-bridge.service';
import { JUGADOR, BALL } from '../services/models';

@Component({
  selector: 'app-testsuscrip',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './testsuscrip.page.html',
  styleUrls: ['./testsuscrip.page.scss']
})
export class TestsuscripPage implements OnInit {

  jugadoresEnMapa: Map<string, JUGADOR> = new Map();
  ballsEnMapa: Map<string, BALL> = new Map();

  constructor(
    private firebaseDbService: FirebaseDbService, 
    private mapaBridge: MapaBridgeService
  ) {}

  ngOnInit() {
    this.firebaseDbService.Conectar_al_Mapa();

    this.mapaBridge.crearBall = this.crearBall.bind(this);
    this.mapaBridge.borrarBall = this.borrarBall.bind(this);
    this.mapaBridge.crear_jugador = this.crearJugador.bind(this);
    this.mapaBridge.borrarJugador = this.borrarJugador.bind(this);
    this.mapaBridge.modjugador_seteo = this.actualizarSeteoJugador.bind(this);
    this.mapaBridge.modjugador_POS = this.actualizarPosJugador.bind(this);
    this.mapaBridge.modjugador_puntos = this.actualizarPuntosJugador.bind(this);
  }

  crearBall(id: string, data: BALL) {
    console.log("🟢 Ball creada:", id, data);
    this.ballsEnMapa.set(id, data);
  }

  borrarBall(id: string) {
    console.log("🔴 Ball eliminada:", id);
    this.ballsEnMapa.delete(id);
  }

  crearJugador(uid: string, jugador: JUGADOR) {
    console.log("🧍 Jugador creado:", uid, jugador);
    this.jugadoresEnMapa.set(uid, jugador);
  }

  borrarJugador(uid: string) {
    console.log("🚫 Jugador eliminado:", uid);
    this.jugadoresEnMapa.delete(uid);
  }

  actualizarSeteoJugador(uid: string, nuevoSeteo: JUGADOR['seteo']) {
    console.log("🎨 Seteo actualizado:", uid, nuevoSeteo);
    const jugador = this.jugadoresEnMapa.get(uid);
    if (jugador) {
      jugador.seteo = nuevoSeteo;
      this.jugadoresEnMapa.set(uid, jugador);
    }
  }

  actualizarPosJugador(uid: string, nuevaPos: JUGADOR['POS']) {
    console.log("📍 Posición actualizada:", uid, nuevaPos);
    const jugador = this.jugadoresEnMapa.get(uid);
    if (jugador) {
      jugador.POS = nuevaPos;
      this.jugadoresEnMapa.set(uid, jugador);
    }
  }

  actualizarPuntosJugador(uid: string, nuevosPuntos: number) {
    console.log("⭐ Puntos actualizados:", uid, nuevosPuntos);
    const jugador = this.jugadoresEnMapa.get(uid);
    if (jugador) {
      jugador.PUNTOS = nuevosPuntos;
      this.jugadoresEnMapa.set(uid, jugador);
    }
  }
}
