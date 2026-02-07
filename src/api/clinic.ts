// src/api/clinic.ts
import axios from './axios';

// Clientes
export const getClientsRequest = (params?: any) => 
  axios.get('/clients', { params });
export const getClientRequest = (id: string) => 
  axios.get(`/clients/${id}`);
export const createClientRequest = (client: any) => 
  axios.post('/clients', client);
export const updateClientRequest = (id: string, client: any) => 
  axios.put(`/clients/${id}`, client);
export const deleteClientRequest = (id: string) => 
  axios.delete(`/clients/${id}`);
export const getClientStatsRequest = () => 
  axios.get('/clients/stats');

// Citas
export const getAppointmentsRequest = (params?: any) => 
  axios.get('/appointments', { params });
export const getAppointmentsByRangeRequest = (startDate: string, endDate: string) => 
  axios.get('/appointments/range', { params: { startDate, endDate } });
export const createAppointmentRequest = (appointment: any) => 
  axios.post('/appointments', appointment);
export const updateAppointmentRequest = (id: string, appointment: any) => 
  axios.put(`/appointments/${id}`, appointment);
export const updateAppointmentStatusRequest = (id: string, status: string) => 
  axios.patch(`/appointments/${id}/status`, { status });
export const getAppointmentStatsRequest = () => 
  axios.get('/appointments/stats');

// Historial médico
export const getClientHistoryRequest = (clientId: string, params?: any) => 
  axios.get(`/history/client/${clientId}`, { params });
export const createHistoryRecordRequest = (record: any) => 
  axios.post('/history', record);
export const getHistoryRecordRequest = (id: string) => 
  axios.get(`/history/${id}`);
export const updateHistoryRecordRequest = (id: string, record: any) => 
  axios.put(`/history/${id}`, record);
export const getHistorySummaryRequest = (clientId?: string) => 
  axios.get(`/history/summary/${clientId || ''}`);