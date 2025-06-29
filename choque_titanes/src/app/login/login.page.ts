import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validator, Validators } from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ToastController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule]
})

export class LoginPage {
  
  private fb=inject(FormBuilder)
  private auth=inject(AuthService)
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  })

  passwordVisible= false;

  togglePassword() {
    this.passwordVisible = !this.passwordVisible
  }

  async onSubmit() {
    if(this.loginForm.valid) {
      const {email, password} = this.loginForm.value

      try {
        await this.auth.iniciarSesion(email!, password!)
        this.mostrarToast('Inicio de sesión exitoso', 'success');
      } catch (error: any) {
      const mensaje = this.traducirError(error.code);
      this.mostrarToast(mensaje, 'danger');
      console.error(error);

      

      }
    }else {
      this.loginForm.markAllAsTouched();
      this.mostrarToast('Formulario inválido', 'danger');
    }
  }

  async mostrarToast(mensaje: string, color: string = 'warning') {
  const toast = await this.toastController.create({
    message: mensaje,
    duration: 3000,
    position: 'bottom',
    color: color
  });

  await toast.present();
}
async registrar() {
  if (this.loginForm.valid) {
    const { email, password } = this.loginForm.value;

    try {
      await this.auth.registrar(email!, password!);
      this.mostrarToast('Usuario registrado con éxito', 'success');

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        this.mostrarToast('El usuario ya existe', 'warning');
      } else {
        this.mostrarToast('Error al registrar: ' + error.message, 'danger');
      }
    }
  } else {
    this.loginForm.markAllAsTouched();
    this.mostrarToast('Formulario inválido', 'danger');
  }
}

private traducirError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'Usuario no registrado. Verifica tu email.';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta. Intentá de nuevo.';
    case 'auth/invalid-email':
      return 'El email no es válido.';
    case 'auth/invalid-credential':
      return 'Email o contraseña incorrectos.';
    case 'auth/missing-password':
      return 'Falta ingresar la contraseña.';
    case 'auth/email-already-in-use':
      return 'El usuario ya existe.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}

ionViewWillEnter() { // metodo que limpia automaticamente cada vez que la vista esta por entrar
  this.loginForm.reset();
  this.passwordVisible = false;
}

}
