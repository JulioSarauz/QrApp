import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { showBannerMenu } from 'src/componentes/AdMob/publicidad';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class MenuPage implements OnInit {

  constructor(private router: Router) { }
  async ngOnInit() {
    showBannerMenu();
  }

  //Esto se ejecuta antes de salir de la pantalla actual
  ionViewWillLeave() {
    AdMob.hideBanner();
  }


  goToGenerator() { this.router.navigateByUrl('/home'); }
  goToScanner() { this.router.navigateByUrl('/scan'); }
  goToMenu() { this.router.navigateByUrl('/menu'); }

}
