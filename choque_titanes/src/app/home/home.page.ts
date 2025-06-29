import { Component } from '@angular/core';
import {IonicModule} from '@ionic/angular'
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonicModule],
})
export class HomePage {
  constructor(private auth: AuthService) {}

  
}
