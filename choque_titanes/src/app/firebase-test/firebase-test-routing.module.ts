import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FirebaseTestPage } from './firebase-test.page';

const routes: Routes = [
  {
    path: '',
    component: FirebaseTestPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FirebaseTestPageRoutingModule {}
