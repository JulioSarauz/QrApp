import { Component, OnInit, OnDestroy, Renderer2, inject } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Dialog } from '@capacitor/dialog';
import { Share } from '@capacitor/share';
import { Platform, LoadingController, ToastController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { Clipboard } from '@capacitor/clipboard';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ElementRef, ViewChild } from '@angular/core';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { showBannerMenu, showInterstitialAd } from 'src/componentes/AdMob/publicidad';
import { BannerAdPosition } from '@capacitor-community/admob';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage implements OnInit, OnDestroy {
  @ViewChild('qrCanvas', { static: true }) qrCanvas!: ElementRef;
  qrCode!: QRCodeStyling;
  currentShape: 'square' | 'rounded' | 'diagLeft' | 'diagRight' = 'square';
  private isQrCodeAppended: boolean = false;
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
  logoFileName: string | null = null;
  startX = 0;
  currentX = 0;
  selectedTab: 'colores' | 'transparencia' | 'imagenes' | 'formas' = 'colores';
  isSharing: boolean = false;
  
  constructor(
    private router: Router,
    private platform: Platform,
    private toastController: ToastController,
    private loadingCtrl: LoadingController,
    private renderer: Renderer2
  ) { }
  ngOnInit() {
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
  async updateShape(shape: 'square' | 'rounded' | 'diagLeft' | 'diagRight') {
    this.currentShape = shape;

    
    if (!this.isQrCodeAppended) {
      this.generateQR(true);
      return;
    }

    let dotsType: DotType = 'square';
    let cornersSquareType: CornerSquareType = 'square';
    let cornersDotType: CornerDotType = 'square';

    switch (shape) {
      case 'square':
        dotsType = 'square';
        cornersSquareType = 'square';
        cornersDotType = 'square';
        break;

      case 'rounded':
        dotsType = 'rounded';
        cornersSquareType = 'extra-rounded';
        cornersDotType = 'rounded';
        break;

      case 'diagLeft':
        dotsType = 'rounded';
        cornersSquareType = 'extra-rounded';
        cornersDotType = 'square';
        break;

      case 'diagRight':
        dotsType = 'square';
        cornersSquareType = 'square';
        cornersDotType = 'rounded';
        break;
    }
    this.qrCode.update({
      dotsOptions: { type: dotsType },
      cornersSquareOptions: { type: cornersSquareType },
      cornersDotOptions: { type: cornersDotType },
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


        this.updateCanvasBackground();

        if (this.isQrCodeAppended) this.generateQR(true);
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
        this.generateQR(true);
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
      
      if (!this.isQrCodeAppended) {
        this.qrCode.append(this.qrCanvas.nativeElement);
        this.isQrCodeAppended = true;
      }

      
      this.qrCode.update({
        data: this.qrData || 'Escribe tu contenido aquí',
        dotsOptions: {
          color: this.colorDark,
          type: this.currentShape as DotType
        },

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

      
      let qrDataUrl: string = '';

      
      const canvasElement: HTMLCanvasElement | null = this.qrCanvas.nativeElement.querySelector('canvas');

      if (!canvasElement) {
        throw new Error("No se encontró el elemento canvas. La librería 'qr-code-styling' no lo renderizó correctamente.");
      }

      
      qrDataUrl = canvasElement.toDataURL('image/png');


      
      
      if (!qrDataUrl || qrDataUrl.length < 500) {
        
        if (this.backgroundImage2 || this.backgroundImage) {
          throw new Error("El DataURL generado está vacío o es inválido. Intenta quitando el logo y/o la imagen de fondo, ya que podrían estar causando un conflicto de carga.");
        } else {
          
          throw new Error("El QR se generó vacío. Asegúrate de que el texto no sea demasiado largo y prueba con contenido más corto.");
        }
      }

      
      if (this.backgroundImage) {
        
        qrDataUrl = await this.combineImageAndQR(qrDataUrl, this.backgroundImage);
      }

      
      this.qrImage = qrDataUrl;
      this.showToast('QR generado exitosamente.', 'success');

    } catch (err: any) {
      console.error('Error al generar el QR (generateQR):', err);
      
      const userMessage = err.message.includes('DataURL') || err.message.includes('canvas') ? 
        err.message : 
        'Fallo la generación del código QR. Por favor, revisa tu contenido y tus activos (logo/fondo).';
      throw new Error(userMessage);
    }
  }
  private async combineImageAndQR(qrCodeDataUrl: string, backgroundDataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject('Error interno: No se pudo obtener el contexto 2D del canvas para combinar imágenes.');
      }

      const backgroundImage = new Image();
      backgroundImage.src = backgroundDataUrl;
      backgroundImage.crossOrigin = 'anonymous';
      backgroundImage.onload = () => {
        canvas.width = backgroundImage.width;
        canvas.height = backgroundImage.height;

        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        const qrImage = new Image();
        qrImage.src = qrCodeDataUrl;
        qrImage.crossOrigin = 'anonymous';
        qrImage.onload = () => {

          const qrSize = Math.min(canvas.width, canvas.height) * 0.75;
          const x = (canvas.width - qrSize) / 2;
          const y = (canvas.height - qrSize) / 2;
          ctx.drawImage(qrImage, x, y, qrSize, qrSize);

          resolve(canvas.toDataURL('image/png'));
        };
        
        qrImage.onerror = () => reject('Error al cargar la imagen QR generada para la combinación (posiblemente corrupta).');
      };
      
      backgroundImage.onerror = () => reject('Error al cargar la imagen de fondo. Asegúrate de que sea un formato válido.');
    });
  }
  limpiarCampos() {

    this.logoFileName = null;
    this.errorGeneral = null;
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
    this.showToast('Campos limpiados.', 'success');

    this.qrCode.update({
      data: 'Escribe tu contenido aquí',
      image: undefined,
      backgroundOptions: { color: this.colorLightHex }
    });
  }
  async shareQR() {
      if (this.isSharing) {
          console.warn("Compartir ya está en proceso, ignorando clic.");
          return; 
      }
      if (!this.qrData.trim().length) {
          this.showToast('Primero escribe un texto o pega un enlace.', 'warning');
          return;
      }
      this.isSharing = true; 
      try {
          let qrDataUrl: string;
          const canvas: any = await this.qrCode.getRawData('png');
          const reader = new FileReader();
          qrDataUrl = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(canvas);
          });
          const base64 = qrDataUrl.split(',')[1];
          const fileName = `qr-code-${Date.now()}.png`;
          const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64,
              directory: Directory.Cache,
          });
          await showInterstitialAd(); 
           const appLink = 'https://play.google.com/store/apps/details?id=com.neiruzlab.app';
            const shareText = `QR generado por QR Creador. Descarga la app aquí: ${appLink}`;
            await Share.share({
                title: 'Mi Código QR',
                text: shareText, 
                url: savedFile.uri,
                dialogTitle: 'Compartir código QR con…',
            });
      } catch (err: any) {
          console.error('Error compartiendo QR:', err);
          this.showToast('Error compartiendo QR.', 'danger');
      } finally {
          this.isSharing = false; 
      }
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
    this.updateCanvasBackground();
    if (this.isQrCodeAppended) this.generateQR(true);
  }
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.backgroundImage2 = reader.result as string;
        this.logoFileName = file.name;
        this.qrCode.update({ image: this.backgroundImage2 });
        this.showToast(`Logo "${file.name}" cargado ✅`, 'success');
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
        this.renderer.removeStyle(element, 'background-image');
        this.renderer.removeStyle(element, 'background-size');
        this.renderer.removeStyle(element, 'background-position');
      }
    }
  }
}
