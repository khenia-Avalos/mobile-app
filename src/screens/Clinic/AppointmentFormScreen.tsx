// mobile-app/src/screens/Clinic/AppointmentFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../api/axios-mobile';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  AppointmentForm: { id?: string; petId?: string; ownerId?: string };
};

type AppointmentFormScreenRouteProp = RouteProp<RootStackParamList, 'AppointmentForm'>;
type AppointmentFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AppointmentForm'>;

export default function AppointmentFormScreen() {
  const navigation = useNavigation<AppointmentFormScreenNavigationProp>();
  const route = useRoute<AppointmentFormScreenRouteProp>();
  const { user, logout } = useAuth();
  const { 
    owners, 
    pets, 
    createAppointment, 
    updateAppointment,
    fetchOwners,
    fetchPets,
    loading 
  } = useClinic();
  
  const { id, petId, ownerId } = route.params || {};
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    appointmentDate: new Date(),
    startTime: '',
    endTime: '',
    type: 'consulta',
    service: '',
    price: '',
    notes: '',
    pet: petId || '',
    owner: ownerId || '',
    veterinarian: ''
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [showVetModal, setShowVetModal] = useState(false);
  const [showTimeSlotsModal, setShowTimeSlotsModal] = useState(false);
  
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [selectedVet, setSelectedVet] = useState<any>(null);
  const [ownerPets, setOwnerPets] = useState<any[]>([]);
  
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [loadingVets, setLoadingVets] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    if (id) {
      loadAppointment();
    }
  }, [id]);

  const loadData = async () => {
    await Promise.all([
      fetchOwners(),
      fetchPets()
    ]);
    
    if (ownerId) {
      const owner = owners.find(o => o._id === ownerId);
      if (owner) {
        handleSelectOwner(owner);
      }
    }
    
    if (petId) {
      const pet = pets.find(p => p._id === petId);
      if (pet) {
        handleSelectPet(pet);
      }
    }
  };

  const loadAppointment = async () => {
    if (!id) return;
    Alert.alert('Info', 'Carga de cita existente - Funcionalidad por implementar');
  };

  // ✅ Cargar veterinarios SOLO cuando se presiona el botón
  const loadAvailableVeterinarians = async () => {
    if (!formData.appointmentDate) {
      Alert.alert('Error', 'Primero selecciona una fecha');
      return;
    }
    
    setLoadingVets(true);
    try {
      const dateStr = formData.appointmentDate.toISOString().split('T')[0];
      console.log('📅 Buscando veterinarios para fecha:', dateStr);
      
      const response = await axios.get(`/api/veterinarians/available`, {
        params: { date: dateStr }
      });
      
      if (response.data.success) {
        const vets = response.data.veterinarians || [];
        
        const formattedVets = vets.map((vet: any) => ({
          _id: vet._id,
          id: vet._id,
          username: vet.username || 'Veterinario',
          email: vet.email || '',
          specialty: vet.specialty || 'Medicina General',
          available: vet.available || false,
          availableSlots: vet.availableSlots || [],
          reason: vet.reason || ''
        }));
        
        setVeterinarians(formattedVets);
        
        if (formattedVets.length === 0) {
          Alert.alert('Información', 'No hay veterinarios registrados.', [{ text: 'OK' }]);
        } else {
          const availableCount = formattedVets.filter((v: any) => v.available).length;
          if (availableCount === 0) {
            Alert.alert('Sin disponibilidad', 'No hay veterinarios disponibles para esta fecha.', [{ text: 'OK' }]);
          }
          setShowVetModal(true);
        }
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'No se pudieron cargar los veterinarios');
    } finally {
      setLoadingVets(false);
    }
  };

  // ✅ Cargar horarios con verificación ESTRICTA de ocupados
  const loadVeterinarianTimeSlots = async (vetId: string) => {
    if (!formData.appointmentDate || !vetId) return;
    
    setLoadingSlots(true);
    try {
      const dateStr = formData.appointmentDate.toISOString().split('T')[0];
      console.log('⏰ Buscando horarios para veterinario:', vetId, 'fecha:', dateStr);
      
      // 1. Obtener slots disponibles del backend
      const response = await axios.get(`/api/veterinarians/${vetId}/availability`, {
        params: { date: dateStr }
      });
      
      // 2. Obtener citas existentes para esta fecha
      const appointmentsResponse = await axios.get(`/api/veterinarians/${vetId}/appointments`, {
        params: { date: dateStr }
      });
      
      const appointments = appointmentsResponse.data?.appointments || [];
      
      // 3. Crear mapa de horarios ocupados
      const occupiedMap = new Map();
      appointments.forEach((apt: any) => {
        if (['scheduled', 'confirmed', 'in-progress'].includes(apt.status)) {
          const key = `${apt.startTime}-${apt.endTime}`;
          occupiedMap.set(key, true);
        }
      });
      
      console.log('🚫 Horarios ocupados:', Array.from(occupiedMap.keys()));
      setOccupiedSlots(appointments);
      
      // 4. Marcar slots como disponibles SOLO si no están ocupados
      const slots = response.data.availableSlots || [];
      const formattedSlots = slots.map((slot: any) => {
        const slotKey = `${slot.start}-${slot.end}`;
        const isOccupied = occupiedMap.has(slotKey);
        
        return {
          start: slot.start,
          end: slot.end,
          available: !isOccupied,
          occupied: isOccupied
        };
      });
      
      console.log('🕒 Slots con disponibilidad real:', 
        formattedSlots.filter((s: any) => s.available).map((s: any) => `${s.start}-${s.end}`)
      );
      
      setAvailableTimeSlots(formattedSlots);
      
      if (formattedSlots.length === 0) {
        Alert.alert('Sin horarios', 'No hay horarios configurados.', [{ text: 'OK' }]);
      } else {
        const availableCount = formattedSlots.filter((s: any) => s.available).length;
        if (availableCount === 0) {
          Alert.alert('Horario ocupado', 'Todos los horarios están ocupados.', [{ text: 'OK' }]);
        } else {
          setShowTimeSlotsModal(true);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading time slots:', error);
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectOwner = (owner: any) => {
    setSelectedOwner(owner);
    setFormData(prev => ({ ...prev, owner: owner._id }));
    const ownerPets = pets.filter(pet => pet.owner?._id === owner._id);
    setOwnerPets(ownerPets);
    setShowOwnerModal(false);
  };

  const handleSelectPet = (pet: any) => {
    setSelectedPet(pet);
    setFormData(prev => ({ 
      ...prev, 
      pet: pet._id,
      owner: pet.owner?._id || prev.owner
    }));
    
    if (!selectedOwner && pet.owner) {
      const owner = owners.find(o => o._id === pet.owner._id);
      if (owner) {
        setSelectedOwner(owner);
      }
    }
    
    setShowPetModal(false);
  };

  const handleSelectVeterinarian = (vet: any) => {
    setSelectedVet(vet);
    setFormData(prev => ({ ...prev, veterinarian: vet._id }));
    loadVeterinarianTimeSlots(vet._id);
    setShowVetModal(false);
  };

  const handleSelectTimeSlot = (slot: any) => {
    if (!slot.available) {
      Alert.alert('Horario no disponible', 'Este horario ya está ocupado');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      startTime: slot.start,
      endTime: slot.end
    }));
    setShowTimeSlotsModal(false);
    
    Alert.alert('Horario seleccionado', `✅ ${slot.start} - ${slot.end}`, [{ text: 'OK' }]);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setFormData({ 
        ...formData, 
        appointmentDate: date,
        veterinarian: '',
        startTime: '',
        endTime: ''
      });
      setSelectedVet(null);
      setVeterinarians([]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }
    
    if (!formData.pet) {
      Alert.alert('Error', 'Selecciona un paciente');
      return;
    }
    
    if (!formData.veterinarian) {
      Alert.alert('Error', 'Selecciona un veterinario');
      return;
    }
    
    if (!formData.startTime || !formData.endTime) {
      Alert.alert('Error', 'Selecciona un horario');
      return;
    }

    // Verificación final de disponibilidad
    const isStillAvailable = !occupiedSlots.some((apt: any) => 
      apt.startTime === formData.startTime && apt.endTime === formData.endTime
    );

    if (!isStillAvailable) {
      Alert.alert('Error', 'Este horario ya no está disponible. Por favor selecciona otro.');
      loadVeterinarianTimeSlots(formData.veterinarian);
      return;
    }

    const appointmentData = {
      ...formData,
      appointmentDate: formData.appointmentDate.toISOString(),
      price: parseFloat(formData.price) || 0
    };

    try {
      let result;
      if (isEditing && id) {
        result = await updateAppointment(id, appointmentData);
      } else {
        result = await createAppointment(appointmentData);
      }
      
      if (result.success) {
        Alert.alert(
          '✅ Éxito',
          isEditing ? 'Cita actualizada correctamente' : 'Cita creada correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('❌ Error', result.message || 'No se pudo guardar la cita');
      }
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('❌ Error', error.message || 'Ocurrió un error al guardar la cita');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const appointmentTypes = [
    { value: 'consulta', label: 'Consulta General' },
    { value: 'vacunacion', label: 'Vacunación' },
    { value: 'cirugia', label: 'Cirugía' },
    { value: 'grooming', label: 'Estética' },
    { value: 'urgencia', label: 'Urgencia' },
    { value: 'seguimiento', label: 'Seguimiento' },
    { value: 'otros', label: 'Otros' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Cita' : 'Nueva Cita'}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Título */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Vacunación anual"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        {/* Fecha */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.selectorTextSelected}>
              {formatDate(formData.appointmentDate)}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Veterinario - AHORA con clic manual */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Veterinario *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={loadAvailableVeterinarians}
            disabled={loadingVets}
          >
            {loadingVets ? (
              <ActivityIndicator size="small" color="#0891b2" />
            ) : (
              <>
                <Text style={formData.veterinarian ? styles.selectorTextSelected : styles.selectorText}>
                  {selectedVet 
                    ? `${selectedVet.username} (${selectedVet.specialty || 'Veterinario'})`
                    : '🔍 Toca para buscar veterinarios'}
                </Text>
                <Text style={styles.selectorArrow}>▼</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.helperText}>
            {formData.appointmentDate 
              ? `Buscar veterinarios disponibles para ${formData.appointmentDate.toLocaleDateString()}`
              : 'Selecciona una fecha primero'}
          </Text>
        </View>

        {/* Horario - AHORA con verificación en tiempo real */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Horario *</Text>
          <TouchableOpacity 
            style={[styles.selector, !formData.veterinarian && styles.selectorDisabled]}
            onPress={() => {
              if (formData.veterinarian && selectedVet) {
                loadVeterinarianTimeSlots(selectedVet._id);
              }
            }}
            disabled={!formData.veterinarian}
          >
            <Text style={formData.startTime ? styles.selectorTextSelected : styles.selectorText}>
              {formData.startTime 
                ? `${formData.startTime} - ${formData.endTime}`
                : '🔍 Toca para ver horarios disponibles'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            {!formData.veterinarian 
              ? 'Primero selecciona un veterinario'
              : 'Toca para ver horarios REALMENTE disponibles'}
          </Text>
        </View>

        {/* Dueño */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dueño *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowOwnerModal(true)}
            disabled={!!ownerId}
          >
            <Text style={formData.owner ? styles.selectorTextSelected : styles.selectorText}>
              {selectedOwner 
                ? `${selectedOwner.firstName} ${selectedOwner.lastName}`
                : ownerId ? 'Cargando...' : 'Seleccionar dueño'}
            </Text>
            {!ownerId && <Text style={styles.selectorArrow}>▼</Text>}
          </TouchableOpacity>
        </View>

        {/* Mascota */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Paciente *</Text>
          <TouchableOpacity 
            style={[styles.selector, !formData.owner && styles.selectorDisabled]}
            onPress={() => setShowPetModal(true)}
            disabled={!formData.owner}
          >
            <Text style={formData.pet ? styles.selectorTextSelected : styles.selectorText}>
              {selectedPet 
                ? `${selectedPet.name} (${selectedPet.species})`
                : petId ? 'Cargando...' : 'Seleccionar mascota'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Tipo de cita */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de cita</Text>
          <View style={styles.typeGrid}>
            {appointmentTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  formData.type === type.value && styles.typeButtonSelected
                ]}
                onPress={() => setFormData({ ...formData, type: type.value })}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.type === type.value && styles.typeButtonTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detalles de la cita..."
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Precio */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Precio ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Notas */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notas adicionales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notas importantes..."
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Botones */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, (loading || loadingVets) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || loadingVets}
          >
            {loading || loadingVets ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Actualizar' : 'Crear Cita'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.appointmentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Modal de Veterinarios */}
      <Modal
        visible={showVetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVetModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Veterinario</Text>
              <TouchableOpacity onPress={() => setShowVetModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loadingVets ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0891b2" />
                <Text style={styles.loadingText}>Buscando veterinarios...</Text>
              </View>
            ) : (
              <FlatList
                data={veterinarians}
                keyExtractor={(item) => item._id || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, !item.available && styles.modalItemDisabled]}
                    onPress={() => item.available && handleSelectVeterinarian(item)}
                    disabled={!item.available}
                  >
                    <View style={styles.vetInfo}>
                      <Text style={styles.modalItemText}>
                        {item.username} {item.specialty && `- ${item.specialty}`}
                      </Text>
                      <Text style={styles.modalItemSubtext}>{item.email}</Text>
                      <View style={styles.availabilityIndicator}>
                        <View style={[
                          styles.availabilityDot,
                          item.available ? styles.availableDot : styles.unavailableDot
                        ]} />
                        <Text style={styles.availabilityText}>
                          {item.available ? '🟢 Disponible' : '🔴 No disponible'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyModalText}>
                      No hay veterinarios disponibles
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyButton}
                      onPress={() => setShowVetModal(false)}
                    >
                      <Text style={styles.emptyButtonText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Horarios - AHORA con indicador visual de ocupados */}
      <Modal
        visible={showTimeSlotsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimeSlotsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Horarios de {selectedVet?.username}
              </Text>
              <TouchableOpacity onPress={() => setShowTimeSlotsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loadingSlots ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0891b2" />
                <Text style={styles.loadingText}>Cargando horarios...</Text>
              </View>
            ) : (
              <FlatList
                data={availableTimeSlots}
                keyExtractor={(item, index) => `${item.start}-${item.end}-${index}`}
                numColumns={2}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.timeSlotItem,
                      !item.available && styles.timeSlotItemOccupied,
                      item.available && styles.timeSlotItemAvailable
                    ]}
                    onPress={() => handleSelectTimeSlot(item)}
                    disabled={!item.available}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      !item.available && styles.timeSlotTextOccupied
                    ]}>
                      {item.start} - {item.end}
                    </Text>
                    <View style={styles.timeSlotStatusContainer}>
                      <View style={[
                        styles.timeSlotDot,
                        item.available ? styles.timeSlotDotAvailable : styles.timeSlotDotOccupied
                      ]} />
                      <Text style={[
                        styles.timeSlotStatusText,
                        item.available ? styles.timeSlotTextAvailable : styles.timeSlotTextOccupied
                      ]}>
                        {item.available ? 'Disponible' : 'Ocupado'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                columnWrapperStyle={styles.timeSlotGrid}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyModalText}>
                      No hay horarios disponibles
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Dueños */}
      <Modal
        visible={showOwnerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOwnerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Dueño</Text>
              <TouchableOpacity onPress={() => setShowOwnerModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={owners}
              keyExtractor={(item) => item._id || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectOwner(item)}
                >
                  <Text style={styles.modalItemText}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.modalItemSubtext}>
                    {item.phone || 'Sin teléfono'} • {item.pets?.length || 0} mascotas
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>No hay dueños registrados</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Mascotas */}
      <Modal
        visible={showPetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPetModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Mascota</Text>
              <TouchableOpacity onPress={() => setShowPetModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={ownerPets}
              keyExtractor={(item) => item._id || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectPet(item)}
                >
                  <Text style={styles.modalItemText}>
                    {item.name} ({item.species})
                  </Text>
                  <Text style={styles.modalItemSubtext}>
                    {item.breed || 'Sin raza'} • {item.color || 'Sin color'}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>
                  Este dueño no tiene mascotas registradas
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0f766e',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  selector: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  selectorText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  selectorTextSelected: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  typeButtonSelected: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeButtonTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#0f766e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalClose: {
    fontSize: 24,
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemDisabled: {
    backgroundColor: '#f8fafc',
    opacity: 0.6,
  },
  vetInfo: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availableDot: {
    backgroundColor: '#10b981',
  },
  unavailableDot: {
    backgroundColor: '#ef4444',
  },
  availabilityText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyModalText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
  },
  timeSlotGrid: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeSlotItem: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    margin: 4,
    borderWidth: 1,
  },
  timeSlotItemAvailable: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  timeSlotItemOccupied: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    opacity: 0.7,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeSlotTextOccupied: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  timeSlotStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeSlotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeSlotDotAvailable: {
    backgroundColor: '#10b981',
  },
  timeSlotDotOccupied: {
    backgroundColor: '#ef4444',
  },
  timeSlotStatusText: {
    fontSize: 10,
  },
  timeSlotTextAvailable: {
    color: '#10b981',
  },
});

// Funciones auxiliares fuera del componente
const getStatusColor = (status: string) => {
  switch(status) {
    case 'scheduled': return '#3b82f6';
    case 'confirmed': return '#10b981';
    case 'in-progress': return '#f59e0b';
    case 'completed': return '#6b7280';
    case 'cancelled': return '#ef4444';
    case 'no-show': return '#8b5cf6';
    default: return '#9ca3af';
  }
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'scheduled': 'Programada',
    'confirmed': 'Confirmada',
    'in-progress': 'En progreso',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'no-show': 'No asistió'
  };
  return statusMap[status] || status;
};