// mobile-app/src/screens/Clinic/PetFormScreen.tsx
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
  Switch,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  PetForm: { id?: string; ownerId?: string };
  OwnerDetail: { id: string };
};

type PetFormScreenRouteProp = RouteProp<RootStackParamList, 'PetForm'>;
type PetFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PetForm'>;

export default function PetFormScreen() {
  const navigation = useNavigation<PetFormScreenNavigationProp>();
  const route = useRoute<PetFormScreenRouteProp>();
  const { id, ownerId } = route.params;
  const isEditing = !!id;
  
  const { user } = useAuth();
  const { 
    owners, 
    createPet, 
    updatePet, 
    fetchPet,
    fetchOwners,
    loading 
  } = useClinic();
  
  const [formData, setFormData] = useState({
    name: '',
    species: 'Perro',
    breed: '',
    color: '',
    gender: 'Macho',
    birthDate: null as Date | null,
    weight: '',
    weightUnit: 'kg',
    allergies: [] as string[],
    medications: [] as string[],
    specialConditions: '',
    notes: '',
    sterilized: false,
    owner: ownerId || '',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [allergyInput, setAllergyInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const speciesOptions = ['Perro', 'Gato', 'Otro'];
  const genderOptions = ['Macho', 'Hembra'];
  const weightUnits = ['kg', 'g', 'lb'];

  useEffect(() => {
    loadInitialData();
    if (isEditing && id) {
      loadPet();
    }
  }, [id]);

  const loadInitialData = async () => {
    try {
      await fetchOwners();
      if (ownerId) {
        const owner = owners.find(o => o._id === ownerId);
        if (owner) {
          setSelectedOwner(owner);
          setFormData(prev => ({ ...prev, owner: ownerId }));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const loadPet = async () => {
    try {
      if (!id) return;
      const pet = await fetchPet(id);
      if (pet) {
        setFormData({
          name: pet.name || '',
          species: pet.species || 'Perro',
          breed: pet.breed || '',
          color: pet.color || '',
          gender: pet.gender || 'Macho',
          birthDate: pet.birthDate ? new Date(pet.birthDate) : null,
          weight: pet.weight ? pet.weight.toString() : '',
          weightUnit: pet.weightUnit || 'kg',
          allergies: pet.allergies || [],
          medications: pet.medications || [],
          specialConditions: pet.specialConditions || '',
          notes: pet.notes || '',
          sterilized: pet.sterilized || false,
          owner: pet.owner?._id || ownerId || '',
        });
        
        if (pet.owner) {
          setSelectedOwner(pet.owner);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la mascota');
    }
  };

  const handleSelectOwner = (owner: any) => {
    setSelectedOwner(owner);
    setFormData({ ...formData, owner: owner._id });
    setShowOwnerModal(false);
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !formData.allergies.includes(allergyInput.trim())) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyInput.trim()]
      });
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    const newAllergies = [...formData.allergies];
    newAllergies.splice(index, 1);
    setFormData({ ...formData, allergies: newAllergies });
  };

  const handleAddMedication = () => {
    if (medicationInput.trim() && !formData.medications.includes(medicationInput.trim())) {
      setFormData({
        ...formData,
        medications: [...formData.medications, medicationInput.trim()]
      });
      setMedicationInput('');
    }
  };

  const handleRemoveMedication = (index: number) => {
    const newMedications = [...formData.medications];
    newMedications.splice(index, 1);
    setFormData({ ...formData, medications: newMedications });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre de la mascota es requerido');
      return false;
    }
    
    if (!formData.owner) {
      Alert.alert('Error', 'Debes seleccionar un dueño');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Preparar datos EXACTAMENTE como espera el backend
      const petData: any = {
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed || '',
        color: formData.color || '',
        gender: formData.gender || 'Macho',
        weight: formData.weight ? parseFloat(formData.weight) : null,
        weightUnit: formData.weightUnit || 'kg',
        allergies: formData.allergies || [],
        medications: formData.medications || [],
        specialConditions: formData.specialConditions || '',
        notes: formData.notes || '',
        sterilized: formData.sterilized || false,
        owner: formData.owner,
        // NO enviar userId - el backend lo obtiene del token
        // NO enviar lastVisit - el backend lo agrega automáticamente
      };

      // SOLO agregar birthDate si existe
      if (formData.birthDate) {
        petData.birthDate = formData.birthDate; // Enviar como Date object
      }

      console.log('📤 Enviando mascota:', JSON.stringify(petData, null, 2));

      let result;
      if (isEditing) {
        result = await updatePet(id!, petData);
      } else {
        result = await createPet(petData);
      }
      
      if (result.success) {
        const successMessage = isEditing ? 'Mascota actualizada correctamente' : 'Mascota creada correctamente';
        
        Alert.alert(
          ' Éxito',
          successMessage,
          [{ 
            text: 'OK', 
            onPress: () => {
              if (ownerId) {
                navigation.navigate('OwnerDetail', { id: ownerId });
              } else if (formData.owner) {
                navigation.navigate('OwnerDetail', { id: formData.owner });
              } else {
                navigation.goBack();
              }
            }
          }]
        );
      } else {
        Alert.alert(' Error', result.message || 'No se pudo guardar la mascota');
      }
    } catch (error) {
      console.error(' Error:', error);
      Alert.alert(' Error', 'No se pudo guardar la mascota');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Seleccionar fecha';
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setFormData({ ...formData, birthDate: date });
    }
  };

  const handleShowDatePicker = () => {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Mascota' : 'Nueva Mascota'}
        </Text>
      </View>

      <View style={styles.form}>
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
                : ownerId ? 'Cargando dueño...' : 'Seleccionar dueño'}
            </Text>
            {!ownerId && <Text style={styles.selectorArrow}>▼</Text>}
          </TouchableOpacity>
          {ownerId && (
            <Text style={styles.helperText}>
              El dueño fue seleccionado automáticamente desde la pantalla anterior
            </Text>
          )}
        </View>

        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la mascota"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        {/* Especie y Género */}
        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Especie</Text>
            <View style={styles.optionsContainer}>
              {speciesOptions.map((species) => (
                <TouchableOpacity
                  key={species}
                  style={[
                    styles.optionButton,
                    formData.species === species && styles.optionButtonSelected
                  ]}
                  onPress={() => setFormData({ ...formData, species })}
                >
                  <Text style={[
                    styles.optionButtonText,
                    formData.species === species && styles.optionButtonTextSelected
                  ]}>
                    {species}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.label}>Género</Text>
            <View style={styles.optionsContainer}>
              {genderOptions.map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.optionButton,
                    formData.gender === gender && styles.optionButtonSelected
                  ]}
                  onPress={() => setFormData({ ...formData, gender })}
                >
                  <Text style={[
                    styles.optionButtonText,
                    formData.gender === gender && styles.optionButtonTextSelected
                  ]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Raza y Color */}
        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Raza</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Labrador, Persa, etc."
              value={formData.breed}
              onChangeText={(text) => setFormData({ ...formData, breed: text })}
            />
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              placeholder="Color del pelaje/plumas"
              value={formData.color}
              onChangeText={(text) => setFormData({ ...formData, color: text })}
            />
          </View>
        </View>

        {/* Fecha de nacimiento */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha de Nacimiento</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={handleShowDatePicker}
          >
            <Text style={formData.birthDate ? styles.selectorTextSelected : styles.selectorText}>
              {formatDate(formData.birthDate)}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Peso */}
        <View style={styles.inputRow}>
          <View style={styles.twoThirdsInput}>
            <Text style={styles.label}>Peso</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 5.2"
              value={formData.weight}
              onChangeText={(text) => setFormData({ ...formData, weight: text })}
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={styles.oneThirdInput}>
            <Text style={styles.label}>Unidad</Text>
            <View style={styles.optionsContainer}>
              {weightUnits.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.smallOptionButton,
                    formData.weightUnit === unit && styles.smallOptionButtonSelected
                  ]}
                  onPress={() => setFormData({ ...formData, weightUnit: unit })}
                >
                  <Text style={[
                    styles.smallOptionButtonText,
                    formData.weightUnit === unit && styles.smallOptionButtonTextSelected
                  ]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Alergias */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alergias</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Agregar alergia"
              value={allergyInput}
              onChangeText={setAllergyInput}
              onSubmitEditing={handleAddAllergy}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={styles.tagAddButton}
              onPress={handleAddAllergy}
            >
              <Text style={styles.tagAddButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          {formData.allergies.length > 0 && (
            <View style={styles.tagsContainer}>
              {formData.allergies.map((allergy, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{allergy}</Text>
                  <TouchableOpacity 
                    style={styles.tagRemoveButton}
                    onPress={() => handleRemoveAllergy(index)}
                  >
                    <Text style={styles.tagRemoveButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Medicamentos */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Medicamentos</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Agregar medicamento"
              value={medicationInput}
              onChangeText={setMedicationInput}
              onSubmitEditing={handleAddMedication}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={styles.tagAddButton}
              onPress={handleAddMedication}
            >
              <Text style={styles.tagAddButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          {formData.medications.length > 0 && (
            <View style={styles.tagsContainer}>
              {formData.medications.map((medication, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{medication}</Text>
                  <TouchableOpacity 
                    style={styles.tagRemoveButton}
                    onPress={() => handleRemoveMedication(index)}
                  >
                    <Text style={styles.tagRemoveButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Esterilizado */}
        <View style={styles.inputGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Esterilizado/Castrado</Text>
            <Switch
              value={formData.sterilized}
              onValueChange={(value) => setFormData({ ...formData, sterilized: value })}
              trackColor={{ false: '#d1d5db', true: '#0891b2' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Condiciones especiales */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Condiciones Especiales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enfermedades crónicas, discapacidades, etc."
            value={formData.specialConditions}
            onChangeText={(text) => setFormData({ ...formData, specialConditions: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Notas */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notas Adicionales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Información adicional sobre la mascota..."
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Botones */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, (isSubmitting || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Actualizar' : 'Crear Mascota'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.birthDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

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
              keyExtractor={(item) => item._id || item.id || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectOwner(item)}
                >
                  <Text style={styles.modalItemText}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.modalItemSubtext}>
                    {item.phone || 'Sin teléfono'} • {item.petCount || 0} mascotas
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
    textAlign: 'center',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfInput: {
    flex: 1,
  },
  twoThirdsInput: {
    flex: 2,
  },
  oneThirdInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  selector: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
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
  },
  selectorArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 4,
  },
  optionButtonSelected: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionButtonTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  smallOptionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  smallOptionButtonSelected: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  smallOptionButtonText: {
    fontSize: 12,
    color: '#6b7280',
  },
  smallOptionButtonTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  tagAddButton: {
    backgroundColor: '#0891b2',
    width: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagAddButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#dbeafe',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  tagText: {
    color: '#1e40af',
    fontSize: 14,
    marginRight: 8,
  },
  tagRemoveButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#93c5fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRemoveButtonText: {
    color: '#1e40af',
    fontSize: 10,
    fontWeight: 'bold',
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
    backgroundColor: '#0891b2',
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