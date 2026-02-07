import axios from './axios';

export const registerRequest = (user: any) => axios.post('/api/register', user);
export const loginRequest = (user: any) => axios.post('/api/login', user);
export const logoutRequest = () => axios.post('/api/logout');
export const verifyTokenRequest = () => axios.get('/api/verify');
export const forgotPasswordRequest = (email: string) => 
  axios.post('/api/forgot-password', { email });
export const resetPasswordRequest = (token: string, password: string) => 
  axios.post('/api/reset-password', { token, password });
//MISMO AUTH.JS
/* Funciones auth API
	BaseURL ahora apunta al Worker, no directo a Render	
  Worker actúa como proxy y maneja CORS antes de llegar a Render */