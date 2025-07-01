import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createUserWithEmailAndPassword, onAuthStateChanged,sendEmailVerification, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';
import { FirebaseDbService } from './firebase-db.service';
import { FirebaseApp } from '@angular/fire/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private usuarioActual: User | null = null;

  constructor(private auth: Auth, private router: Router, private firebaseDb:FirebaseDbService) {
    onAuthStateChanged(this.auth, (usuario) => this.usuarioActual= usuario) // escucha cualquier cambio en el estado de autenticacion
  }
  async registrar(email: string, password:string){
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await sendEmailVerification(cred.user);
    alert('Verifica tu correo electrónico antes de iniciar sesión');
    //Abrir modal para config
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