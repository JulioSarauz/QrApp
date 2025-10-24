import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as QRCode from 'qrcode';
import { Dialog } from '@capacitor/dialog';
import { Share } from '@capacitor/share';
import { Platform, LoadingController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { Clipboard } from '@capacitor/clipboard';
import { OcultarPublicidad, showBannerMenu, showInterstitialAd } from 'src/componentes/AdMob/publicidad';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BannerAdPosition } from '@capacitor-community/admob';
import { ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ElementRef, ViewChild } from '@angular/core';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';


@Component({
selector: 'app-home',
templateUrl: 'home.page.html',
styleUrls: ['home.page.scss'],
standalone:false
})

export class HomePage implements OnInit, OnDestroy {
 @ViewChild('qrCanvas', { static: true }) qrCanvas!: ElementRef;
 qrCode!: QRCodeStyling; 
 
 currentShape: 'square' | 'rounded' = 'rounded'; 
 private isQrCodeAppended: boolean = false; // Bandera para controlar la inserción del canvas

private routerSubscription: Subscription = new Subscription();
qrData: string = '';
qrImage: string = '';
colorDark = '#000000';
colorLightHex = '#ffffff';
alphaLight = 100;
colorLight = '#ffffffff';
backgroundImage: string | null = null;
backgroundImage2: string | null = null;
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
  private loadingCtrl: LoadingController,
  private renderer: Renderer2 // Renderer2 ya está inyectado, ¡perfecto!
 ) { }


ngOnInit() {
 // Inicialización de la configuración (SIN llamar a .append() todavía)
 this.qrCode = new QRCodeStyling({
   width: 300,
   height: 300,
   data: 'Escribe tu contenido aquí', 
   margin: 10,
   dotsOptions: {
    color: this.colorDark,
    type: this.currentShape as DotType 
   },
   cornersSquareOptions: { 
    type: 'square' as CornerSquareType 
   },
   cornersDotOptions: {
    type: 'dot' as CornerDotType
   },
   backgroundOptions: {
    color: this.colorLightHex
   },
   imageOptions: {
    crossOrigin: 'anonymous',
    margin: 8, 
    imageSize: 0.3,
    hideBackgroundDots: true 
   }
 });

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

// Ajustar la función updateShape para usar los tipos compatibles
async updateShape(shape: 'square' | 'rounded') {
  this.currentShape = shape;

  if (!this.isQrCodeAppended) {
   this.generateQR(true); 
   return;
  }

  this.qrCode.update({
   dotsOptions: { type: shape as DotType },
   cornersSquareOptions: { type: (shape === 'square' ? 'square' : 'extra-rounded') as CornerSquareType },
   cornersDotOptions: { type: (shape === 'square' ? 'dot' : 'rounded') as CornerDotType }
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
 const hexWithoutHash = this.colorLightHex.substring(1);
 const r = parseInt(hexWithoutHash.substring(0, 2), 16);
 const g = parseInt(hexWithoutHash.substring(2, 4), 16);
 const b = parseInt(hexWithoutHash.substring(4, 6), 16);
 this.colorLight = `rgba(${r}, ${g}, ${b}, ${this.alphaLight / 100})`;

 if (this.isQrCodeAppended) {
   this.qrCode.update({ 
    backgroundOptions: { 
     color: this.backgroundImage ? 'transparent' : this.colorLight 
    } 
   });
 }
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
   
   // 🎯 CORRECCIÓN: Aplicar la imagen al fondo del contenedor del canvas
   this.updateCanvasBackground();
   
   if (this.isQrCodeAppended) this.generateQR(true); // Actualiza la vista previa del QR a transparente
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
 
 // 🎯 CORRECCIÓN: Eliminar la imagen del fondo del contenedor del canvas
 this.updateCanvasBackground();
 
 if (this.isQrCodeAppended) this.generateQR(true); 
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
  } else {
   this.generateQR(true); // Actualiza la vista previa al pegar texto
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

async generateQR(isPreview: boolean = false) {
 this.updateColorLight(); 

 if (!this.qrData && !isPreview) {
   this.showToast('Por favor, escribe un texto o pega un enlace para generar el QR.', 'danger');
   return;
 }

 try {
  // 1. Añadir el canvas SÓLO la primera vez que se llama
  if (!this.isQrCodeAppended) {
   this.qrCode.append(this.qrCanvas.nativeElement);
   this.isQrCodeAppended = true;
  }

  // 2. Configuración de QRCodeStyling para el canvas
  this.qrCode.update({
   data: this.qrData || 'Escribe tu contenido aquí',
   dotsOptions: {
    color: this.colorDark,
    type: this.currentShape as DotType 
   },
   // 🎯 CORRECCIÓN: Si hay imagen de fondo (this.backgroundImage), el QR debe ser transparente
   backgroundOptions: {
    color: this.backgroundImage ? 'transparent' : this.colorLight
   },
   image: this.backgroundImage2 || undefined, 
   imageOptions: {
    crossOrigin: 'anonymous',
    margin: 8,
    imageSize: 0.3,
    hideBackgroundDots: true
   }
  });
  
  if (isPreview) {
   this.qrImage = ''; 
   return;
  }

  // --- Lógica para la GENERACIÓN FINAL ---
  // Esta lógica (combineImageAndQR) es la que realmente mezcla el fondo con el QR en una sola imagen.

  let qrDataUrl: string = await (this.qrCode as any).toDataURL('png'); 

  // SÓLO si hay fondo, lo combinamos en la imagen final
  if (this.backgroundImage) {
   qrDataUrl = await this.combineImageAndQR(qrDataUrl, this.backgroundImage);
  }

  this.qrImage = qrDataUrl;
  this.showToast('QR generado exitosamente.', 'success');

 } catch (err: any) {
  // ... (manejo de errores)
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
  backgroundImage.crossOrigin = 'anonymous'; 
  backgroundImage.onload = () => {
   canvas.width = backgroundImage.width;
   canvas.height = backgroundImage.height;

   // 1. Dibuja el fondo
   ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

   const qrImage = new Image();
   qrImage.src = qrCodeDataUrl;
   qrImage.crossOrigin = 'anonymous';
   qrImage.onload = () => {
    // 2. Dibuja el QR encima
    const qrSize = Math.min(canvas.width, canvas.height) * 0.75;
    const x = (canvas.width - qrSize) / 2;
    const y = (canvas.height - qrSize) / 2;
    ctx.drawImage(qrImage, x, y, qrSize, qrSize);

    resolve(canvas.toDataURL('image/png'));
   };
   qrImage.onerror = () => reject('Error al cargar la imagen QR generada.');
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
 this.backgroundImage2 = null; 
 this.fileName = null;
 this.errorClipboard = null;
 this.errorGeneral = null;
 this.showToast('Campos limpiados.', 'success');

 this.qrCode.update({ 
   data: 'Escribe tu contenido aquí', 
   image: undefined,
   backgroundOptions: { color: this.colorLightHex } 
 });
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
   const shareOperation = async () => {
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
     text: 'https://play.google.com/store/apps/details?id=com.neiruzlab.app QR generado por QR Creador...', 
     url: savedFile.uri,
     dialogTitle: 'Compartir código QR con…',
    });
   };
   await this.withTimeout(shareOperation(), 20000);
   await loading.dismiss();
  } catch (err: any) {
   await loading.dismiss();
   const errorMessage = err?.message || err;
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

 toast.addEventListener('click', () => {
  toast.dismiss();
 });
}

// Métodos del carrusel y animación (CORREGIDOS)
animate() {
 if (!this.isPaused) {
 this.position -= this.speed;
 const totalWidth = this.duplicatedImages.length * 60; 
 if (Math.abs(this.position) >= totalWidth / 2) {
  this.position = 0;
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
 
 // 🎯 CORRECCIÓN: Aplicar la imagen del carrusel al fondo del contenedor del canvas
 this.updateCanvasBackground();

 if (this.isQrCodeAppended) this.generateQR(true); // Actualiza la vista previa del QR a transparente
}


onImageSelected(event: any) {
 const file = event.target.files[0];
 if (file) {
  const reader = new FileReader();
  reader.onload = () => {
   this.backgroundImage2 = reader.result as string;
   this.qrCode.update({ image: this.backgroundImage2 });
   this.showToast('Logo cargado correctamente ✅', 'success');
  };
  reader.readAsDataURL(file);
 }
}

private updateCanvasBackground() {
 if (this.qrCanvas && this.qrCanvas.nativeElement) {
   const element = this.qrCanvas.nativeElement;
   
   if (this.backgroundImage) {
     this.renderer.setStyle(element, 'background-image', `url(${this.backgroundImage})`);
     this.renderer.setStyle(element, 'background-size', 'cover');
     this.renderer.setStyle(element, 'background-position', 'center');
   } else {
     // Restaurar el estilo (o usar un color sólido definido en SCSS)
     this.renderer.removeStyle(element, 'background-image');
     this.renderer.removeStyle(element, 'background-size');
     this.renderer.removeStyle(element, 'background-position');
   }
 }
}
}