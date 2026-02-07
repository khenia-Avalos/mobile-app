// Selector automático de axios según plataforma

// Detectar si estamos en web o mobile
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

let axiosInstance: any;

if (isWeb) {
  // WEB: Usar axios-web
  console.log('🌐 Plataforma: WEB - Usando axios-web');
  axiosInstance = require('./axios-web').default;
} else {
  // MOBILE: Usar axios-mobile
  console.log('📱 Plataforma: MOBILE - Usando axios-mobile');
  axiosInstance = require('./axios-mobile').default;
}

export default axiosInstance;