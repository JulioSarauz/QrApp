import { Component, OnInit, OnDestroy } from '@angular/core'; // Importamos OnDestroy
import { Router, NavigationEnd } from '@angular/router'; // Importamos NavigationEnd
import { showBannerMenu, showInterstitialAd } from 'src/componentes/AdMob/publicidad';
import { Subscription } from 'rxjs'; // Necesario para gestionar la suscripción
import { filter } from 'rxjs/operators'; // Necesario para filtrar eventos
import { BannerAdPosition } from '@capacitor-community/admob';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';import { ViewChild, ElementRef } from '@angular/core';
import jsQR from 'jsqr'; // Librería para leer QR desde imagen
import { ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: false,
})
export class ScanPage implements OnInit, OnDestroy {
  private routerSubscription: Subscription = new Subscription();
  private codeReader:BrowserMultiFormatReader = new BrowserMultiFormatReader();
  ContenidoQrTexto:string = "";
  MostrarEnfoque:boolean = false;
   @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private router: Router, private toastController: ToastController) { }
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
async mostrarError(errorMsg: string) {
    const toast = await this.toastController.create({
      message: errorMsg,
      duration: 3000,
      color: 'danger',
      position: 'middle',
      cssClass: 'toast-error', 
    });
    await toast.present();
  }
async pedirPermisoCamara() {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted';
  }

  async EscanearQrCamara() {
    try {
      // Pedir permiso (solo si no está en web)
      if (Capacitor.getPlatform() !== 'web') {
        const permiso = await this.pedirPermisoCamara();
        if (!permiso) {
          await this.mostrarError('Permiso de cámara denegado.');
          return;
        }
      }

      this.MostrarEnfoque = true;

      // Iniciar escaneo con la cámara nativa
      const result = await BarcodeScanner.scan();

      this.MostrarEnfoque = false;

      if (result?.barcodes?.length > 0) {
        this.ContenidoQrTexto = result.barcodes[0].rawValue || '';
        console.log('QR detectado:', this.ContenidoQrTexto);
      } else {
        await this.mostrarError('No se detectó ningún código QR.');
      }

    } catch (error) {
      this.MostrarEnfoque = false;
      console.error('Error general:', error);
      await this.mostrarError('Error al escanear: ' + JSON.stringify(error));
    }
  }

  async NuevaSolicitudEscaneo() {
    this.ContenidoQrTexto = "";
    await showInterstitialAd();
  }
  esURL(texto: string): boolean {
    try {
      const url = new URL(texto);
      return true;
    } catch (_) {
      return false;
    }
  }

  copiarContenidoQr(): void {
  if (!this.ContenidoQrTexto) {
    console.warn('No hay contenido para copiar');
    return;
  }

  navigator.clipboard.writeText(this.ContenidoQrTexto)
    .then(() => {
      console.log('Contenido copiado al portapapeles');
      alert('✅ Texto copiado al portapapeles');
    })
    .catch(err => {
      console.error('Error al copiar:', err);
      alert('❌ No se pudo copiar el texto');
    });
}

 // Abrir selector de archivo al hacer clic
  cargarImagen(event: any) {
    this.fileInput.nativeElement.click();
  }

  // Leer QR de la imagen seleccionada
  leerQrImagen(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          this.ContenidoQrTexto = code.data;
          console.log('QR detectado:', this.ContenidoQrTexto);
        } else {
          alert('No se detectó ningún QR en la imagen');
        }
      };
    };
    reader.readAsDataURL(file);
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
