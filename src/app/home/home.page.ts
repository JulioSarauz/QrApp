import { Component, OnInit, OnDestroy } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as QRCode from 'qrcode';
import { Dialog } from '@capacitor/dialog';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { Clipboard } from '@capacitor/clipboard';
import { OcultarPublicidad, showBannerMenu, showInterstitialAd } from 'src/componentes/AdMob/publicidad';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BannerAdPosition } from '@capacitor-community/admob';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage implements OnInit, OnDestroy {
  private routerSubscription: Subscription = new Subscription();
   qrData: string = '';
  qrImage: string = '';
  colorDark = '#000000';
  colorLight = '#ffffff';
  ModoDesarrollo: boolean = true;
  errorClipboard: string | null = null;
  errorGeneral: string | null = null;

  constructor(private router: Router, private platform:Platform, private toastController: ToastController) { }
  ngOnInit() {
    this.routerSubscription = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.includes('/home')) {
        showBannerMenu(BannerAdPosition.BOTTOM_CENTER);
      }
    });
  }
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

 
  async pegarTexto() {
    try {
      let value = '';
      if (!this.platform.is('capacitor')) {
        value = prompt('Pega tu texto aquí:') || '';
      } else {
        const clipboard = await Clipboard.read();
        value = clipboard.value ?? '';
      }
      this.qrData = value;
      if (!this.qrData) {
        await Dialog.alert({
          title: 'Portapapeles vacío',
          message: 'No se encontró texto en el portapapeles.',
        });
      }
    } catch (err) {
      console.error('Error al leer el portapapeles:', err);
      await Dialog.alert({
        title: 'Error',
        message: 'Copia primero un texto.',
      });
    }
  }
  async copiarTexto() {
    this.errorClipboard = null;
    try {
      if (!this.qrData.trim()) {
        this.errorClipboard = 'No hay texto para copiar.';
        return;
      }
      await Clipboard.write({ string: this.qrData });
      this.errorClipboard = 'Texto copiado al portapapeles.';
    } catch (err: any) {
      console.error('Clipboard write error:', err);
      this.errorClipboard = 'Error al copiar texto: ' + (err?.message || err);
    }
  }

async generateQR() {
  try {
    const options = { color: { dark: this.colorDark, light: this.colorLight } };
    this.qrImage = await QRCode.toDataURL(this.qrData, options);
  } catch (err: any) {
    const errorMsg = 'Error generando QR: ' + (err?.message || err);
    console.error(errorMsg);

    const toast = await this.toastController.create({
      message: errorMsg,
      duration: 3000,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();
  }
}
  limpiarCampos() {
    this.qrData = '';
    this.qrImage = '';
    this.colorDark = '#000000';
    this.colorLight = '#ffffff';
    this.errorClipboard = null;
    this.errorGeneral = null;
  }
  async shareQR() {
    this.errorGeneral = null;
    try {
      await showInterstitialAd();
      const base64 = this.qrImage.split(',')[1];
      const fileName = `qr-code-${Date.now()}.png`;
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({
        title: 'Mi Código QR',
        text: 'QR generado por QR generador...',
        url: savedFile.uri,
        dialogTitle: 'Compartir código QR con…',
      });
    } catch (err: any) {
      console.error('Share QR error:', err);
      this.errorGeneral = 'Error compartiendo QR: ' + (err?.message || err);
    }
  }
  async downloadQR() {
    this.errorGeneral = null;
    try {
      await showInterstitialAd();
      const base64 = this.qrImage.split(',')[1];
      const permResult = await Filesystem.requestPermissions();
      if (permResult.publicStorage !== 'granted') {
        this.errorGeneral = 'Permiso denegado: no se puede guardar archivo.';
        return;
      }
      const result = await Filesystem.writeFile({
        path: `qr-code-${Date.now()}.png`,
        data: base64,
        directory: Directory.Documents,
      });
      this.errorGeneral = `Código QR guardado exitosamente en: ${result.uri}`;
    } catch (err: any) {
      console.error('Download QR error:', err);
      this.errorGeneral = 'Error guardando QR: ' + (err?.message || err);
    }
  }

  goToMenu() {
    OcultarPublicidad();
    this.router.navigateByUrl('/menu');
  }
  goToGenerator() {
    OcultarPublicidad();
    this.router.navigateByUrl('/home');
  }
  goToScanner() {
    OcultarPublicidad();
    this.router.navigateByUrl('/scan');
  }
}
