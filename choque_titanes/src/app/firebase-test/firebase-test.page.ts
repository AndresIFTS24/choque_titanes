import { Component } from '@angular/core';
import { FirebaseDbService } from '../services/firebase-db.service';
import { IonHeader, IonInput } from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-firebase-test',
  templateUrl: './firebase-test.page.html',
  styleUrls: ['./firebase-test.page.scss'], // podés comentar si no tenés archivo scss

  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class FirebaseTestPage {
    
  uid = 'TESTUID';
  lat = -34.6;
  long = -58.4;
  nick = 'Rodrigo';
  icono = 1;
  color = '#FF00FF';
  ballId = '';

  msgSuccess = '';
  msgError = '';

  constructor(private db: FirebaseDbService) {}

  setOnline() {
    this.clearMessages();
    this.db.setOnline(this.uid)
      .then(() => this.msgSuccess = 'Set Online OK')
      .catch(e => this.msgError = e.message);
  }

  removeOnline() {
    this.clearMessages();
    this.db.removeOnline(this.uid)
      .then(() => this.msgSuccess = 'Remove Online OK')
      .catch(e => this.msgError = e.message);
  }

  setPosicion() {
    this.clearMessages();
    this.db.setPosicion(this.uid, this.lat, this.long)
      .then(() => this.msgSuccess = 'Posición actualizada')
      .catch(e => this.msgError = e.message);
  }

  setPerfil() {
    this.clearMessages();
    this.db.setConfig(this.uid, this.nick, this.icono, this.color)
      .then(() => this.msgSuccess = 'Perfil guardado')
      .catch(e => this.msgError = e.message);
  }

  setPuntos() {
    this.clearMessages();
    this.db.setPuntos(this.uid, 10)
      .then(() => this.msgSuccess = 'Puntos actualizados')
      .catch(e => this.msgError = e.message);
  }

  crearBall() {
    this.clearMessages();
    this.db.crearBall(this.uid, this.lat, this.long)
      .then(() => this.msgSuccess = 'Ball creada')
      .catch(e => this.msgError = e.message);
  }

  eliminarBall() {
    this.clearMessages();
    if (!this.ballId) {
      this.msgError = 'Debe ingresar Ball ID';
      return;
    }
    this.db.eliminarBall(this.ballId)
      .then(() => this.msgSuccess = 'Ball eliminada')
      .catch(e => this.msgError = e.message);
  }

  clearMessages() {
    this.msgSuccess = '';
    this.msgError = '';
  }
  
}



