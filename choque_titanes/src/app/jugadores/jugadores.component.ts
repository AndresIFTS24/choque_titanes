import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { IonModal } from '@ionic/angular/standalone';
import { OverlayEventDetail } from '@ionic/core/components';

@Component({
  selector: 'app-jugadores',
  imports:[IonicModule,
    FormsModule,
  ],
  standalone: true,
  templateUrl: './jugadores.component.html',
  styleUrls: ['./jugadores.component.scss'],
})
export class JugadoresComponent  implements OnInit {

  name!: string;
  // imagenUno: string = 'https://images.piclumen.com/normal/20250628/01/926bffa049fa4929b6dbc7dd630ba79e.webp';
  // imagenDos: string = 'https://images.piclumen.com/normal/20250628/02/8dd44a019c3c442d8161a435bd01bdcc.webp';
  // imagenTres: string = 'https://images.piclumen.com/normal/20250628/02/947a99eb40e44c0fb44e63710220b593.webp';

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
    case 'avatar2':
      return this.imagenDos;
    case 'avatar3':
      return this.imagenTres;
    default:
      return '';
  }
  
}

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    console.log(this.iconos?.[2]);
    console.log(this.arrayJugadores);

  }
  @ViewChild(IonModal) modal!: IonModal;

  //message = 'This modal example uses triggers to automatically open a modal when the button is clicked.';


  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    const urlSeleccionada = this.obtenerUrlSeleccionada();
    this.message = `Nombre: ${this.name}, Color: ${this.opcionSeleccionada}, imagen: ${urlSeleccionada}`;
    this.arrayJugadores.push(this.jugador = {
  nombre: this.name,
  color: this.opcionSeleccionada,
  avatarUrl: this.obtenerUrlSeleccionada()
});
    console.log('✅ Datos:', this.name, this.opcionSeleccionada, urlSeleccionada);
    console.log(this.arrayJugadores);
    this.limipiarCampos();
    return this.modalCtrl.dismiss(this.name, 'confirm');
  }
  
  limipiarCampos(){
  this.name = '';
  this.opcionSeleccionada = '';
  this.message = '';
  this.avatarSeleccionado = '';
  }
  // cancel() {
  //   this.modal.dismiss(null, 'cancel');
  // }

  // confirm() {
  //   this.modal.dismiss(this.name, 'confirm');
  // }

  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    if (event.detail.role === 'confirm') {
      this.message = `Hello, ${event.detail.data}!`;
    }
  }
}
