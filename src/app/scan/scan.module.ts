import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScanPageRoutingModule } from './scan-routing.module';

import { ScanPage } from './scan.page';
import { ComponentesModule } from '../componentes/componentes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScanPageRoutingModule,
    ComponentesModule
  ],
  declarations: [ScanPage]
})
export class ScanPageModule {}
