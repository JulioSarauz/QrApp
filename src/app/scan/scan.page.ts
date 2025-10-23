import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { Router, NavigationEnd } from '@angular/router'; 
import { showBannerMenu, showInterstitialAd } from 'src/componentes/AdMob/publicidad'; 
import { Subscription } from 'rxjs'; 
import { filter } from 'rxjs/operators'; 
import { BannerAdPosition } from '@capacitor-community/admob';
import { BrowserMultiFormatReader } from '@zxing/library';
import { ViewChild, ElementRef } from '@angular/core';
import jsQR from 'jsqr'; 
import { ToastController, Platform } from '@ionic/angular'; 
import { Clipboard } from '@capacitor/clipboard'; 


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
 @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
 @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
 @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
 
 private stream: MediaStream | null = null;
 private animationFrameId: number = 0;

 constructor(
    private router: Router, 
    private toastController: ToastController,
    private platform: Platform 
  ) { }
  
  
  
 async NuevaSolicitudEscaneo() { 
  await showInterstitialAd();     
  this.ContenidoQrTexto = "";
 }
  

 ngOnInit() {
  this.routerSubscription = this.router.events.pipe(
   filter((event) => event instanceof NavigationEnd)
  ).subscribe((event: NavigationEnd) => {
   if (event.urlAfterRedirects.includes('/scan')) {
    showBannerMenu(BannerAdPosition.BOTTOM_CENTER);
   }
  });
 }

  
  async mostrarToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom',
      cssClass: 'toast-message',
    });
    await toast.present();
  }

  
  async mostrarError(errorMsg: string) {
    await this.mostrarToast(errorMsg, 'danger');
  }

 esURL(texto: string): boolean {
  try {
   const url = new URL(texto);
   return true;
  } catch (_) {
   return false;
  }
 }


 async copiarContenidoQr(): Promise<void> {
    if (!this.ContenidoQrTexto) {
      await this.mostrarToast('No hay contenido para copiar.', 'danger');
      return;
    }
    try {
      if (this.platform.is('capacitor')) {
        await Clipboard.write({ string: this.ContenidoQrTexto });
      } else {
        
        await navigator.clipboard.writeText(this.ContenidoQrTexto);
      }
      await this.mostrarToast('Contenido copiado al portapapeles.', 'success');

    } catch (err) {
      console.error('Error al copiar:', err);
      await this.mostrarError('No se pudo copiar el texto.');
    }
  }


 cargarImagen(event: any) {
  this.fileInput.nativeElement.click();
 }

 
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
          this.mostrarToast('QR detectado desde imagen.', 'success');
    } else {
     this.mostrarError('No se detectó ningún QR en la imagen.');
    }
   };
  };
  reader.readAsDataURL(file);
 }
 goToGenerator() {
    this.detenerEscaneo();
  this.router.navigateByUrl('/home');
 }

 goToScanner() {
    
    
  this.router.navigateByUrl('/scan');
 }
 goToMenu() {
    this.detenerEscaneo();
  this.router.navigateByUrl('/menu');
 }
async EscanearQrEnVivo() {
  this.ContenidoQrTexto = "";
  this.MostrarEnfoque = true; 
  try {
    
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment', 
      }
    });
    const video = this.videoElement.nativeElement;
    video.srcObject = this.stream;
    
    await new Promise(resolve => {
      video.onloadedmetadata = () => {
        video.play();
        resolve(true);
      };
    });
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const tick = () => {      
      if (!video.paused && !video.ended && this.MostrarEnfoque) {       
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);
          if (code) {
            
            this.ContenidoQrTexto = code.data;
            this.detenerEscaneo(); 
            console.log('QR detectado:', this.ContenidoQrTexto);
                        this.mostrarToast('Código QR detectado.', 'success');
            return;
          }
        } catch (e) {
          console.error('Error al procesar frame con jsQR:', e);
        }
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  } catch (error) {
    console.error('Error al iniciar el escaneo en vivo:', error);
    await this.mostrarError('Error al iniciar la cámara. Revisa permisos o si ya está en uso. Detalle: ' + JSON.stringify(error));
    this.detenerEscaneo();
  }
}


private detenerEscaneo() {
  if (this.animationFrameId) {
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = 0;
  }
  if (this.stream) {
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
  }
  this.MostrarEnfoque = false;
}
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    
    this.detenerEscaneo();
  }
}