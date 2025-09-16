import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as QRCode from 'qrcode';
import { Dialog } from '@capacitor/dialog';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { Clipboard } from '@capacitor/clipboard';   // ✅ Importar Clipboard

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

  constructor(private platform: Platform, private router: Router) { }

  async ngOnInit() {
    await this.platform.ready();
    this.initializeAdMob();
  }

  ngOnDestroy() {
    AdMob.hideBanner();
  }

  async initializeAdMob() {
    try {
      await AdMob.initialize();
      console.log('AdMob initialized successfully');

      (AdMob as any).addListener('bannerAdLoaded', () => {
        const contentEl = document.getElementById('main-content');
        if (contentEl) {
          contentEl.classList.add('with-ad-padding');
        }
      });

      (AdMob as any).addListener('bannerAdFailedToLoad', () => {
        const contentEl = document.getElementById('main-content');
        if (contentEl) {
          contentEl.classList.remove('with-ad-padding');
        }
      });

      await AdMob.showBanner({
        adId: 'ca-app-pub-3168726036346781/9507429127',
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: true,
      });

      console.log('Banner ad should be visible now');
    } catch (error) {
      console.error('AdMob initialization or showBanner failed:', error);
    }
  }

  // ✅ Nuevo método usando Capacitor Clipboard
  async pegarTexto() {
    try {
      const { value } = await Clipboard.read();
      this.qrData = value ?? '';
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
        message: 'No se pudo acceder al portapapeles.',
      });
    }
  }

  // ✅ Método extra para copiar texto
  async copiarTexto() {
    try {
      if (this.qrData.trim().length === 0) {
        await Dialog.alert({
          title: 'Atención',
          message: 'No hay texto para copiar.',
        });
        return;
      }
      await Clipboard.write({
        string: this.qrData,
      });
      await Dialog.alert({
        title: 'Copiado',
        message: 'Texto copiado al portapapeles.',
      });
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  }

  async generateQR() {
    try {
      const options = {
        color: {
          dark: this.colorDark,
          light: this.colorLight,
        }
      };
      this.qrImage = await QRCode.toDataURL(this.qrData, options);
    } catch (err) {
      await Dialog.alert({
        title: 'Error',
        message: 'Ingrese un enlace válido',
      });
    }
  }

  limpiarCampos() {
    this.qrData = '';
    this.qrImage = '';
    this.colorDark = '#000000';
    this.colorLight = '#ffffff';
  }

  async shareQR() {
    try {
      await AdMob.prepareInterstitial({
        adId: 'ca-app-pub-3168726036346781/9858782916',
        isTesting: this.ModoDesarrollo,
      });

      const adClosed = new Promise<void>((resolve) => {
        (AdMob as any).addListener('interstitialAdDismissed', () => {
          resolve();
        });
      });

      await AdMob.showInterstitial();
      await adClosed;

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

    } catch (error) {
      console.log(error);
    }
  }

  async downloadQR() {
    await this.showInterstitialAd();

    const base64 = this.qrImage.split(',')[1];

    try {
      const permResult = await Filesystem.requestPermissions();
      if (permResult.publicStorage !== 'granted') {
        await Dialog.alert({
          title: 'Permiso denegado',
          message: 'Se necesita permiso para guardar archivos en el almacenamiento.',
        });
        return;
      }

      const result = await Filesystem.writeFile({
        path: `qr-code-${Date.now()}.png`,
        data: base64,
        directory: Directory.Documents,
      });

      await Dialog.alert({
        title: 'Éxito',
        message: `Código QR guardado exitosamente.\n\nRuta:\n${result.uri}`,
      });
    } catch (error) {
      await Dialog.alert({
        title: 'Error',
        message: 'No se pudo guardar el código QR.',
      });
    }
  }

  async showInterstitialAd() {
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-3168726036346781/9858782916',
      isTesting: this.ModoDesarrollo,
    });

    (AdMob as any).addListener('interstitialAdDismissed', () => { });

    await AdMob.showInterstitial();
  }

  goToMenu() {
    this.router.navigateByUrl('/menu');
  }

  goToGenerator() {
    this.router.navigateByUrl('/home');
  }

  goToScanner() {
    this.router.navigateByUrl('/scan');
  }
}
