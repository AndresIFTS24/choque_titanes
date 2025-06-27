import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { FirebaseTestPageRoutingModule } from './firebase-test-routing.module';

import { FirebaseTestPage } from './firebase-test.page';
import { FirebaseDbService } from '../services/firebase-db.service';


@NgModule({

  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FirebaseTestPageRoutingModule, FirebaseTestPage
  ],
  providers: [FirebaseDbService]
})
export class FirebaseTestPageModule {}
