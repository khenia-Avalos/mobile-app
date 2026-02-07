//ES EL MISMO AXIOS 
//FUNCION Cliente HTTP	
// Cookies HTTP-Only no funcionan bien en mobile	
// Token se guarda en AsyncStorage y se envía manualmente en headers
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const WORKER_URL = 'https://veteapp-proxy.kheniafuentesavalos.workers.dev/';

const instance = axios.create({
  baseURL: WORKER_URL, 
  timeout: 30000, // Aumentado para mobile
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
instance.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token añadido a la petición');
    }
  } catch (error) {
    console.error('Error obteniendo token:', error);
  }
  return config;
}, (error) => {
  console.error('❌ Error en interceptor de request:', error);
  return Promise.reject(error);
});

// Interceptor para manejar respuestas
instance.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta recibida:', {
      url: response.config.url,
      status: response.status
    });
    
    // Si el login/register devuelve accessToken, guardarlo
    if (response.data?.accessToken) {
      AsyncStorage.setItem('token', response.data.accessToken);
      console.log('💾 Token guardado en AsyncStorage');
    }
    
    return response;
  },
  (error) => {
    console.error('❌ Error de API:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Manejar token expirado
    if (error.response?.status === 401) {
      console.log('⚠️ Token expirado o inválido');
      AsyncStorage.removeItem('token');
      
     
    }
    
    if (!error.response) {
      console.log('🌐 Error de conexión - Verifica tu internet');
    }
    
    return Promise.reject(error);
  }
);

export default instance;