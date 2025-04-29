import { Component } from '@angular/core';
import { AdMob, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  qrData: string = '';
  qrImage: string = '';
  colorDark = '#000000';
  colorLight = '#ffffff';

  constructor() {
    this.initializeAdMob();
  }

  async initializeAdMob() {
    await AdMob.initialize();

    await AdMob.showBanner({
      adId: 'ca-app-pub-3940256099942544/6300978111',
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: true,
    });
  }

  generateQR() {
    const options = {
      color: {
        dark: this.colorDark,
        light: this.colorLight,
      }
    };
    QRCode.toDataURL(this.qrData, options, (err, url) => {
      if (err) {
        console.error(err);
        return;
      }
      this.qrImage = url;
    });
  }

  async downloadQR() {
    await this.showInterstitialAd(); // Mostrar anuncio antes de descargar
  
    try {
      const base64 = this.qrImage.split(',')[1]; // eliminar encabezado "data:image/png;base64,"
  
      const result = await Filesystem.writeFile({
        path: `qr-code-${Date.now()}.png`,
        data: base64,
        directory: Directory.Documents,
      });
  
      console.log('Archivo guardado en:', result.uri);
      alert('Código QR guardado en documentos.');
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  }

  async showInterstitialAd() {
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-3940256099942544/1033173712', 
      isTesting: true
    });

    (AdMob as any).addListener('interstitialAdDismissed', () => {
      console.log('Anuncio intersticial cerrado');
    });

    await AdMob.showInterstitial();
  }
}
