import { Component, OnInit, OnDestroy } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as QRCode from 'qrcode';
import { Dialog } from '@capacitor/dialog';
import { Share } from '@capacitor/share';
import { Platform, LoadingController } from '@ionic/angular'; // 👈 Importar LoadingController
import { Router, NavigationEnd } from '@angular/router';
import { Clipboard } from '@capacitor/clipboard';
import { OcultarPublicidad, showBannerMenu, showInterstitialAd } from 'src/componentes/AdMob/publicidad';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BannerAdPosition } from '@capacitor-community/admob';
import { ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'; 
import { StatusBar, Style } from '@capacitor/status-bar';


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
 colorLightHex = '#ffffff'; 
 alphaLight = 100;     
 colorLight = '#ffffffff'; 
 backgroundImage: string | null = null; 
 fileName: string | null = null;  
 errorClipboard: string | null = null;
 errorGeneral: string | null = null;
 images: string[] = [
 'assets/img/demo7.png',
 'assets/img/demo6.png',
 'assets/img/demo5.png',
 'assets/img/demo4.png',
 'assets/img/demo3.png',
 'assets/img/demo2.png',
 'assets/img/demo1.png'
];
 duplicatedImages: string[] = [];
 carouselTransform = 'translateX(0px)';
 position = 0;
 speed = 1.2; 
 animationId: number | null = null;
 isPaused = false;

 startX = 0;
 currentX = 0;

 constructor(
    private router: Router, 
    private platform:Platform, 
    private toastController: ToastController,
    private loadingCtrl: LoadingController // 👈 INYECTADO
  ) { }

 ngOnInit() {
  this.duplicatedImages = [...this.images, ...this.images];
  this.animate();
  this.platform.ready().then(() => {
   this.setupStatusBar();
  });
  this.routerSubscription = this.router.events.pipe(
   filter((event) => event instanceof NavigationEnd)
  ).subscribe((event: NavigationEnd) => {
   if (event.urlAfterRedirects.includes('/home')) {
    showBannerMenu(BannerAdPosition.BOTTOM_CENTER);
   }
  });
 }

 private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout después de ${ms / 1000} segundos. Intente de nuevo.`));
      }, ms);

      promise
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

 setupStatusBar() { 
   StatusBar.setStyle({ style: Style.Default });
   StatusBar.setOverlaysWebView({ overlay: true }); 
   StatusBar.setBackgroundColor({ color: '#00000000' }); 
  }
  
 ngOnDestroy(): void {
  if (this.animationId) cancelAnimationFrame(this.animationId);
  if (this.routerSubscription) {
   this.routerSubscription.unsubscribe();
  }
 }

 updateColorLight() {
  const alpha = Math.round((this.alphaLight / 100) * 255);
  const alphaHex = alpha.toString(16).padStart(2, '0').toUpperCase();
  this.colorLight = this.colorLightHex.slice(0, 7) + alphaHex;
 }

 async selectBackgroundImage() {
  try {
   const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl, 
    source: CameraSource.Photos
   });

   if (image.dataUrl) {
    this.backgroundImage = image.dataUrl;
    
    
    this.fileName = `fondo_${new Date().getTime()}.jpg`; 
    
    this.showToast('Imagen de fondo cargada.', 'success');
   }
  } catch (error) {
   console.error('Error al seleccionar la imagen de fondo:', error);
   this.showToast('Error al cargar la imagen de fondo.', 'danger');
  }
 }

 removeBackgroundImage() {
  this.backgroundImage = null;
  this.fileName = null; 
  this.showToast('Imagen de fondo eliminada.', 'warning');
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
  this.updateColorLight(); 

  if (!this.qrData) {
   this.showToast('Por favor, escribe un texto o pega un enlace para generar el QR.', 'danger');
   return;
  }
  try {
   const qrOptions = { 
    color: { 
     dark: this.colorDark, 
     light: this.backgroundImage ? '#00000000' : this.colorLight 
    },
    errorCorrectionLevel: 'H' as 'H' 
   };
   const qrDataUrl: string = await QRCode.toDataURL(this.qrData, qrOptions);
   if (this.backgroundImage) {
    this.qrImage = await this.combineImageAndQR(qrDataUrl, this.backgroundImage);
   } else {
    this.qrImage = qrDataUrl;
   }
   this.showToast('QR generado exitosamente.', 'success');
  } catch (err: any) {
   const errorMsg = 'Error generando QR: ' + (err?.message || err);
   console.error(errorMsg);
   this.showToast(errorMsg, 'danger');
  }
 }

 private async combineImageAndQR(qrCodeDataUrl: string, backgroundDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
   if (!ctx) {
    return reject('No se pudo obtener el contexto 2D del canvas.');
   }

   const backgroundImage = new Image();
   backgroundImage.src = backgroundDataUrl;
   backgroundImage.onload = () => {
    canvas.width = backgroundImage.width;
    canvas.height = backgroundImage.height;
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    const qrImage = new Image();
    qrImage.src = qrCodeDataUrl;
    qrImage.onload = () => {
     const qrSize = Math.min(canvas.width, canvas.height) * 0.75; 
     const x = (canvas.width - qrSize) / 2;
     const y = (canvas.height - qrSize) / 2;
     ctx.drawImage(qrImage, x, y, qrSize, qrSize);
     resolve(canvas.toDataURL('image/png'));
    };
    qrImage.onerror = () => reject('Error al cargar la imagen QR.');
   };

   backgroundImage.onerror = () => reject('Error al cargar la imagen de fondo.');
  });
 }

 limpiarCampos() {
  this.qrData = '';
  this.qrImage = '';
  this.colorDark = '#000000';
  this.colorLightHex = '#ffffff'; 
  this.alphaLight = 100;
  this.updateColorLight(); 
  this.backgroundImage = null; 
  this.fileName = null;    
  this.errorClipboard = null;
  this.errorGeneral = null;
  this.showToast('Campos limpiados.', 'success');
 }
 
async shareQR() {
    this.errorGeneral = null;
    if (!this.qrImage) {
      this.showToast('Primero genera un código QR para compartir.', 'warning');
      return;
    }
    
    const loading = await this.loadingCtrl.create({
      message: 'Preparando y compartiendo...',
      spinner: 'dots',
      cssClass: 'custom-loading-class'
    });
    await loading.present();

    try {
      // Definimos la promesa completa que debe cumplir el límite de tiempo
      const shareOperation = async () => {
        // La mayor latencia vendrá de aquí
        await showInterstitialAd(); 

        const base64 = this.qrImage!.split(',')[1];
        const fileName = `qr-code-${Date.now()}.png`;
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });

        await Share.share({
          title: 'Mi Código QR',
          text: 'https://play.google.com/store/apps/details?id=com.neiruzlab.app QR generado por QR Creador...',   url: savedFile.uri,
          dialogTitle: 'Compartir código QR con…',
        });
      };
      
      // Ejecutamos la promesa con un límite de 20 segundos (20000ms)
      await this.withTimeout(shareOperation(), 20000); 

      await loading.dismiss();

    } catch (err: any) {
      await loading.dismiss();
      
      const errorMessage = err?.message || err;
      console.error('Share QR error:', errorMessage);
      
      if (errorMessage.includes('Timeout')) {
        this.errorGeneral = 'La operación ha tardado demasiado. Por favor, inténtelo de nuevo.';
        this.showToast('Tiempo agotado. Vuelva a intentar la operación.', 'danger');
      } else {
        this.errorGeneral = 'Error compartiendo QR: ' + errorMessage;
        this.showToast('Error compartiendo QR.', 'danger');
      }
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

 async showToast(message: string, color: string = 'primary', duration: number = 3000) {
  const toast = await this.toastController.create({
   message,
   duration,
   color,
   position: 'middle', 
   cssClass: 'toast-error'
  });
  await toast.present();
 }

 animate() {
  if (!this.isPaused) {
   this.position -= this.speed;
   const totalWidth = this.duplicatedImages.length * 60; // ancho aprox (50px + 10px margen)
   if (Math.abs(this.position) >= totalWidth / 2) {
    this.position = 0; // reinicia sin salto visible
   }
   this.carouselTransform = `translateX(${this.position}px)`;
  }
  this.animationId = requestAnimationFrame(() => this.animate());
 }

 onTouchStart(event: TouchEvent) {
  this.isPaused = true;
  this.startX = event.touches[0].clientX;
 }

 onTouchMove(event: TouchEvent) {
  const moveX = event.touches[0].clientX - this.startX;
  this.carouselTransform = `translateX(${this.position + moveX}px)`;
 }

 onTouchEnd(event: TouchEvent) {
  const endX = event.changedTouches[0].clientX;
  const deltaX = endX - this.startX;
  this.position += deltaX * 0.8;
  this.isPaused = false;
 }

 onImageClick(img: string) {
  this.isPaused = !this.isPaused;
  this.backgroundImage = img;
 }
}