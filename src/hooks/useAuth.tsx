// mobile-app/src/hooks/useAuth.tsx
import { useState, useEffect, useContext, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axios-mobile';
import { Alert, Platform } from 'react-native';

interface User {
  id: string;
  _id?: string;
  username: string;
  lastname?: string;
  email: string;
  phoneNumber?: string;
  role: string;
  specialty?: string;
  accessToken?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  authChecked: boolean;
  loading: boolean;
  errors: string[];
  signin: (credentials: { email: string; password: string }) => Promise<{ ok: boolean; role?: string }>;
  signup: (userData: any) => Promise<{ ok: boolean; data?: any }>;
  logout: () => Promise<void>;
  clearErrors: () => void;
  updateUserProfile: (userData: Partial<User>) => Promise<{ ok: boolean; data?: any; error?: any }>;
  registerStaff: (staffData: any) => Promise<{ ok: boolean; data?: any; error?: any }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔐 Verificando autenticación...');
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('⚠️ No hay token en AsyncStorage');
        setAuthChecked(true);
        return;
      }

      console.log('✅ Token encontrado, verificando...');
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get('/api/verify');
      
      if (response.data && response.data.id) {
        console.log('✅ Usuario autenticado:', response.data.username);
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.log('❌ Error en verificación:', error?.response?.data?.[0] || error.message);
      await AsyncStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  };

  const signin = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setErrors([]);
    
    try {
      console.log('🔐 Intentando login...');
      const response = await axios.post('/api/login', credentials);
      
      console.log('✅ Login response:', response.status);
      
      if (response.data && response.data.id) {
        const userData = response.data;
        console.log('✅ Login exitoso:', userData.username, `(${userData.role})`);
        
        if (userData.accessToken) {
          await AsyncStorage.setItem('token', userData.accessToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${userData.accessToken}`;
        }
        
        setUser(userData);
        setIsAuthenticated(true);
        setErrors([]);
        
        return { ok: true, role: userData.role };
      }
      
      return { ok: false };
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = 'Error en el login';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint no encontrado. Verifica la conexión con el servidor.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.response?.data?.[0]) {
        errorMessage = error.response.data[0];
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
      }
      
      setErrors([errorMessage]);
      Alert.alert('Error', errorMessage);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setLoading(true);
    setErrors([]);
    
    try {
      console.log('📝 Registrando nuevo usuario...');
      const response = await axios.post('/api/register', userData);
      
      console.log('✅ Registro exitoso:', response.status);
      
      if (response.data && response.data.id) {
        const userData = response.data;
        
        if (userData.accessToken) {
          await AsyncStorage.setItem('token', userData.accessToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${userData.accessToken}`;
        }
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { ok: true, data: userData };
      }
      
      return { ok: false };
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      
      let errorMessage = 'Error en el registro';
      
      if (error.response?.data) {
        if (Array.isArray(error.response.data)) {
          errorMessage = error.response.data[0];
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
      }
      
      setErrors([errorMessage]);
      Alert.alert('Error', errorMessage);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      await AsyncStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setErrors([]);
      console.log('✅ Sesión cerrada');
    }
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const updateUserProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setErrors([]);
      
      const userId = user?.id || user?._id;
      
      if (!userId) {
        console.error('❌ No hay ID de usuario');
        console.log('Usuario actual:', user);
        throw new Error('Usuario no identificado');
      }
      
      console.log('📤 Enviando actualización de perfil...');
      console.log('🆔 User ID:', userId);
      console.log('📦 Datos:', userData);
      console.log('🔗 URL:', '/api/profile');
      
      const response = await axios.put('/api/profile', userData);
      
      console.log('✅ Respuesta del servidor:', response.status);
      console.log('📥 Datos recibidos:', response.data);
      
      if (response.data) {
        setUser((prev: User | null) => {
          if (!prev) return null;
          const updatedUser = {
            ...prev,
            ...response.data,
            id: response.data.id || prev.id,
            _id: response.data.id || prev._id
          };
          console.log('👤 Usuario actualizado:', updatedUser.username);
          return updatedUser;
        });
        
        return { ok: true, data: response.data };
      }
      
      return { ok: false };
      
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      
      let errorMessage = 'No se pudo actualizar el perfil';
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        
        if (error.response.status === 401) {
          errorMessage = 'Sesión expirada. Inicia sesión nuevamente';
        } else if (error.response.status === 404) {
          errorMessage = 'Endpoint no encontrado. Contacta al administrador';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar al servidor';
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      setErrors([errorMessage]);
      return { ok: false, error };
      
    } finally {
      setLoading(false);
    }
  };

  // ============ NUEVA FUNCIÓN PARA REGISTRAR STAFF ============
  const registerStaff = async (staffData: any) => {
    try {
      setLoading(true);
      setErrors([]);
      
      console.log('📝 Registrando nuevo staff por admin...');
      console.log('📦 Datos:', staffData);
      
      const response = await axios.post('/api/admin/users', staffData);
      
      console.log('✅ Staff registrado:', response.status);
      console.log('📥 Respuesta:', response.data);
      
      if (response.data && response.data.success) {
        Alert.alert('Éxito', `Usuario ${staffData.username} registrado correctamente`);
        return { ok: true, data: response.data };
      }
      
      return { ok: false };
      
    } catch (error: any) {
      console.error('❌ Error registrando staff:', error);
      
      let errorMessage = 'No se pudo registrar el usuario';
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        
        if (error.response.status === 403) {
          errorMessage = 'Acceso denegado. Solo administradores.';
        } else if (error.response.status === 400) {
          if (Array.isArray(error.response.data)) {
            errorMessage = error.response.data[0];
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar al servidor';
      }
      
      setErrors([errorMessage]);
      Alert.alert('Error', errorMessage);
      return { ok: false, error };
      
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    authChecked,
    loading,
    errors,
    signin,
    signup,
    logout,
    clearErrors,
    updateUserProfile,
    registerStaff, // 👈 NUEVA FUNCIÓN AGREGADA
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};