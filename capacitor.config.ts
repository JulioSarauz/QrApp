import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'qr-generator',
  webDir: 'www',
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000'
    }
  },
  plugins: {
    EdgeToEdge: {
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resizeOnFullScreen: false, 
    },
  },
  android: {
    adjustMarginsForEdgeToEdge: "auto"
  }
};

export default config;