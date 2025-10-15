// publicidad.ts
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
export const ModoDesarrollador:boolean = true;
export const CodigoBanner:string = 'ca-app-pub-3168726036346781/9507429127';
export const CodigoIntersticial: string = 'ca-app-pub-3168726036346781/9858782916';

//INICIAR EL MODULO DE ADMOB
export async function initializeAdMob(): Promise<void> {
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
      adId: CodigoBanner,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: ModoDesarrollador,
    });
    console.log("inicio la publicidad");
    
  } catch (error: any) {
    console.error('AdMob error:', error);
    throw new Error('Error inicializando AdMob: ' + (error?.message || error));
  }
}

// LLAMAR PUBLICIDAD POR INTERSITITIAL
 export async function showInterstitialAd() {
    try {
      await AdMob.prepareInterstitial({
        adId: CodigoIntersticial,
        isTesting: ModoDesarrollador,
      });

      (AdMob as any).addListener('interstitialAdDismissed', () => { });
      await AdMob.showInterstitial();
    } catch (err: any) {
      console.error('Interstitial error:', err);
    }
  }
  //BANER GENERAR QR
  export async function showBannerCrear() {
    try {
      await AdMob.removeBanner(); 
      await AdMob.initialize();
      await AdMob.showBanner({
        adId: CodigoBanner,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: ModoDesarrollador,
      });
      console.log("se inicio banner 2");
    } catch (err) {
      console.error('Error mostrando banner:', err);
    }
  }
  //BANNER DE MENU PRINCIPAL
  export async function showBannerMenu(posicion:BannerAdPosition) {
    try {
      await AdMob.removeBanner(); 
      await AdMob.initialize();
      await AdMob.showBanner({
        adId: CodigoBanner,
        adSize: BannerAdSize.BANNER,
        position: posicion,
        isTesting: ModoDesarrollador,
      });
      console.log("se inicio banner 1");
    } catch (err) {
      console.error('Error mostrando banner:', err);
    }
  }

  //Ocultar banner 
  export async function OcultarPublicidad(){
    //await AdMob.hideBanner();
  }