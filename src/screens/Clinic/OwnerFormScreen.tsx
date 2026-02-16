// src/screens/Clinic/OwnerFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';

type OwnerFormParams = {
  id?: string;
};

export default function OwnerFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = (route.params as OwnerFormParams) || {};
  const isEditing = !!id;
  
  const { createOwner, updateOwner, fetchOwner, loading, error } = useClinic();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+506 ', // Prefijo de Costa Rica por defecto
    address: '',
    dni: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (isEditing && id) {
      loadOwner();
    }
  }, [id]);

  const loadOwner = async () => {
    try {
      const owner = await fetchOwner(id as string);
      if (owner) {
        setFormData({
          firstName: owner.firstName || '',
          lastName: owner.lastName || '',
          email: owner.email || '',
          phone: owner.phone || '+506 ', // Si no tiene, poner prefijo
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
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el cliente');
    }
  };

  // Función para validar formato de teléfono internacional
  const validatePhone = (phone: string) => {
    // Si está vacío o solo tiene el prefijo, no es válido
    if (!phone || phone === '+' || phone === '+506 ' || phone === '+506') {
      return false;
    }
    
    // Regex para teléfono: +[código país][número] (ej: +50688888888)
    // Eliminar espacios para la validación
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^\+\d{7,15}$/;
    return phoneRegex.test(cleanPhone);
  };

  // Función para formatear teléfono mientras se escribe (sin causar repetición)
  const handlePhoneChange = (text: string) => {
    // Si el usuario borra todo, mantener el prefijo
    if (text === '') {
      setFormData({...formData, phone: '+506 '});
      return;
    }

    // Si no empieza con +, agregarlo
    let cleaned = text;
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    // Extraer el código de país (primeros dígitos después del +)
    const plusIndex = cleaned.indexOf('+');
    let countryCode = '506'; // código por defecto
    let number = '';

    if (plusIndex === 0) {
      const parts = cleaned.substring(1).split(/\s+/);
      if (parts.length > 0) {
        // Si hay un código de país explícito (ej: +1, +506, +57)
        const possibleCode = parts[0].replace(/\D/g, '');
        if (possibleCode.length > 0) {
          countryCode = possibleCode;
          number = parts.slice(1).join('').replace(/\D/g, '');
        } else {
          // Si no hay código, usar el default y tomar el resto como número
          number = parts.join('').replace(/\D/g, '');
        }
      }
    }

    // Limpiar el número (solo dígitos)
    number = number.replace(/\D/g, '');

    // Aplicar formato según la longitud
    let formatted = `+${countryCode}`;
    
    if (number.length > 0) {
      if (countryCode === '506') {
        // Formato Costa Rica: +506 8888 8888
        if (number.length <= 4) {
          formatted += ' ' + number;
        } else {
          formatted += ' ' + number.substring(0, 4) + ' ' + number.substring(4, 8);
        }
      } else {
        // Otros países: formato simple
        formatted += ' ' + number.match(/.{1,4}/g)?.join(' ') || number;
      }
    }

    setFormData({...formData, phone: formatted});
  };

  const validateForm = () => {
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    };
    
    let isValid = true;
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido';
      isValid = false;
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
      isValid = false;
    }
    
    // Validar teléfono
    if (!validatePhone(formData.phone)) {
      errors.phone = 'El teléfono debe tener formato internacional: +50688888888';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    console.log('📝 Enviando formulario:', formData);
    
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    try {
      let result;
      if (isEditing) {
        result = await updateOwner(id, formData);
      } else {
        result = await createOwner(formData);
      }
      
      console.log('✅ Resultado:', result);
      
      if (result.success) {
        Alert.alert(
          '✅ Éxito',
          result.message || (isEditing ? 'Cliente actualizado' : 'Cliente creado'),
          [{ 
            text: 'OK', 
            onPress: () => {
              navigation.goBack();
            }
          }]
        );
      } else {
        Alert.alert('❌ Error', result.message || 'Ocurrió un error al guardar');
      }
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      Alert.alert('❌ Error', 'No se pudo guardar el cliente. Verifica tu conexión.');
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
                style={[styles.input, formErrors.firstName ? styles.inputError : null]}
                placeholder="Juan"
                value={formData.firstName}
                onChangeText={(text) => {
                  setFormData({ ...formData, firstName: text });
                  if (formErrors.firstName) {
                    setFormErrors({ ...formErrors, firstName: '' });
                  }
                }}
              />
              {formErrors.firstName ? (
                <Text style={styles.errorText}>{formErrors.firstName}</Text>
              ) : null}
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>Apellido *</Text>
              <TextInput
                style={[styles.input, formErrors.lastName ? styles.inputError : null]}
                placeholder="Pérez"
                value={formData.lastName}
                onChangeText={(text) => {
                  setFormData({ ...formData, lastName: text });
                  if (formErrors.lastName) {
                    setFormErrors({ ...formErrors, lastName: '' });
                  }
                }}
              />
              {formErrors.lastName ? (
                <Text style={styles.errorText}>{formErrors.lastName}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, formErrors.email ? styles.inputError : null]}
              placeholder="juan@email.com"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text.toLowerCase() });
                if (formErrors.email) {
                  setFormErrors({ ...formErrors, email: '' });
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {formErrors.email ? (
              <Text style={styles.errorText}>{formErrors.email}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono *</Text>
            <Text style={styles.hint}>
              Formato: +[código país][número] (ej: +50688888888)
            </Text>
            <TextInput
              style={[styles.input, formErrors.phone ? styles.inputError : null]}
              placeholder="+506 8888 8888"
              value={formData.phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
            />
            {formErrors.phone ? (
              <Text style={styles.errorText}>{formErrors.phone}</Text>
            ) : null}
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

        {/* Mostrar error del contexto si existe */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorContextText}>{error}</Text>
          </View>
        )}

        {/* Botones */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Actualizar' : 'Crear Cliente'}
              </Text>
            )}
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
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorContextText: {
    color: '#dc2626',
    fontSize: 14,
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
    backgroundColor: '#686e6e',
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
});