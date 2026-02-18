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

// ✅ Función para obtener fecha en formato YYYY-MM-DD en zona horaria de Costa Rica
const getDateInCRFormat = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  return date.toLocaleDateString('en-CA', options);
};

const getCurrentTimeInCR = (): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Costa_Rica',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  return now.toLocaleTimeString('en-US', options);
};

const isTimeSlotInPast = (date: Date, timeStr: string): boolean => {
  const now = new Date();
  
  // Obtener fecha actual en Costa Rica
  const todayCR = getDateInCRFormat(now);
  const selectedDateCR = getDateInCRFormat(date);
  
  // Si la fecha seleccionada es hoy, verificar la hora
  if (selectedDateCR === todayCR) {
    // Obtener hora actual en Costa Rica
    const currentTimeCR = getCurrentTimeInCR();
    
    // Parsear horas y minutos
    const [slotHour, slotMinute] = timeStr.split(':').map(Number);
    const [currentHour, currentMinute] = currentTimeCR.split(':').map(Number);
    
    console.log(` Comparando horarios - Slot: ${timeStr} (${slotHour}:${slotMinute}) vs Actual: ${currentTimeCR} (${currentHour}:${currentMinute})`);
    
    // Comparar horas
    if (slotHour < currentHour) {
      console.log(` Horario ${timeStr} ya pasó (hora menor)`);
      return true;
    }
    if (slotHour === currentHour && slotMinute <= currentMinute) {
      console.log(` Horario ${timeStr} ya pasó (misma hora o minutos menores/iguales)`);
      return true;
    }
    
    console.log(` Horario ${timeStr} aún disponible`);
    return false;
  }
  
  // Si la fecha seleccionada es futura, el horario no ha pasado
  return false;
};

// Función para crear una fecha con zona horaria de Costa Rica
const createDateInCR = (year: number, month: number, day: number): Date => {
  // Crear fecha en UTC que represente correctamente el día en Costa Rica
  // Costa Rica es UTC-6, entonces para que sea medianoche en CR, necesitamos 6 AM UTC
  return new Date(Date.UTC(year, month, day, 6, 0, 0));
};

export default function AppointmentFormScreen() {
  const navigation = useNavigation<AppointmentFormScreenNavigationProp>();
  const route = useRoute<AppointmentFormScreenRouteProp>();
  const { user } = useAuth();
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
  
  //  Crear fecha inicial como hoy en Costa Rica
  const getInitialDate = () => {
    const now = new Date();
    const crDateStr = getDateInCRFormat(now);
    const [year, month, day] = crDateStr.split('-').map(Number);
    return createDateInCR(year, month - 1, day);
  };
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    appointmentDate: getInitialDate(),
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
  const [currentTimeInCR, setCurrentTimeInCR] = useState(getCurrentTimeInCR());
  const [todayDateCR, setTodayDateCR] = useState(getDateInCRFormat(new Date()));

  // Estados para búsqueda
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [petSearchQuery, setPetSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    if (id) {
      loadAppointment();
    }
    
    // Actualizar hora actual cada minuto
    const interval = setInterval(() => {
      setCurrentTimeInCR(getCurrentTimeInCR());
      setTodayDateCR(getDateInCRFormat(new Date()));
    }, 60000);
    
    return () => clearInterval(interval);
  }, [id]);

  // Efecto para actualizar ownerPets cuando cambian los datos
  useEffect(() => {
    if (selectedOwner) {
      const filteredPets = pets.filter(pet => {
        // Verificar diferentes formas de relación owner-pet
        return (
          (pet.owner && pet.owner._id === selectedOwner._id) ||
          (pet.ownerId === selectedOwner._id) ||
          (pet.owner_id === selectedOwner._id)
        );
      });
      console.log(`Mascotas encontradas para ${selectedOwner.firstName}:`, filteredPets.length);
      setOwnerPets(filteredPets);
    }
  }, [selectedOwner, pets]);

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

  //  Cargar veterinarios SOLO cuando se presiona el botón
  const loadAvailableVeterinarians = async () => {
    if (!formData.appointmentDate) {
      Alert.alert('Error', 'Primero selecciona una fecha');
      return;
    }
    
    setLoadingVets(true);
    try {
      const dateStr = getDateInCRFormat(formData.appointmentDate);
      console.log(' Buscando veterinarios para fecha (CR):', dateStr);
      
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
      console.error(' Error:', error);
      Alert.alert('Error', 'No se pudieron cargar los veterinarios');
    } finally {
      setLoadingVets(false);
    }
  };

  //  Cargar horarios con verificación ESTRICTA de ocupados y horarios pasados
  const loadVeterinarianTimeSlots = async (vetId: string) => {
    if (!formData.appointmentDate || !vetId) return;
    
    setLoadingSlots(true);
    try {
      const dateStr = getDateInCRFormat(formData.appointmentDate);
      console.log(' Buscando horarios para veterinario:', vetId, 'fecha (CR):', dateStr);
      
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
      
      console.log(' Horarios ocupados por citas:', Array.from(occupiedMap.keys()));
      setOccupiedSlots(appointments);
      
      // 4. Verificar si la fecha seleccionada es hoy
      const isToday = dateStr === todayDateCR;
      console.log(` ¿Es hoy? ${isToday ? 'SÍ' : 'NO'} - Hora actual: ${currentTimeInCR}`);
      
      // 5. Procesar slots
      const slots = response.data.availableSlots || [];
      const formattedSlots = slots.map((slot: any) => {
        const slotKey = `${slot.start}-${slot.end}`;
        const isOccupied = occupiedMap.has(slotKey);
        
        // Verificar si el horario ya pasó (solo para hoy)
        let isPast = false;
        if (isToday) {
          isPast = isTimeSlotInPast(formData.appointmentDate, slot.start);
          if (isPast) {
            console.log(` Horario ${slot.start} - ${slot.end} ha PASADO (${currentTimeInCR})`);
          }
        }
        
        const isAvailable = !isOccupied && !isPast;
        
        return {
          start: slot.start,
          end: slot.end,
          available: isAvailable,
          occupied: isOccupied,
          past: isPast
        };
      });
      
      // 6. Mostrar resumen
      const availableCount = formattedSlots.filter((s: any) => s.available).length;
      const pastCount = formattedSlots.filter((s: any) => s.past).length;
      const occupiedCount = formattedSlots.filter((s: any) => s.occupied).length;
      
      console.log(' Resumen de horarios:');
      console.log(`    Disponibles: ${availableCount}`);
      console.log(`    Pasados: ${pastCount}`);
      console.log(`    Ocupados: ${occupiedCount}`);
      console.log('   Horarios disponibles:', 
        formattedSlots.filter((s: any) => s.available).map((s: any) => `${s.start}-${s.end}`)
      );
      
      setAvailableTimeSlots(formattedSlots);
      
      if (formattedSlots.length === 0) {
        Alert.alert('Sin horarios', 'No hay horarios configurados.', [{ text: 'OK' }]);
      } else {
        if (availableCount === 0) {
          Alert.alert(
            'Sin horarios disponibles', 
            isToday 
              ? `Ya no hay horarios disponibles para hoy (${currentTimeInCR})` 
              : 'Todos los horarios están ocupados',
            [{ text: 'OK' }]
          );
        } else {
          setShowTimeSlotsModal(true);
        }
      }
    } catch (error: any) {
      console.error(' Error loading time slots:', error);
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectOwner = (owner: any) => {
    setSelectedOwner(owner);
    setFormData(prev => ({ ...prev, owner: owner._id }));
    
    // Filtrar mascotas del dueño seleccionado
    const filteredPets = pets.filter(pet => {
      return (
        (pet.owner && pet.owner._id === owner._id) ||
        (pet.ownerId === owner._id) ||
        (pet.owner_id === owner._id)
      );
    });
    
    console.log(`Mascotas encontradas para ${owner.firstName}:`, filteredPets.length);
    setOwnerPets(filteredPets);
    setShowOwnerModal(false);
    setOwnerSearchQuery(''); // Limpiar búsqueda
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
    setPetSearchQuery(''); // Limpiar búsqueda
  };

  const handleSelectVeterinarian = (vet: any) => {
    setSelectedVet(vet);
    setFormData(prev => ({ ...prev, veterinarian: vet._id }));
    loadVeterinarianTimeSlots(vet._id);
    setShowVetModal(false);
  };

  const handleSelectTimeSlot = (slot: any) => {
    // Doble verificación antes de seleccionar
    const isToday = getDateInCRFormat(formData.appointmentDate) === todayDateCR;
    
    if (isToday) {
      if (isTimeSlotInPast(formData.appointmentDate, slot.start)) {
        Alert.alert(
          'Horario no disponible', 
          `Este horario (${slot.start}) ya pasó. La hora actual es ${currentTimeInCR}.`,
          [{ text: 'OK' }]
        );
        // Recargar horarios para actualizar la lista
        if (selectedVet) {
          loadVeterinarianTimeSlots(selectedVet._id);
        }
        return;
      }
    }
    
    if (!slot.available) {
      const reason = slot.past ? 'Este horario ya pasó' : 'Este horario ya está ocupado';
      Alert.alert('Horario no disponible', reason);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      startTime: slot.start,
      endTime: slot.end
    }));
    setShowTimeSlotsModal(false);
    
    Alert.alert('Horario seleccionado', ` ${slot.start} - ${slot.end}`, [{ text: 'OK' }]);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      // Asegurar que la fecha seleccionada se interprete correctamente en CR
      const crDateStr = getDateInCRFormat(date);
      const [year, month, day] = crDateStr.split('-').map(Number);
      const crDate = createDateInCR(year, month - 1, day);
      
      console.log(`Fecha seleccionada (CR): ${crDateStr}`);
      
      setFormData({ 
        ...formData, 
        appointmentDate: crDate,
        veterinarian: '',
        startTime: '',
        endTime: ''
      });
      setSelectedVet(null);
      setVeterinarians([]);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
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

    // Verificación final de horario pasado (solo para hoy)
    const selectedDateCR = getDateInCRFormat(formData.appointmentDate);
    const isToday = selectedDateCR === todayDateCR;
    
    if (isToday) {
      if (isTimeSlotInPast(formData.appointmentDate, formData.startTime)) {
        Alert.alert(
          'Error', 
          `No puedes agendar citas en horarios que ya pasaron. La hora actual es ${currentTimeInCR}.`
        );
        return;
      }
    }

    // Verificación final de disponibilidad
    const isStillAvailable = !occupiedSlots.some((apt: any) => 
      apt.startTime === formData.startTime && apt.endTime === formData.endTime
    );

    if (!isStillAvailable) {
      Alert.alert('Error', 'Este horario ya no está disponible. Por favor selecciona otro.');
      if (selectedVet) {
        loadVeterinarianTimeSlots(selectedVet._id);
      }
      return;
    }

    // Preparar datos para enviar
    const appointmentData = {
      ...formData,
      appointmentDate: getDateInCRFormat(formData.appointmentDate),
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
          'Éxito',
          isEditing ? 'Cita actualizada correctamente' : 'Cita creada correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(' Error', result.message || 'No se pudo guardar la cita');
      }
    } catch (error: any) {
      console.error(' Error:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al guardar la cita');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      timeZone: 'America/Costa_Rica',
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

  // Filtrar dueños por búsqueda
  const filteredOwners = owners.filter(owner => {
    const fullName = `${owner.firstName} ${owner.lastName}`.toLowerCase();
    const searchLower = ownerSearchQuery.toLowerCase();
    return fullName.includes(searchLower) || 
           (owner.phone && owner.phone.includes(ownerSearchQuery));
  });

  // Filtrar mascotas por búsqueda
  const filteredPets = ownerPets.filter(pet => {
    const petName = pet.name.toLowerCase();
    const searchLower = petSearchQuery.toLowerCase();
    return petName.includes(searchLower) || 
           (pet.species && pet.species.toLowerCase().includes(searchLower));
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Cita' : 'Nueva Cita'}
        </Text>
        <View style={styles.timeInfo}>
          <Text style={styles.currentTime}>
             Hora actual (CR): {currentTimeInCR}
          </Text>
          <Text style={styles.dateInfo}>
             Hoy: {formatDate(new Date())}
          </Text>
        </View>
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

        {/* Veterinario */}
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
                    : ' Toca para buscar veterinarios'}
                </Text>
                <Text style={styles.selectorArrow}>▼</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.helperText}>
            {getDateInCRFormat(formData.appointmentDate) === todayDateCR 
              ? ` Solo se muestran horarios posteriores a ${currentTimeInCR}`
              : ` Buscar veterinarios disponibles para ${getDateInCRFormat(formData.appointmentDate)}`}
          </Text>
        </View>

        {/* Horario */}
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
                : ' Toca para ver horarios disponibles'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            {!formData.veterinarian 
              ? 'Primero selecciona un veterinario'
              : getDateInCRFormat(formData.appointmentDate) === todayDateCR
                ? ` Horarios disponibles después de las ${currentTimeInCR}`
                : 'Toca para ver horarios disponibles'}
          </Text>
        </View>

        {/* Dueño */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dueño *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => {
              setOwnerSearchQuery('');
              setShowOwnerModal(true);
            }}
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
            onPress={() => {
              setPetSearchQuery('');
              setShowPetModal(true);
            }}
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
          timeZoneName="America/Costa_Rica"
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

      {/* Modal de Horarios */}
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
              <>
                {getDateInCRFormat(formData.appointmentDate) === todayDateCR && (
                  <View style={styles.timeInfoHeader}>
                    <Text style={styles.timeInfoText}>
                       Hora actual: {currentTimeInCR}
                    </Text>
                    <Text style={styles.timeInfoText}>
                       Solo se muestran horarios posteriores
                    </Text>
                  </View>
                )}
                <FlatList
                  data={availableTimeSlots}
                  keyExtractor={(item, index) => `${item.start}-${item.end}-${index}`}
                  numColumns={2}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.timeSlotItem,
                        !item.available && styles.timeSlotItemOccupied,
                        item.available && styles.timeSlotItemAvailable,
                        item.past && styles.timeSlotItemPast
                      ]}
                      onPress={() => handleSelectTimeSlot(item)}
                      disabled={!item.available}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        !item.available && styles.timeSlotTextOccupied,
                        item.past && styles.timeSlotTextPast
                      ]}>
                        {item.start} - {item.end}
                      </Text>
                      <View style={styles.timeSlotStatusContainer}>
                        <View style={[
                          styles.timeSlotDot,
                          item.past ? styles.timeSlotDotPast :
                          item.available ? styles.timeSlotDotAvailable : styles.timeSlotDotOccupied
                        ]} />
                        <Text style={[
                          styles.timeSlotStatusText,
                          item.past ? styles.timeSlotTextPast :
                          item.available ? styles.timeSlotTextAvailable : styles.timeSlotTextOccupied
                        ]}>
                          {item.past ? ' Pasado' : item.available ? ' Disponible' : ' Ocupado'}
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
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Dueño CON BUSCADOR */}
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
            
            {/* Buscador de dueños */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o teléfono..."
                value={ownerSearchQuery}
                onChangeText={setOwnerSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {ownerSearchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setOwnerSearchQuery('')}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredOwners}
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
                    {item.phone || 'Sin teléfono'} • {pets.filter(pet => 
                      (pet.owner && pet.owner._id === item._id) ||
                      (pet.ownerId === item._id) ||
                      (pet.owner_id === item._id)
                    ).length || 0} mascotas
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>
                  {ownerSearchQuery ? 'No se encontraron dueños' : 'No hay dueños registrados'}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Mascota CON BUSCADOR */}
      <Modal
        visible={showPetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPetModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Mascotas de {selectedOwner?.firstName} {selectedOwner?.lastName}
              </Text>
              <TouchableOpacity onPress={() => setShowPetModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Buscador de mascotas */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o especie..."
                value={petSearchQuery}
                onChangeText={setPetSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {petSearchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setPetSearchQuery('')}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredPets}
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
                  {petSearchQuery 
                    ? 'No se encontraron mascotas' 
                    : 'Este dueño no tiene mascotas registradas'}
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
    backgroundColor: '#219eb4',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  timeInfo: {
    marginTop: 8,
  },
  currentTime: {
    fontSize: 14,
    color: '#bbf7d0',
  },
  dateInfo: {
    fontSize: 12,
    color: '#bbf7d0',
    marginTop: 4,
    opacity: 0.9,
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
    backgroundColor: '#219eb4',
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
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
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
    padding: 20,
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
  timeSlotItemPast: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.5,
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
  timeSlotTextPast: {
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
  timeSlotDotPast: {
    backgroundColor: '#9ca3af',
  },
  timeSlotStatusText: {
    fontSize: 10,
  },
  timeSlotTextAvailable: {
    color: '#10b981',
  },
  timeInfoHeader: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  timeInfoText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
  // Estilos para buscador
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 24,
    top: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});