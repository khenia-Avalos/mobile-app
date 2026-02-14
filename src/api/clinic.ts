// mobile-app/src/api/clinic.ts
import axios from './axios-mobile';

console.log('🏥 Clinic API usando axios-mobile');

// ============ OWNERS ============
export const getOwnersRequest = (params?: any) => {
  console.log('📋 GET /api/owners', params);
  return axios.get('/api/owners', { params });
};

export const getOwnerRequest = (id: string) => {
  console.log('👤 GET /api/owners/' + id);
  return axios.get(`/api/owners/${id}`);
};

export const createOwnerRequest = (owner: any) => {
  console.log('➕ POST /api/owners', owner);
  return axios.post('/api/owners', owner);
};

export const updateOwnerRequest = (id: string, owner: any) => {
  console.log('✏️ PUT /api/owners/' + id);
  return axios.put(`/api/owners/${id}`, owner);
};

export const deleteOwnerRequest = (id: string) => {
  console.log('🗑️ DELETE /api/owners/' + id);
  return axios.delete(`/api/owners/${id}`);
};

// ============ PETS ============
export const getPetsRequest = (params?: any) => {
  console.log('🐕 GET /api/pets', params);
  return axios.get('/api/pets', { params });
};

export const getPetRequest = (id: string) => {
  console.log('🐾 GET /api/pets/' + id);
  return axios.get(`/api/pets/${id}`);
};

export const createPetRequest = (pet: any) => {
  console.log('🐶 POST /api/pets', pet);
  return axios.post('/api/pets', pet);
};

export const updatePetRequest = (id: string, pet: any) => {
  console.log('✏️ PUT /api/pets/' + id);
  return axios.put(`/api/pets/${id}`, pet);
};

export const deletePetRequest = (id: string) => {
  console.log('🗑️ DELETE /api/pets/' + id);
  return axios.delete(`/api/pets/${id}`);
};

// ============ APPOINTMENTS ============
export const getAppointmentsRequest = (params?: any) => {
  console.log('📅 GET /api/appointments', params);
  return axios.get('/api/appointments', { params });
};

export const getAppointmentRequest = (id: string) => {
  console.log('📋 GET /api/appointments/' + id);
  return axios.get(`/api/appointments/${id}`);
};

export const createAppointmentRequest = (appointment: any) => {
  console.log('➕ POST /api/appointments', appointment);
  return axios.post('/api/appointments', appointment);
};

export const updateAppointmentRequest = (id: string, appointment: any) => {
  console.log('✏️ PUT /api/appointments/' + id);
  return axios.put(`/api/appointments/${id}`, appointment);
};

export const updateAppointmentStatusRequest = (id: string, status: string) => {
  console.log('🔄 PATCH /api/appointments/' + id + '/status');
  return axios.patch(`/api/appointments/${id}/status`, { status });
};

export const deleteAppointmentRequest = (id: string) => {
  console.log('🗑️ DELETE /api/appointments/' + id);
  return axios.delete(`/api/appointments/${id}`);
};

// ============ VETERINARIANS ============
export const getAvailableVeterinariansRequest = (params?: any) => {
  console.log('👨‍⚕️ GET /api/veterinarians/available', params);
  return axios.get('/api/veterinarians/available', { params });
};

export const getVeterinarianAvailabilityRequest = (veterinarianId: string, date: string) => {
  console.log('📅 GET /api/veterinarians/' + veterinarianId + '/availability');
  return axios.get(`/api/veterinarians/${veterinarianId}/availability?date=${date}`);
};

export const getVeterinarianAppointmentsRequest = (veterinarianId: string, params?: any) => {
  console.log('📋 GET /api/veterinarians/' + veterinarianId + '/appointments');
  return axios.get(`/api/veterinarians/${veterinarianId}/appointments`, { params });
};

// ============ USERS ============
export const getUsersRequest = (params?: any) => {
  console.log('👥 GET /api/users', params);
  return axios.get('/api/users', { params });
};

export const getVeterinariansRequest = (params?: any) => {
  console.log('👨‍⚕️ GET /api/users/veterinarians');
  return axios.get('/api/users/veterinarians', { params });
};