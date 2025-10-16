import { Component, OnInit, OnDestroy } from '@angular/core'; // Importamos OnDestroy
import { Router, NavigationEnd } from '@angular/router'; // Importamos NavigationEnd
import { showBannerMenu } from 'src/componentes/AdMob/publicidad';
import { Subscription } from 'rxjs'; // Necesario para gestionar la suscripción
import { filter } from 'rxjs/operators'; // Necesario para filtrar eventos
import { BannerAdPosition } from '@capacitor-community/admob';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: false,
})
export class ScanPage implements OnInit, OnDestroy {
  private routerSubscription: Subscription = new Subscription();
  constructor(private router: Router) { }
  ngOnInit() {

    this.routerSubscription = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.includes('/scan')) {
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
    this.router.navigateByUrl('/home');
  }

  goToScanner() {
    this.router.navigateByUrl('/scan');
  }
   goToMenu() {
    this.router.navigateByUrl('/menu');
  }
}
