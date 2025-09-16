import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class MenuPage implements OnInit {

  ModoDesarrollo: boolean = true;

  constructor(private router: Router) { }

  async ngOnInit() {
    AdMob.hideBanner();
    await this.showBanner();
  }

  async showBanner() {
    try {
      console.log("mostrar");
      
      await AdMob.initialize();
      await AdMob.showBanner({
        adId: 'ca-app-pub-3168726036346781/9507429127', // tu adId
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.CENTER, // queda centrado entre opciones y footer
        isTesting: this.ModoDesarrollo,
      });
    } catch (err) {
      console.error('Error mostrando banner:', err);
    }
  }

  goToGenerator() {
    this.router.navigateByUrl('/home');
  }

  goToScanner() {
    this.router.navigateByUrl('/scan');
  }

  goToMenu() {
    this.router.navigateByUrl('/menu');
  }
}
