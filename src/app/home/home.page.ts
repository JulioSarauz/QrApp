import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as QRCode from 'qrcode';
import { Dialog } from '@capacitor/dialog';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { Clipboard } from '@capacitor/clipboard';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {

  qrData: string = '';
  qrImage: string = '';
  colorDark = '#000000';
  colorLight = '#ffffff';
  ModoDesarrollo: boolean = true;

  errorClipboard: string | null = null;  // Para mostrar errores de portapapeles
  errorGeneral: string | null = null;    // Para otros errores generales

  constructor(private platform: Platform, private router: Router) { }

  async ngOnInit() {
    AdMob.hideBanner();
    await this.platform.ready();
    this.initializeAdMob();
  }

  ngOnDestroy() {
    AdMob.hideBanner();
  }

  // ----------------- AdMob -----------------
  async initializeAdMob() {
    try {
      await AdMob.initialize();

      (AdMob as any).addListener('bannerAdLoaded', () => {
        const contentEl = document.getElementById('main-content');
        if (contentEl) contentEl.classList.add('with-ad-padding');
      });

      (AdMob as any).addListener('bannerAdFailedToLoad', () => {
        const contentEl = document.getElementById('main-content');
        if (contentEl) contentEl.classList.remove('with-ad-padding');
      });

      await AdMob.showBanner({
        adId: 'ca-app-pub-3168726036346781/9507429127',
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: true,
      });

    } catch (error: any) {
      console.error('AdMob error:', error);
      this.errorGeneral = 'Error inicializando AdMob: ' + (error?.message || error);
    }
  }

  async showInterstitialAd() {
    try {
      await AdMob.prepareInterstitial({
        adId: 'ca-app-pub-3168726036346781/9858782916',
        isTesting: this.ModoDesarrollo,
      });

      (AdMob as any).addListener('interstitialAdDismissed', () => { });
      await AdMob.showInterstitial();
    } catch (err: any) {
      console.error('Interstitial error:', err);
      this.errorGeneral = 'Error mostrando anuncio intersticial: ' + (err?.message || err);
    }
  }

  // ----------------- Portapapeles -----------------
 async pegarTexto() {
  try {
    let value = '';

    // Solo para pruebas en navegador
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

  // ----------------- QR -----------------
  async generateQR() {
    this.errorGeneral = null;
    try {
      const options = { color: { dark: this.colorDark, light: this.colorLight } };
      this.qrImage = await QRCode.toDataURL(this.qrData, options);
    } catch (err: any) {
      console.error('QR generate error:', err);
      this.errorGeneral = 'Error generando QR: ' + (err?.message || err);
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
      await this.showInterstitialAd();

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
      await this.showInterstitialAd();

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

  // ----------------- Navegación -----------------
  goToMenu() { this.router.navigateByUrl('/menu'); }
  goToGenerator() { this.router.navigateByUrl('/home'); }
  goToScanner() { this.router.navigateByUrl('/scan'); }

}
