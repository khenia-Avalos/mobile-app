//MISMO AUTHCONTEXT
/*  FUNCION Estado global 
 auth	localStorage no existe en React Native
 	AsyncStorage usa almacenamiento nativo (SQLite en iOS, SharedPreferences en Android) */

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginRequest, logoutRequest, registerRequest, verifyTokenRequest } from '../api/auth';
import axios from '../api/axios';

interface User {
  id: string;
  username: string;
  email: string;
  lastname: string;
  phoneNumber: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  authChecked: boolean;
  errors: string[];
  signup: (userData: any) => Promise<{ ok: boolean }>;
  signin: (userData: any) => Promise<{ ok: boolean }>;
  logout: () => Promise<void>;
  clearErrors: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const signup = async (userData: any) => {
    setLoading(true);
    try {
      const res = await registerRequest(userData);
      
      // Guardar token
      if (res.data.accessToken) {
        await AsyncStorage.setItem('token', res.data.accessToken);
      }
      
      setUser(res.data);
      setIsAuthenticated(true);
      setErrors([]);
      return { ok: true };
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData 
        ? (Array.isArray(errorData) ? errorData : [errorData])
        : ['Registration failed'];
      
      setErrors(errorMessage);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const signin = async (userData: any) => {
    setLoading(true);
    try {
      const res = await loginRequest(userData);
      
      // Guardar token
      if (res.data.accessToken) {
        await AsyncStorage.setItem('token', res.data.accessToken);
      }
      
      setUser(res.data);
      setIsAuthenticated(true);
      setErrors([]);
      return { ok: true };
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData 
        ? (Array.isArray(errorData) ? errorData : [errorData])
        : ['Login failed'];
      
      setErrors(errorMessage);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
      await AsyncStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearErrors = () => setErrors([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setAuthChecked(true);
          setLoading(false);
          return;
        }

        const res = await verifyTokenRequest();
        if (res.data) {
          setUser(res.data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          await AsyncStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUser(null);
        await AsyncStorage.removeItem('token');
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        authChecked,
        errors,
        signup,
        signin,
        logout,
        clearErrors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};