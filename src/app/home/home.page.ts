import { Component } from '@angular/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as QRCode from 'qrcode';
import { Dialog } from '@capacitor/dialog';
import { Share } from '@capacitor/share';
// <meta-data
//       android:name="com.google.android.gms.ads.APPLICATION_ID"
//       android:value="ca-app-pub-3940256099942544~3347511713"/>
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
      adId: 'ca-app-pub-3168726036346781/9507429127',
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: false, // ⚠️ IMPORTANTE: Desactiva el modo test en producción
    });
  }
  async generateQR() {
    try{
      const options = {
        color: {
          dark: this.colorDark,
          light: this.colorLight,
        }
      };
      QRCode.toDataURL(this.qrData, options, async (err, url) => {
        if (err) {
          await Dialog.alert({
            title: 'Error',
            message: 'Ingrese un enlace válido',
          });
          return;
        }
        this.qrImage = url;
      });
    }catch(Err){
      await Dialog.alert({
        title: 'Error',
        message: 'Verifique la información ingresada',
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
        adId: 'ca-app-pub-3940256099942544/1033173712',
        isTesting: true,
      });
  
      // Esperar a que se cierre el anuncio antes de continuar
      const adClosed = new Promise<void>((resolve) => {
        (AdMob as any).addListener('interstitialAdDismissed', () => {
          resolve();
        });
      });
  
      await AdMob.showInterstitial();
      await adClosed; // Esperar cierre del anuncio
  
      const base64 = this.qrImage.split(',')[1];
      const fileName = `qr-code-${Date.now()}.png`;
  
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
  
      await Share.share({
        title: 'Mi Código QR',
        text: 'Este es el código QR generado',
        url: savedFile.uri,
        dialogTitle: 'Compartir código QR con…',
      });
  
    } catch (error) {
      await Dialog.alert({
        title: 'Error',
        message: 'No se pudo compartir el código QR.',
      });
    }
  }

  async downloadQR() {
    await this.showInterstitialAd();
  
    const base64 = this.qrImage.split(',')[1];
  
    try {
      // ✅ Solicitar permisos
      const permResult = await Filesystem.requestPermissions();
      if (permResult.publicStorage !== 'granted') {
        await Dialog.alert({
          title: 'Permiso denegado',
          message: 'Se necesita permiso para guardar archivos en el almacenamiento.',
        });
        return;
      }
  
      // ✅ Guardar en carpeta Documentos
      const result = await Filesystem.writeFile({
        path: `qr-code-${Date.now()}.png`,
        data: base64,
        directory: Directory.Documents,
      });
  
      // ✅ Mostrar mensaje
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
      isTesting: false,
    });    

    (AdMob as any).addListener('interstitialAdDismissed', () => {
    });

    await AdMob.showInterstitial();
  }
}
