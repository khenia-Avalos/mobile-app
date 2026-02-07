import axios from 'axios';

// Worker URL para WEB - SIN barra al final
const WORKER_URL = 'https://veteapp-proxy.kheniafuentesavalos.workers.dev';

const instance = axios.create({
  baseURL: WORKER_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client': 'agendapro-web',
  },
});

// Interceptor para web - SOLO localStorage
instance.interceptors.request.use((config) => {
  // Token SOLO desde localStorage (web)
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Web: Token añadido');
  }
  
  return config;
});

// Interceptor de respuesta para web
instance.interceptors.response.use(
  (response) => {
    console.log('✅ Web Response:', {
      url: response.config.url,
      status: response.status
    });
    
    // Guardar token si viene
    if (response.data?.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      console.log('💾 Token guardado en localStorage');
    }
    
    return response;
  },
  (error) => {
    console.error('❌ Web API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    // Limpiar token si expiró
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    
    return Promise.reject(error);
  }
);

export default instance;