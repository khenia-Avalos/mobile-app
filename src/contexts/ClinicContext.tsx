// src/contexts/ClinicContext.tsx
import React, { createContext, useState, useContext, useCallback } from 'react';
import * as clinicApi from '../api/clinic';

interface ClinicContextType {
  // Estado
  clients: any[];
  appointments: any[];
  selectedClient: any | null;
  loading: boolean;
  error: string | null;
  
  // Clientes
  fetchClients: (params?: any) => Promise<void>;
  fetchClient: (id: string) => Promise<any>;
  createClient: (client: any) => Promise<{ ok: boolean }>;
  updateClient: (id: string, client: any) => Promise<{ ok: boolean }>;
  deleteClient: (id: string) => Promise<{ ok: boolean }>;
  
  // Citas
  fetchAppointments: (params?: any) => Promise<void>;
  fetchAppointmentsByRange: (startDate: string, endDate: string) => Promise<any[]>;
  createAppointment: (appointment: any) => Promise<{ ok: boolean }>;
  updateAppointment: (id: string, appointment: any) => Promise<{ ok: boolean }>;
  
  // Historial
  fetchClientHistory: (clientId: string) => Promise<any>;
  createHistoryRecord: (record: any) => Promise<{ ok: boolean }>;
  
  // Utilidades
  clearError: () => void;
  setSelectedClient: (client: any) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async (params?: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.getClientsRequest(params);
      setClients(response.data.clients || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClient = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await clinicApi.getClientRequest(id);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar cliente');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (client: any) => {
    setLoading(true);
    try {
      await clinicApi.createClientRequest(client);
      await fetchClients(); // Refrescar lista
      setError(null);
      return { ok: true };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear cliente');
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [fetchClients]);

  const fetchAppointments = useCallback(async (params?: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.getAppointmentsRequest(params);
      setAppointments(response.data.appointments || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAppointmentsByRange = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      const response = await clinicApi.getAppointmentsByRangeRequest(startDate, endDate);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar citas');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppointment = useCallback(async (appointment: any) => {
    setLoading(true);
    try {
      await clinicApi.createAppointmentRequest(appointment);
      await fetchAppointments(); // Refrescar lista
      setError(null);
      return { ok: true };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear cita');
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const fetchClientHistory = useCallback(async (clientId: string) => {
    setLoading(true);
    try {
      const response = await clinicApi.getClientHistoryRequest(clientId);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar historial');
      return { history: [], clientInfo: null };
    } finally {
      setLoading(false);
    }
  }, []);

  const createHistoryRecord = useCallback(async (record: any) => {
    setLoading(true);
    try {
      await clinicApi.createHistoryRecordRequest(record);
      setError(null);
      return { ok: true };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear registro');
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <ClinicContext.Provider
      value={{
        clients,
        appointments,
        selectedClient,
        loading,
        error,
        fetchClients,
        fetchClient,
        createClient,
        updateClient: async (id: string, client: any) => {
          try {
            await clinicApi.updateClientRequest(id, client);
            await fetchClients();
            return { ok: true };
          } catch (err: any) {
            setError(err.response?.data?.message || 'Error al actualizar');
            return { ok: false };
          }
        },
        deleteClient: async (id: string) => {
          try {
            await clinicApi.deleteClientRequest(id);
            await fetchClients();
            return { ok: true };
          } catch (err: any) {
            setError(err.response?.data?.message || 'Error al eliminar');
            return { ok: false };
          }
        },
        fetchAppointments,
        fetchAppointmentsByRange,
        createAppointment,
        updateAppointment: async (id: string, appointment: any) => {
          try {
            await clinicApi.updateAppointmentRequest(id, appointment);
            await fetchAppointments();
            return { ok: true };
          } catch (err: any) {
            setError(err.response?.data?.message || 'Error al actualizar');
            return { ok: false };
          }
        },
        fetchClientHistory,
        createHistoryRecord,
        clearError,
        setSelectedClient
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within ClinicProvider');
  }
  return context;
};