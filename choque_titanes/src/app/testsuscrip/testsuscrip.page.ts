import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirebaseDbService } from '../services/firebase-db.service';
import { MapaBridgeService } from '../services/mapa-bridge.service';
import { jugador, ball } from '../services/models';

@Component({
  selector: 'app-testsuscrip',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './testsuscrip.page.html',
  styleUrls: ['./testsuscrip.page.scss']
})
export class TestsuscripPage implements OnInit {

  jugadoresEnMapa: Map<string, jugador> = new Map();
  ballsEnMapa: Map<string, ball> = new Map();

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

  // ========= JUGADORES =========

  crearJugador(uid: string, jugador: jugador) {
    console.log("🧍 Jugador creado:", uid, jugador);
    this.jugadoresEnMapa.set(uid, jugador);
    this.jugadoresEnMapa = new Map(this.jugadoresEnMapa);
  }

  borrarJugador(uid: string) {
    console.log("🚫 Jugador eliminado:", uid);
    this.jugadoresEnMapa.delete(uid);
    this.jugadoresEnMapa = new Map(this.jugadoresEnMapa);
  }

  actualizarSeteoJugador(uid: string, nuevoSeteo: jugador['seteo']) {
    console.log("🎨 Seteo actualizado:", uid, nuevoSeteo);
    const jugador = this.jugadoresEnMapa.get(uid);
    if (jugador) {
      jugador.seteo = nuevoSeteo;
      this.jugadoresEnMapa = new Map(this.jugadoresEnMapa);
    }
  }

  actualizarPosJugador(uid: string, nuevaPos: jugador['pos']) {
    console.log("📍 Posición actualizada:", uid, nuevaPos);
    const jugador = this.jugadoresEnMapa.get(uid);
    if (jugador) {
      jugador.pos = nuevaPos;
      this.jugadoresEnMapa = new Map(this.jugadoresEnMapa);
    }
  }

  actualizarPuntosJugador(uid: string, nuevosPuntos: number) {
    console.log("⭐ Puntos actualizados:", uid, nuevosPuntos);
    const jugador = this.jugadoresEnMapa.get(uid);
    if (jugador) {
      jugador.puntos = nuevosPuntos;
      this.jugadoresEnMapa = new Map(this.jugadoresEnMapa);
    }
  }

  // ========= BALLS =========

  crearBall(id: string, data: ball) {
    console.log("🟢 Ball creada:", id, data);
    this.ballsEnMapa.set(id, data);
    this.ballsEnMapa = new Map(this.ballsEnMapa);
  }

  borrarBall(id: string) {
    console.log("🔴 Ball eliminada:", id);
    this.ballsEnMapa.delete(id);
    this.ballsEnMapa = new Map(this.ballsEnMapa);
  }

  // ========= GETTERS PARA EL TEMPLATE =========

  get jugadoresArray(): [string, jugador][] {
    return Array.from(this.jugadoresEnMapa.entries());
  }

  get ballsArray(): [string, ball][] {
    return Array.from(this.ballsEnMapa.entries());
  }

  trackByUid(index: number, item: [string, jugador]) {
    return item[0];
  }

  trackByBallId(index: number, item: [string, ball]) {
    return item[0];
  }
}
