import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { OcultarPublicidad, showBannerMenu } from 'src/componentes/AdMob/publicidad';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class MenuPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    showBannerMenu();
  }

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
