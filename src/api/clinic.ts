import axios from './axios';

// Owners API
export const getOwnersRequest = (params?: any) => 
  axios.get('/owners', { params });
export const getOwnerRequest = (id: string) => 
  axios.get(`/owners/${id}`);
export const createOwnerRequest = (owner: any) => 
  axios.post('/owners', owner);
export const updateOwnerRequest = (id: string, owner: any) => 
  axios.put(`/owners/${id}`, owner);
export const deleteOwnerRequest = (id: string) => 
  axios.delete(`/owners/${id}`);

// Pets API
export const getPetsRequest = (params?: any) => 
  axios.get('/pets', { params });
export const getPetRequest = (id: string) => 
  axios.get(`/pets/${id}`);
export const createPetRequest = (pet: any) => 
  axios.post('/pets', pet);
export const updatePetRequest = (id: string, pet: any) => 
  axios.put(`/pets/${id}`, pet);
export const deletePetRequest = (id: string) => 
  axios.delete(`/pets/${id}`);
export const addVaccinationRequest = (id: string, vaccination: any) => 
  axios.post(`/pets/${id}/vaccinations`, { vaccination });

// Appointments API
export const getAppointmentsRequest = (params?: any) => 
  axios.get('/appointments', { params });
export const getAppointmentRequest = (id: string) => 
  axios.get(`/appointments/${id}`);
export const createAppointmentRequest = (appointment: any) => 
  axios.post('/appointments', appointment);
export const updateAppointmentRequest = (id: string, appointment: any) => 
  axios.put(`/appointments/${id}`, appointment);
export const updateAppointmentStatusRequest = (id: string, status: string) => 
  axios.patch(`/appointments/${id}/status`, { status });
export const deleteAppointmentRequest = (id: string) => 
  axios.delete(`/appointments/${id}`);
export const getAppointmentsStatsRequest = () => 
  axios.get('/appointments/stats');