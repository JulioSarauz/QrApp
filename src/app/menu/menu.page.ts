import { Component, OnInit, OnDestroy } from '@angular/core'; // Importamos OnDestroy
import { Router, NavigationEnd } from '@angular/router'; // Importamos NavigationEnd
import { OcultarPublicidad, showBannerMenu } from 'src/componentes/AdMob/publicidad';
import { Subscription } from 'rxjs'; // Necesario para gestionar la suscripción
import { filter } from 'rxjs/operators'; // Necesario para filtrar eventos
import { BannerAdPosition } from '@capacitor-community/admob';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
// Implementamos OnDestroy para limpiar la suscripción
export class MenuPage implements OnInit, OnDestroy {
  private routerSubscription: Subscription = new Subscription();
  constructor(private router: Router) { }
  ngOnInit() {

    this.routerSubscription = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.includes('/menu')) {
        showBannerMenu(BannerAdPosition.BOTTOM_CENTER);
      }
    });
  }
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
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
