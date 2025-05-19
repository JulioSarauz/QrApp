import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neiruzlab.app',
  appName: 'qr-generator',
  webDir: 'www',
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-3168726036346781~1389890676', // ✅ Usa "appId" en lugar de "appIdAndroid"
    }
  }
};

export default config;