import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Worker URL para MOBILE - SIN barra al final
const WORKER_URL = 'https://veteapp-proxy.kheniafuentesavalos.workers.dev';

const instance = axios.create({
  baseURL: WORKER_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client': 'agendapro-mobile',
  },
});

// Generar ID único para cada request
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// INTERCEPTOR DE REQUEST - SOLO MOBILE
instance.interceptors.request.use(async (config) => {
  // Generar ID único
  const requestId = generateRequestId();
  config.headers['X-Request-ID'] = requestId;
  
  // Obtener token SOLO desde AsyncStorage (mobile)
  let token: string | null = null;
  
  try {
    token = await AsyncStorage.getItem('token');
  } catch (error) {
    console.warn('⚠️ Error obteniendo token mobile:', error);
  }
  
  // Agregar token si existe
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // LOG solo en desarrollo
  if (__DEV__) {
    console.log('📱 Mobile Request:', {
      id: requestId,
      url: config.url,
      method: config.method,
      hasToken: !!token,
    });
  }
  
  return config;
});

// INTERCEPTOR DE RESPONSE - SOLO MOBILE
instance.interceptors.response.use(
  (response) => {
    // LOG en desarrollo
    if (__DEV__) {
      console.log('✅ Mobile Response:', {
        url: response.config.url,
        status: response.status,
      });
    }
    
    // Guardar token si viene en respuesta
    if (response.data?.accessToken) {
      AsyncStorage.setItem('token', response.data.accessToken);
      console.log('💾 Token guardado en AsyncStorage');
    }
    
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status;
    
    // NO LOGGEAR errores normales de verifyToken
    if (url.includes('/verify') && status === 401) {
      if (__DEV__) {
        console.log('🔐 verifyToken: No autenticado (normal)');
      }
      return Promise.reject(error);
    }
    
    // Loggear otros errores
    if (__DEV__) {
      console.error('❌ Mobile API Error:', {
        url,
        status,
        data: error.response?.data,
      });
    }
    
    // Limpiar token si expiró
    if (status === 401) {
      AsyncStorage.removeItem('token');
    }
    
    return Promise.reject(error);
  }
);

export default instance;