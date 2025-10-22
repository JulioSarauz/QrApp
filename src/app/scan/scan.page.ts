import { Component, OnInit, OnDestroy } from '@angular/core'; // Importamos OnDestroy
import { Router, NavigationEnd } from '@angular/router'; // Importamos NavigationEnd
import { showBannerMenu, showInterstitialAd } from 'src/componentes/AdMob/publicidad';
import { Subscription } from 'rxjs'; // Necesario para gestionar la suscripción
import { filter } from 'rxjs/operators'; // Necesario para filtrar eventos
import { BannerAdPosition } from '@capacitor-community/admob';
import { BrowserMultiFormatReader } from '@zxing/library';import { ViewChild, ElementRef } from '@angular/core';
import jsQR from 'jsqr'; // Librería para leer QR desde imagen
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'; // Añade CameraResultType y CameraSource
import { Capacitor } from '@capacitor/core';
import { ToastController } from '@ionic/angular';


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
    
    // Variables para controlar el stream y el escaneo
    private stream: MediaStream | null = null;
    private animationFrameId: number = 0;

  constructor(private router: Router, private toastController: ToastController) { }
  ngOnInit() {

    this.routerSubscription = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.includes('/scan')) {
        showBannerMenu(BannerAdPosition.BOTTOM_CENTER);
      }
    });
  }

async mostrarError(errorMsg: string) {
    const toast = await this.toastController.create({
      message: errorMsg,
      duration: 3000,
      color: 'danger',
      position: 'middle',
      cssClass: 'toast-error', 
    });
    await toast.present();
  }


  async NuevaSolicitudEscaneo() {
    this.ContenidoQrTexto = "";
    await showInterstitialAd();
  }
  esURL(texto: string): boolean {
    try {
      const url = new URL(texto);
      return true;
    } catch (_) {
      return false;
    }
  }

  copiarContenidoQr(): void {
  if (!this.ContenidoQrTexto) {
    console.warn('No hay contenido para copiar');
    return;
  }

  navigator.clipboard.writeText(this.ContenidoQrTexto)
    .then(() => {
      console.log('Contenido copiado al portapapeles');
      alert('✅ Texto copiado al portapapeles');
    })
    .catch(err => {
      console.error('Error al copiar:', err);
      alert('❌ No se pudo copiar el texto');
    });
}

 // Abrir selector de archivo al hacer clic
  cargarImagen(event: any) {
    this.fileInput.nativeElement.click();
  }

  // Leer QR de la imagen seleccionada
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
        } else {
          alert('No se detectó ningún QR en la imagen');
        }
      };
    };
    reader.readAsDataURL(file);
  }
  goToGenerator() {
    this.router.navigateByUrl('/home');
  }

  goToScanner() {
    this.router.navigateByUrl('/scan');
  }
   goToMenu() {
    this.router.navigateByUrl('/menu');
  }



  //ESCANEAR QR NATIVO 
async EscanearQrEnVivo() {
    this.ContenidoQrTexto = "";
    this.MostrarEnfoque = true; // Muestra el contenedor de video

    // ⚠️ COMENTADO: Permite que esta lógica de Web API se ejecute en Capacitor (Android/iOS)
    // if (Capacitor.isNativePlatform()) {
    //     await this.mostrarError('El escaneo en vivo con Web API es experimental en plataformas nativas. Intenta solo "Cargar Imagen".');
    //     this.MostrarEnfoque = false;
    //     return;
    // }

    try {
        // 1. Obtener acceso a la cámara (trasera)
        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                // Optimizaciones de resolución (opcional, prueba sin ellas primero)
                // width: { ideal: 1280 }, 
                // height: { ideal: 720 } 
            }
        });

        // 2. Asignar el stream al elemento de video y reproducir
        const video = this.videoElement.nativeElement;
        video.srcObject = this.stream;
        // Reiniciamos la promesa para asegurar que el video esté listo
        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                video.play();
                resolve(true);
            };
        });

        // 3. Iniciar el ciclo de escaneo (analizar frames)
        const canvas = this.canvasElement.nativeElement;
        // Re-obtener el contexto 2D para asegurar la configuración
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!; 
        
        // Función recursiva para analizar frames
        const tick = () => {
            // SÓLO ANALIZA SI EL VIDEO ESTÁ ACTIVO Y LA PÁGINA ES VISIBLE
            if (!video.paused && !video.ended && this.MostrarEnfoque) { 
                
                // 4. Ajustar el Canvas y Dibujar
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // 5. Obtener datos y buscar el QR
                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, canvas.width, canvas.height);

                    if (code) {
                        // QR ENCONTRADO
                        this.ContenidoQrTexto = code.data;
                        this.detenerEscaneo(); // Cierra la cámara
                        console.log('QR detectado:', this.ContenidoQrTexto);
                        return;
                    }
                } catch (e) {
                    console.error('Error al procesar frame con jsQR:', e);
                }

                // Si no hay código, continuar con el siguiente frame
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

// Función auxiliar para detener el escaneo
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
        // Asegúrate de detener la cámara al salir de la vista
        this.detenerEscaneo();
    }
}
