// backend/src/config.js - VERSIÓN CORREGIDA
console.log('🔧 Cargando config.js...');

const NODE_ENV_VALUE = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV_VALUE === 'production';

console.log('🔧 NODE_ENV:', NODE_ENV_VALUE);
console.log('🔧 EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail');

// Configuración unificada de email
export const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';

// Para Gmail
export const EMAIL_USER = process.env.EMAIL_USER || '';
export const EMAIL_PASS = process.env.EMAIL_PASS || '';

// Para SendGrid
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
export const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || '';

// Configuración general
export const NODE_ENV = NODE_ENV_VALUE;

// ✅ PERMITIR MÚLTIPLES ORÍGENES
export const ALLOWED_ORIGINS = [
  'https://frontend-internal-platform.onrender.com',
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:19006',
  /\.exp\.direct$/,  // Para Expo tunnel
  /^exp:\/\//,       // Para Expo URLs
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Para LAN
];

export const FRONTEND_URL = IS_PRODUCTION
  ? 'https://frontend-internal-platform.onrender.com'
  : process.env.FRONTEND_URL || 'http://localhost:5173';

export const TOKEN_SECRET = process.env.TOKEN_SECRET;
export const DB_URL = process.env.DB_URL;
export const PORT = process.env.PORT || 3000;

// Verificar configuraciones
console.log('🔧 Configuración cargada:');
console.log('   - NODE_ENV:', NODE_ENV);
console.log('   - ALLOWED_ORIGINS:', ALLOWED_ORIGINS.length, 'orígenes configurados');
console.log('   - EMAIL_SERVICE:', EMAIL_SERVICE);