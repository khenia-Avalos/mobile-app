// TypeScript para mejor desarrollo	Misma lógica pero con tipos, mejor autocompletado


import { useState } from 'react';
import { forgotPasswordRequest, resetPasswordRequest } from '../api/auth';

export const usePassword = () => {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const forgotPassword = async (email: string) => {
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const response = await forgotPasswordRequest(email);
      if (response.data.success) {
        setMessage(response.data.message || 'Email enviado con éxito');
        return { ok: true };
      } else {
        setError(response.data.message || 'Error desconocido');
        return { ok: false };
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.[0] || 'Error de conexión';
      setError(errorMsg);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const response = await resetPasswordRequest(token, newPassword);
      if (response.data.success || response.data.includes('Password reset successfully')) {
        setMessage('Contraseña cambiada exitosamente');
        return { ok: true };
      } else {
        setError(response.data?.[0] || 'Error desconocido');
        return { ok: false };
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.[0] || 'Error de conexión';
      setError(errorMsg);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    forgotPassword,
    resetPassword,
    message,
    error,
    loading,
  };
};