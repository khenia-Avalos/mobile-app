import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import * as clinicApi from '../api/clinic';
import { useAuth } from '../hooks/useAuth';
//este codigo define el contexto de la clinica, con todas las funciones para manejar los datos de clientes, mascotas y citas. Es el corazón de la app, donde se centraliza toda la logica de negocio y se comparte entre los componentes.

interface ClinicContextType {
  owners: any[];
  pets: any[];
  appointments: any[];
  selectedOwner: any;
  selectedPet: any;
  loading: boolean;
  error: string | null;
  fetchOwners: () => Promise<any[]>;
  fetchOwner: (id: string) => Promise<any>;
  createOwner: (owner: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  updateOwner: (id: string, owner: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  deleteOwner: (id: string) => Promise<{ success: boolean; message?: string }>;
  createPet: (pet: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  updatePet: (id: string, pet: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  deletePet: (id: string) => Promise<{ success: boolean; message?: string }>;
  fetchPet: (id: string) => Promise<any>;
  fetchPets: (params?: any) => Promise<any[]>;
  fetchAppointments: (params?: any) => Promise<any[]>;
  createAppointment: (appointment: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  updateAppointment: (id: string, appointment: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  deleteAppointment: (id: string) => Promise<{ success: boolean; message?: string }>;
  setSelectedOwner: (owner: any) => void;
  setSelectedPet: (pet: any) => void;
  clearError: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [owners, setOwners] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============ OWNERS ============
  const fetchOwners = useCallback(async () => {
    setLoading(true);
    try {
      const response = await clinicApi.getOwnersRequest();
      const ownersData = response.data?.owners || [];
      console.log('📋 Owners cargados:', ownersData.length);
      setOwners(ownersData);
      setError(null);
      return ownersData;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar clientes';
      console.error('Error fetching owners:', errorMsg);
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwner = useCallback(async (id: string) => {
    try {
      const response = await clinicApi.getOwnerRequest(id);
      return response.data?.owner || response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar cliente';
      console.error('Error fetching owner:', errorMsg);
      setError(errorMsg);
      return null;
    }
  }, []);

  const createOwner = useCallback(async (owner: any) => {
    setLoading(true);
    try {
      const ownerData = {
        ...owner,
        userId: user?._id
      };
      
      const response = await clinicApi.createOwnerRequest(ownerData);
      const newOwner = response.data?.owner || response.data;
      setOwners(prev => [...prev, newOwner]);
      setError(null);
      console.log('✅ Owner creado:', newOwner._id);
      return { 
        success: true, 
        data: newOwner, 
        message: response.data?.message || 'Cliente creado exitosamente' 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al crear cliente';
      console.error('Error creating owner:', errorMsg);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateOwner = useCallback(async (id: string, owner: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.updateOwnerRequest(id, owner);
      const updatedOwner = response.data?.owner || response.data;
      setOwners(prev => prev.map(o => o._id === id ? updatedOwner : o));
      setError(null);
      console.log('✅ Owner actualizado:', id);
      return { 
        success: true, 
        data: updatedOwner, 
        message: response.data?.message || 'Cliente actualizado exitosamente' 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar cliente';
      console.error('Error updating owner:', errorMsg);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOwner = useCallback(async (id: string) => {
    setLoading(true);
    try {
      console.log('🗑️ Eliminando cliente:', id);
      const response = await clinicApi.deleteOwnerRequest(id);
      
      setOwners(prev => prev.filter(o => o._id !== id));
      setPets(prev => prev.filter(p => p.owner !== id && p.owner?._id !== id));
      
      setError(null);
      console.log('✅ Owner eliminado del estado:', id);
      
      return { 
        success: true, 
        message: response.data?.message || 'Cliente eliminado exitosamente' 
      };
    } catch (err: any) {
      let errorMsg = 'Error al eliminar cliente';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
        console.log('❌ Mensaje del backend:', errorMsg);
      }
      
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ PETS ============
  const fetchPets = useCallback(async (params?: any) => {
    try {
      const response = await clinicApi.getPetsRequest(params);
      const petsData = response.data?.pets || [];
      console.log('🐕 Pets cargados:', petsData.length);
      setPets(petsData);
      return petsData;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar mascotas';
      console.error('Error fetching pets:', errorMsg);
      setError(errorMsg);
      return [];
    }
  }, []);

  const createPet = useCallback(async (pet: any) => {
    setLoading(true);
    try {
      if (!pet.owner) throw new Error('El dueño es requerido');
      if (!pet.name?.trim()) throw new Error('El nombre es requerido');
      
      const petData: any = {
        name: pet.name.trim(),
        species: pet.species || 'Perro',
        breed: pet.breed || '',
        color: pet.color || '',
        gender: pet.gender || 'Desconocido',
        weight: pet.weight ? Number(pet.weight) : null,
        weightUnit: pet.weightUnit || 'kg',
        chipNumber: pet.chipNumber || '',
        allergies: Array.isArray(pet.allergies) ? pet.allergies : [],
        medications: Array.isArray(pet.medications) ? pet.medications : [],
        specialConditions: pet.specialConditions || '',
        notes: pet.notes || '',
        sterilized: pet.sterilized || false,
        owner: pet.owner,
      };

      if (pet.birthDate) {
        petData.birthDate = pet.birthDate instanceof Date 
          ? pet.birthDate 
          : new Date(pet.birthDate);
      }

      console.log('🐶 Enviando mascota:', JSON.stringify(petData, null, 2));
      
      const response = await clinicApi.createPetRequest(petData);
      const newPet = response.data?.pet || response.data;
      
      setPets(prev => [...prev, newPet]);
      setError(null);
      console.log('✅ Mascota creada:', newPet._id);
      
      return { 
        success: true, 
        data: newPet,
        message: response.data?.message || 'Mascota creada exitosamente' 
      };
    } catch (err: any) {
      let errorMsg = 'Error al crear mascota';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
        console.log('❌ Error del backend:', errorMsg);
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePet = useCallback(async (id: string, pet: any) => {
    setLoading(true);
    try {
      const petData = {
        ...pet,
        weight: pet.weight ? Number(pet.weight) : null,
        birthDate: pet.birthDate ? new Date(pet.birthDate) : null
      };
      
      const response = await clinicApi.updatePetRequest(id, petData);
      const updatedPet = response.data?.pet || response.data;
      setPets(prev => prev.map(p => p._id === id ? updatedPet : p));
      setError(null);
      console.log('✅ Pet actualizado:', id);
      
      return { 
        success: true, 
        data: updatedPet,
        message: response.data?.message || 'Mascota actualizada exitosamente' 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar mascota';
      console.error('Error updating pet:', errorMsg);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePet = useCallback(async (id: string) => {
    setLoading(true);
    try {
      console.log('🗑️ ELIMINANDO mascota:', id);
      const response = await clinicApi.deletePetRequest(id);
      
      setPets(prev => prev.filter(p => p._id !== id));
      setError(null);
      
      console.log('✅ Mascota eliminada del estado:', id);
      
      return { 
        success: true, 
        message: response.data?.message || 'Mascota eliminada exitosamente' 
      };
    } catch (err: any) {
      let errorMsg = 'Error al eliminar mascota';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
        console.log('❌ Mensaje del backend:', errorMsg);
      }
      
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPet = useCallback(async (id: string) => {
    try {
      const response = await clinicApi.getPetRequest(id);
      return response.data?.pet || response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar mascota';
      console.error('Error fetching pet:', errorMsg);
      setError(errorMsg);
      return null;
    }
  }, []);

  // ============ APPOINTMENTS ============
  const fetchAppointments = useCallback(async (params?: any) => {
    try {
      const response = await clinicApi.getAppointmentsRequest(params);
      const appointmentsData = response.data?.appointments || [];
      console.log('📅 Appointments cargados:', appointmentsData.length);
      setAppointments(appointmentsData);
      return appointmentsData;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar citas';
      console.error('Error fetching appointments:', errorMsg);
      setError(errorMsg);
      return [];
    }
  }, []);

  const createAppointment = useCallback(async (appointment: any) => {
    setLoading(true);
    try {
      const appointmentData = {
        ...appointment,
        userId: user?._id,
        appointmentDate: appointment.appointmentDate ? new Date(appointment.appointmentDate) : null
      };
      
      const response = await clinicApi.createAppointmentRequest(appointmentData);
      const newAppointment = response.data?.appointment || response.data;
      setAppointments(prev => [...prev, newAppointment]);
      setError(null);
      console.log('✅ Appointment creado:', newAppointment._id);
      
      return { 
        success: true, 
        data: newAppointment, 
        message: response.data?.message || 'Cita creada exitosamente' 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al crear cita';
      console.error('Error creating appointment:', errorMsg);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateAppointment = useCallback(async (id: string, appointment: any) => {
    setLoading(true);
    try {
      const response = await clinicApi.updateAppointmentRequest(id, appointment);
      const updatedAppointment = response.data?.appointment || response.data;
      setAppointments(prev => prev.map(a => a._id === id ? updatedAppointment : a));
      setError(null);
      console.log('✅ Appointment actualizado:', id);
      
      return { 
        success: true, 
        data: updatedAppointment, 
        message: response.data?.message || 'Cita actualizada exitosamente' 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar cita';
      console.error('Error updating appointment:', errorMsg);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await clinicApi.deleteAppointmentRequest(id);
      setAppointments(prev => prev.filter(a => a._id !== id));
      setError(null);
      console.log('✅ Appointment eliminado:', id);
      return { 
        success: true, 
        message: response.data?.message || 'Cita eliminada exitosamente' 
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar cita';
      console.error('Error deleting appointment:', errorMsg);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      fetchOwners();
      fetchPets();
      fetchAppointments();
    }
  }, [user]);

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
        updateOwner,
        deleteOwner,
        createPet,
        updatePet,
        deletePet,
        fetchPet,
        fetchPets,
        fetchAppointments,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        setSelectedOwner,
        setSelectedPet,
        clearError,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};