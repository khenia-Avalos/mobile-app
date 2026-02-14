// mobile-app/src/api/users.ts
import axios from './axios-mobile';

export const getUsersRequest = (params?: any) => {
  console.log('👥 GET /users', params);
  return axios.get('/users', { params });
};

export const getVeterinariansRequest = (params?: any) => {
  console.log('👨‍⚕️ GET /users/veterinarians');
  return axios.get('/users/veterinarians', { params });
};

export const getUserRequest = (id: string) => {
  console.log('👤 GET /users/' + id);
  return axios.get(`/users/${id}`);
};

export const updateUserRequest = (id: string, userData: any) => {
  console.log('✏️ PUT /users/' + id);
  return axios.put(`/users/${id}`, userData);
};

export const deleteUserRequest = (id: string) => {
  console.log('🗑️ DELETE /users/' + id);
  return axios.delete(`/users/${id}`);
};