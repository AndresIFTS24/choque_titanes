

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { IonModal } from '@ionic/angular/standalone';
import { OverlayEventDetail } from '@ionic/core/components';
import { Router } from '@angular/router';
import { FirebaseDbService } from '../services/firebase-db.service';


@Component({
  selector: 'app-jugadores',
  standalone:true,
  imports:[FormsModule, IonicModule],
  templateUrl: './jugadores.component.html',
  styleUrls: ['./jugadores.component.scss'],
})
export class JugadoresComponent  implements OnInit {



  @Input() nickActual?: string;
  @Input() colorActual?: string;
  @Input() iconoActual?: number;
  
  name!: string;

  imagenUno: string = 'assets/icon/avatar-1.png';
  imagenDos: string = 'assets/icon/avatar-2.png';
  imagenTres: string = 'assets/icon/avatar-3.png';

  arrayJugadores: any[]=[];
  opcionSeleccionada: string = '';
  message: string = '';
  avatarSeleccionado: string = '';
  jugador: { nombre: string; color: string; avatarUrl: any; } | undefined;

iconos:| { imagenAvatar: string } [] | undefined = [
      { imagenAvatar: 'assets/icon/avatar-1.png' },
      { imagenAvatar: 'assets/icon/avatar-2.png' },
      { imagenAvatar: 'assets/icon/avatar-3.png' },
    ];
  
obtenerUrlSeleccionada(): any {
  switch (this.avatarSeleccionado) {
    case 'avatar1':
      return this.iconos?.[0];

      return this.imagenUno;
    case 'avatar2':
      return this.imagenDos;
    case 'avatar3':
      return this.imagenTres;
    default:
      return '';
  }

}

  constructor(private modalCtrl: ModalController,  private auth: Auth, private firebaseDb: FirebaseDbService, private router: Router) {}

  ngOnInit() {
    console.log(this.iconos?.[2]);
    console.log(this.arrayJugadores);

        if (this.nickActual) {
      this.name = this.nickActual;
      this.opcionSeleccionada  = this.colorActual ?? '';

      switch (this.iconoActual) {
        case 1:
          this.avatarSeleccionado = 'avatar1';
          break;
        case 2:
          this.avatarSeleccionado = 'avatar2';
          break;
        case 3:
          this.avatarSeleccionado = 'avatar3';
          break;
        default:
          this.avatarSeleccionado = 'avatar1';
      }
    }
  }
  @ViewChild(IonModal) modal!: IonModal;



  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }
  
  obtenerIconoSeleccionado(): number {
  switch (this.avatarSeleccionado) {
    case 'avatar1':
      return 1;
    case 'avatar2':
      return 2;
    case 'avatar3':
      return 3;
    default:
      return 1;
    
  }
}
getAvatarUrl(icono: number): string {
  switch (icono) {
    case 1:
      return this.imagenUno;
    case 2:
      return this.imagenDos;
    case 3:
      return this.imagenTres;
    default:
      return '';
  }
}

async confirm() {
  const icono = this.obtenerIconoSeleccionado();
  const avatarUrl = this.getAvatarUrl(icono);
  const user = this.auth.currentUser;

  if (!user) {
    alert('No hay usuario autenticado.');
    return;
  }

  const jugador = {
    nombre: this.name,
    color: this.opcionSeleccionada,
    avatarUrl: avatarUrl
  };

  this.message = `Nombre: ${this.name}, Color: ${this.opcionSeleccionada}, Imagen: ${avatarUrl}`;
  this.arrayJugadores.push(jugador);

  try {
    
    await this.firebaseDb.setConfig(
      this.name,
      icono,
      this.opcionSeleccionada
    );

    console.log('✅ Perfil guardado en Firebase con setConfig');
    console.log(this.arrayJugadores);

    this.limipiarCampos();

    
    console.log('🟢 Confirmación exitosa, cerrando modal y navegando');
    this.modalCtrl.dismiss(this.name, 'confirm');

  } catch (error) {
    console.error('❌ Error al guardar en Firebase:', error);
    alert('No se pudo guardar el perfil');
    return;
  }
}

  
  limipiarCampos(){
  this.name = '';
  this.opcionSeleccionada = '';
  this.message = '';
  this.avatarSeleccionado = '';
  }


  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    if (event.detail.role === 'confirm') {
      this.message = `Hello, ${event.detail.data}!`;
    }
  }

}