// src/screens/Clinic/OwnerFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';

export default function OwnerFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const isEditing = !!id;
  
  const { createOwner, updateOwner, fetchOwner, loading } = useClinic();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dni: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    notes: ''
  });

  useEffect(() => {
    if (isEditing && id) {
      loadOwner();
    }
  }, [id]);

  const loadOwner = async () => {
    const owner = await fetchOwner(id);
    if (owner) {
      setFormData({
        firstName: owner.firstName || '',
        lastName: owner.lastName || '',
        email: owner.email || '',
        phone: owner.phone || '',
        address: owner.address || '',
        dni: owner.dni || '',
        emergencyContact: owner.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        },
        notes: owner.notes || ''
      });
    }
  };

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Nombre y apellido son requeridos');
      return;
    }

    if (!formData.email.trim() || !formData.phone.trim()) {
      Alert.alert('Error', 'Email y teléfono son requeridos');
      return;
    }

    try {
      let result;
      if (isEditing) {
        result = await updateOwner(id, formData);
      } else {
        result = await createOwner(formData);
      }
      
      if (result.success) {
        Alert.alert(
          'Éxito',
          result.message || (isEditing ? 'Cliente actualizado' : 'Cliente creado'),
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.message || 'Ocurrió un error');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el cliente');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Información básica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              />
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>Apellido *</Text>
              <TextInput
                style={styles.input}
                placeholder="Pérez"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="juan@email.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              placeholder="+506 8888 8888"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DNI/Cédula</Text>
            <TextInput
              style={styles.input}
              placeholder="1-2345-6789"
              value={formData.dni}
              onChangeText={(text) => setFormData({ ...formData, dni: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={styles.input}
              placeholder="Dirección completa"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />
          </View>
        </View>

        {/* Contacto de emergencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del contacto"
              value={formData.emergencyContact.name}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                emergencyContact: { ...formData.emergencyContact, name: text }
              })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Teléfono de emergencia"
              value={formData.emergencyContact.phone}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                emergencyContact: { ...formData.emergencyContact, phone: text }
              })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parentesco</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Esposo/a, Hijo/a"
              value={formData.emergencyContact.relationship}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                emergencyContact: { ...formData.emergencyContact, relationship: text }
              })}
            />
          </View>
        </View>

        {/* Notas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas Adicionales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Información importante sobre el cliente..."
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
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Cliente')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
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
});