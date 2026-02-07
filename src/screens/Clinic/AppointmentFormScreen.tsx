// src/screens/Clinic/AppointmentFormScreen.tsx
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
  FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';

export default function AppointmentFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
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
  
  const { id, petId } = route.params || {};
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    appointmentDate: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    type: 'consulta',
    service: '',
    price: '',
    notes: '',
    pet: petId || '',
    owner: '',
    veterinarian: user?.id || ''
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [ownerPets, setOwnerPets] = useState<any[]>([]);
  
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
  };
  
  const loadAppointment = async () => {
    // Cargar datos de la cita si se está editando
    // Implementar según tu API
  };
  
  const handleSelectOwner = (owner: any) => {
    setSelectedOwner(owner);
    setFormData(prev => ({ ...prev, owner: owner._id }));
    // Filtrar mascotas de este dueño
    const ownerPets = pets.filter(pet => pet.owner._id === owner._id);
    setOwnerPets(ownerPets);
    setShowOwnerModal(false);
  };
  
  const handleSelectPet = (pet: any) => {
    setFormData(prev => ({ 
      ...prev, 
      pet: pet._id,
      owner: pet.owner._id 
    }));
    setShowPetModal(false);
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
    
    if (!formData.startTime || !formData.endTime) {
      Alert.alert('Error', 'La hora de inicio y fin son requeridas');
      return;
    }
    
    const appointmentData = {
      ...formData,
      appointmentDate: formData.appointmentDate.toISOString(),
      price: parseFloat(formData.price) || 0
    };
    
    try {
      let result;
      if (isEditing) {
        result = await updateAppointment(id, appointmentData);
      } else {
        result = await createAppointment(appointmentData);
      }
      
      if (result.success) {
        Alert.alert(
          'Éxito',
          isEditing ? 'Cita actualizada' : 'Cita creada',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al guardar');
    }
  };
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
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
        
        {/* Dueño */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dueño *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowOwnerModal(true)}
          >
            <Text style={formData.owner ? styles.selectorTextSelected : styles.selectorText}>
              {selectedOwner 
                ? `${selectedOwner.firstName} ${selectedOwner.lastName}`
                : 'Seleccionar dueño'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>
        
        {/* Mascota */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Paciente *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowPetModal(true)}
            disabled={!formData.owner}
          >
            <Text style={formData.pet ? styles.selectorTextSelected : styles.selectorText}>
              {formData.pet 
                ? pets.find(p => p._id === formData.pet)?.name
                : 'Seleccionar mascota'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>
        
        {/* Fecha */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.selectorTextSelected}>
              {formData.appointmentDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>
        
        {/* Hora inicio */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hora de inicio *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Text style={styles.selectorTextSelected}>
              {formatTime(formData.startTime)}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>
        
        {/* Hora fin */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hora de fin *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text style={styles.selectorTextSelected}>
              {formatTime(formData.endTime)}
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
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Cita'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.appointmentDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setFormData({ ...formData, appointmentDate: date });
            }
          }}
        />
      )}
      
      {showStartTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${formData.startTime}:00`)}
          mode="time"
          display="spinner"
          onChange={(event, date) => {
            setShowStartTimePicker(false);
            if (date) {
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              setFormData({ ...formData, startTime: `${hours}:${minutes}` });
            }
          }}
        />
      )}
      
      {showEndTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${formData.endTime}:00`)}
          mode="time"
          display="spinner"
          onChange={(event, date) => {
            setShowEndTimePicker(false);
            if (date) {
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              setFormData({ ...formData, endTime: `${hours}:${minutes}` });
            }
          }}
        />
      )}
      
      {/* Modal de Dueños */}
      <Modal
        visible={showOwnerModal}
        animationType="slide"
        transparent={true}
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
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectOwner(item)}
                >
                  <Text style={styles.modalItemText}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.modalItemSubtext}>
                    {item.phone} • {item.petCount || 0} mascotas
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>
                  No hay dueños registrados
                </Text>
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
              data={formData.owner ? ownerPets : pets}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectPet(item)}
                >
                  <Text style={styles.modalItemText}>
                    {item.name} ({item.species})
                  </Text>
                  <Text style={styles.modalItemSubtext}>
                    {item.breed} • {item.gender}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>
                  {formData.owner 
                    ? 'Este dueño no tiene mascotas registradas'
                    : 'Selecciona un dueño primero'}
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
    maxHeight: '70%',
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
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  emptyModalText: {
    textAlign: 'center',
    padding: 40,
    color: '#94a3b8',
  },
});