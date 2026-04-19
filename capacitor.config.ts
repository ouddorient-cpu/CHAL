import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hanoutprice.app',
  appName: 'CH7AL hanouti',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    errorPath: '/index.html'
  }
};

export default config;
