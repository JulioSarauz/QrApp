import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neiruzlab.app',
  appName: 'qr-generator',
  webDir: 'www',
  plugins: {
    AdMob: {
      appIdAndroid: 'ca-app-pub-3168726036346781~1389890676',
    }
  }
};

export default config;
