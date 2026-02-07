import React, { createContext, useState, useContext, useCallback } from 'react';
import * as clinicApi from '../api/clinic';

interface ClinicContextType {
  // Estado
  owners: any[];
  pets: any[];
  appointments: any[];
  selectedOwner: any | null;
  selectedPet: any | null;
  loading: boolean;
  error: string | null;
  
  // Dueños
  fetchOwners: (params?: any) => Promise<void>;
  fetchOwner: (id: string) => Promise<any>;
  createOwner: (owner: any) => Promise<{ success: boolean; data?: any }>;
  updateOwner: (id: string, owner: any) => Promise<{ success: boolean; data?: any }>;
  
  // Mascotas
  fetchPets: (params?: any) => Promise<void>;
  fetchPet: (id: string) => Promise<any>;
  createPet: (pet: any) => Promise<{ success: boolean; data?: any }>;
  updatePet: (id: string, pet: any) => Promise<{ success: boolean; data?: any }>;
  
  // Citas
  fetchAppointments: (params?: any) => Promise<void>;
  fetchAppointment: (id: string) => Promise<any>;
  createAppointment: (appointment: any) => Promise<{ success: boolean; data?: any }>;
  updateAppointment: (id: string, appointment: any) => Promise<{ success: boolean; data?: any }>;
  updateAppointmentStatus: (id: string, status: string) => Promise<{ success: boolean; data?: any }>;
  
  // Utilidades
  clearError: () => void;
  setSelectedOwner: (owner: any) => void;
  setSelectedPet: (pet: any) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [owners, setOwners] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dueños
  const fetchOwners = useCallback(async (params?: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.getOwnersRequest(params);
      setOwners(response.data.owners || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar dueños');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwner = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await clinicApi.getOwnerRequest(id);
      setError(null);
      return response.data.owner;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar dueño');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOwner = useCallback(async (owner: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.createOwnerRequest(owner);
      await fetchOwners(); // Refrescar lista
      setError(null);
      return { 
        success: true, 
        data: response.data.owner,
        message: response.data.message 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al crear dueño';
      setError(errorMsg);
      return { 
        success: false, 
        message: errorMsg 
      };
    } finally {
      setLoading(false);
    }
  }, [fetchOwners]);

  // Mascotas
  const fetchPets = useCallback(async (params?: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.getPetsRequest(params);
      setPets(response.data.pets || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar mascotas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPet = useCallback(async (pet: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.createPetRequest(pet);
      await fetchPets(); // Refrescar lista
      setError(null);
      return { 
        success: true, 
        data: response.data.pet,
        message: response.data.message 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al crear mascota';
      setError(errorMsg);
      return { 
        success: false, 
        message: errorMsg 
      };
    } finally {
      setLoading(false);
    }
  }, [fetchPets]);

  // Citas
  const fetchAppointments = useCallback(async (params?: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.getAppointmentsRequest(params);
      setAppointments(response.data.appointments || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppointment = useCallback(async (appointment: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.createAppointmentRequest(appointment);
      await fetchAppointments(); // Refrescar lista
      setError(null);
      return { 
        success: true, 
        data: response.data.appointment,
        message: response.data.message 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al crear cita';
      setError(errorMsg);
      return { 
        success: false, 
        message: errorMsg 
      };
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const updateAppointmentStatus = useCallback(async (id: string, status: string) => {
    setLoading(true);
    try {
      const response = await clinicApi.updateAppointmentStatusRequest(id, status);
      // Actualizar en el estado local
      setAppointments(prev => prev.map(apt => 
        apt._id === id ? { ...apt, status } : apt
      ));
      setError(null);
      return { 
        success: true, 
        data: response.data.appointment,
        message: response.data.message 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar estado';
      setError(errorMsg);
      return { 
        success: false, 
        message: errorMsg 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);


  
const deleteOwner = useCallback(async (id: string) => {
  setLoading(true);
  try {
    const response = await clinicApi.deleteOwnerRequest(id);
    await fetchOwners(); // Refrescar lista
    setError(null);
    return { 
      success: true, 
      message: response.data?.message || 'Cliente eliminado'
    };
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Error al eliminar cliente';
    setError(errorMsg);
    return { 
      success: false, 
      message: errorMsg 
    };
  } finally {
    setLoading(false);
  }
}, [fetchOwners]);

  return (
    <ClinicContext.Provider
      value={{
        owners,
        pets,
        appointments,
        selectedOwner,
        selectedPet,
        loading,
        error,  
        fetchOwners,
        fetchOwner,
        createOwner,
         deleteOwner, 

        updateOwner: async (id: string, owner: any) => {
          try {
            const response = await clinicApi.updateOwnerRequest(id, owner);
            await fetchOwners();
            return { 
              success: true, 
              data: response.data.owner,
              message: response.data.message 
            };
          } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Error al actualizar';
            setError(errorMsg);
            return { success: false, message: errorMsg };
          }
        },
        fetchPets,
        fetchPet: async (id: string) => {
          try {
            const response = await clinicApi.getPetRequest(id);
            return response.data.pet;
          } catch (err: any) {
            setError(err.response?.data?.message || 'Error al cargar mascota');
            return null;
          }
        },
        createPet,
        updatePet: async (id: string, pet: any) => {
          try {
            const response = await clinicApi.updatePetRequest(id, pet);
            await fetchPets();
            return { 
              success: true, 
              data: response.data.pet,
              message: response.data.message 
            };
          } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Error al actualizar';
            setError(errorMsg);
            return { success: false, message: errorMsg };
          }
        },
        fetchAppointments,
        fetchAppointment: async (id: string) => {
          try {
            const response = await clinicApi.getAppointmentRequest(id);
            return response.data.appointment;
          } catch (err: any) {
            setError(err.response?.data?.message || 'Error al cargar cita');
            return null;
          }
        },
        createAppointment,
        updateAppointment: async (id: string, appointment: any) => {
          try {
            const response = await clinicApi.updateAppointmentRequest(id, appointment);
            await fetchAppointments();
            return { 
              success: true, 
              data: response.data.appointment,
              message: response.data.message 
            };
          } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Error al actualizar';
            setError(errorMsg);
            return { success: false, message: errorMsg };
          }
        },
        updateAppointmentStatus,
        clearError,
        setSelectedOwner,
        setSelectedPet
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