import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createUserWithEmailAndPassword, onAuthStateChanged,sendEmailVerification, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';
import { FirebaseDbService } from './firebase-db.service';
import { FirebaseApp } from '@angular/fire/app';
import { ModalController } from '@ionic/angular';
import { JugadoresComponent } from '../jugadores/jugadores.component';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private usuarioActual: User | null = null;

  constructor(private auth: Auth, private router: Router, private firebaseDb:FirebaseDbService,private modalCtrl: ModalController) {
    onAuthStateChanged(this.auth, (usuario) => this.usuarioActual= usuario) // escucha cualquier cambio en el estado de autenticacion
  }

  // Método para abrir el modal de configuración de perfil
  async abrirModalConfiguracionPerfil() {
    const modal = await this.modalCtrl.create({
      component: JugadoresComponent,
      backdropDismiss: false, //El modal no se puede cerrar tocando afuera. Ideal para forzar al usuario a completar su perfil antes de seguir
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.9 //Al abrirse, el modal ocupa el 90% de la pantalla.
    });
    await modal.present();
  }
  async registrar(email: string, password:string){
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await sendEmailVerification(cred.user);
    alert('Verifica tu correo electrónico antes de iniciar sesión');
    await this.abrirModalConfiguracionPerfil();
  }
     //metodo Iniciar sesion
  async iniciarSesion(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    if(!cred.user.emailVerified) {
      await signOut(this.auth);
      throw new Error('Correo no verificado');
    }

    const perfil = await this.firebaseDb.obtenerPerfil(cred.user.uid);

    if (perfil != null) {
      this.router.navigate(['/mapa']);
    } else {
      // Abrir modal para configurar perfil
      await this.abrirModalConfiguracionPerfil()
    }
    
  }
   //metodo cerrar sesion
  async cerrarSesion() {
    await signOut(this.auth);
    this.router.navigate(['/login'])
  }

  estaLogueado():boolean {
    return !!this.usuarioActual && this.usuarioActual.emailVerified
  }
}
