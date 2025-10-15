import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OcultarPublicidad } from 'src/componentes/AdMob/publicidad';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone:false
})
export class FooterComponent  implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {}

  goToGenerator() { 
     OcultarPublicidad();
    this.router.navigateByUrl('/home'); 
  }
  goToScanner() { 
     OcultarPublicidad();
    this.router.navigateByUrl('/scan'); 
  }
  goToMenu() { 
     OcultarPublicidad();
    this.router.navigateByUrl('/menu'); 
  }

}
