import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CabeceraComponent } from './cabecera/cabecera.component';
import { FooterComponent } from './footer/footer.component';

@NgModule({
  declarations: [
    CabeceraComponent,
    FooterComponent
   ],
  imports: [CommonModule, IonicModule],
  exports: [
    CabeceraComponent,
    FooterComponent
    ]
})
export class ComponentesModule {}