import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validator, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
export class LoginPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
