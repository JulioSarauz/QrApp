import { Component } from '@angular/core';
import { AdMob, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents } from '@capacitor-community/admob';
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
      adId: 'ca-app-pub-3168726036346781~1389890676', // Tu banner real
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

    const link = document.createElement('a');
    link.href = this.qrImage;
    link.download = 'qr-code.png';
    link.click();
  }

  async showInterstitialAd() {
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-3168726036346781~1389890676', // Tu interstitial real
      isTesting: true
    });

    (AdMob as any).addListener('interstitialAdDismissed', () => {
      console.log('Anuncio intersticial cerrado');
    });

    await AdMob.showInterstitial();
  }
}
