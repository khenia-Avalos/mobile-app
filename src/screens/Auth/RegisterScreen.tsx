// src/screens/Auth/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Switch,
  ActivityIndicator
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

type FormData = {
  username: string;
  lastname: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: 'veterinarian' | 'assistant';
  specialty?: string;
  appointmentDuration?: number;
};

type TimeSlot = {
  start: string;
  end: string;
  available: boolean;
};

type Availability = {
  [key: string]: TimeSlot;
};

export default function RegisterScreen() {
  const { user, loading, registerStaff } = useAuth(); // 👈 CAMBIADO: ahora usa registerStaff
  const navigation = useNavigation();
  const { control, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      role: 'assistant',
      appointmentDuration: 30,
    }
  });
  
  const selectedRole = watch('role');
  const [defaultAvailability, setDefaultAvailability] = useState<Availability>({
    monday: { start: '08:00', end: '17:00', available: true },
    tuesday: { start: '08:00', end: '17:00', available: true },
    wednesday: { start: '08:00', end: '17:00', available: true },
    thursday: { start: '08:00', end: '17:00', available: true },
    friday: { start: '08:00', end: '17:00', available: true },
    saturday: { start: '09:00', end: '13:00', available: false },
    sunday: { start: '09:00', end: '13:00', available: false }
  });
  
  const [saving, setSaving] = useState(false);
  const [showVetSettings, setShowVetSettings] = useState(false);

  useEffect(() => {
    setShowVetSettings(selectedRole === 'veterinarian');
  }, [selectedRole]);

  const updateTimeSlot = (day: string, field: 'start' | 'end' | 'available', value: any) => {
    setDefaultAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const onSubmit = async (data: FormData) => {
    // Verificar que el usuario actual sea admin
    if (user?.role !== 'admin') {
      Alert.alert('Error', 'Solo los administradores pueden registrar usuarios');
      return;
    }

    setSaving(true);
    
    try {
      // Crear objeto completo para el usuario del staff
      const staffUserData = {
        username: data.username,
        lastname: data.lastname,
        phoneNumber: data.phoneNumber,
        email: data.email,
        password: data.password,
        role: data.role,
        active: true,
        ...(data.role === 'veterinarian' && {
          specialty: data.specialty || 'Medicina General',
          defaultAvailability,
          appointmentDuration: data.appointmentDuration || 30
        })
      };

      console.log('📤 Enviando datos al backend:', staffUserData);
      
      // 👈 LLAMADA REAL A LA API
      const result = await registerStaff(staffUserData);
      
      if (result.ok) {
        Alert.alert(
          'Éxito',
          `Usuario ${data.username} registrado correctamente`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSaving(false);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        setSaving(false);
      }

    } catch (error: any) {
      console.error('❌ Error en onSubmit:', error);
      Alert.alert('Error', error?.message || 'No se pudo registrar el usuario');
      setSaving(false);
    }
  };

  // Si el usuario no es admin, mostrar mensaje
  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Acceso Restringido</Text>
        <Text style={styles.message}>
          Solo los administradores pueden registrar nuevos usuarios del personal.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver al Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registrar Nuevo Usuario del Personal</Text>
      <Text style={styles.subtitle}>Administración de Clínica</Text>
      
      <View style={styles.form}>
        <Controller
          control={control}
          name="username"
          rules={{ required: 'Nombre es requerido' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Nombre del usuario"
                value={value}
                onChangeText={onChange}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="lastname"
          rules={{ required: 'Apellido es requerido' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellido *</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Apellido del usuario"
                value={value}
                onChangeText={onChange}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email es requerido',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido',
            },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="usuario@clinica.com"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="phoneNumber"
          rules={{
            required: 'Teléfono es requerido',
            pattern: {
              value: /^\+\d{1,4}[0-9\s\-]{8,15}$/,
              message: 'Formato: +50670983832',
            },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono *</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="+50670983832"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Contraseña es requerida',
            minLength: {
              value: 6,
              message: 'Mínimo 6 caracteres',
            },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña *</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                secureTextEntry
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rol del Usuario *</Text>
          <View style={styles.roleContainer}>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    style={[styles.roleButton, value === 'veterinarian' && styles.roleButtonSelected]}
                    onPress={() => onChange('veterinarian')}
                  >
                    <Text style={[styles.roleText, value === 'veterinarian' && styles.roleTextSelected]}>
                      🐾 Veterinario
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.roleButton, value === 'assistant' && styles.roleButtonSelected]}
                    onPress={() => onChange('assistant')}
                  >
                    <Text style={[styles.roleText, value === 'assistant' && styles.roleTextSelected]}>
                      📋 Asistente
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            />
          </View>
        </View>

        {/* Configuración para Veterinarios */}
        {showVetSettings && (
          <View style={styles.vetSettings}>
            <Text style={styles.sectionTitle}>Configuración de Veterinario</Text>
            
            <Controller
              control={control}
              name="specialty"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Especialidad</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Medicina General, Cirugía, etc."
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="appointmentDuration"
              rules={{
                min: { value: 15, message: 'Mínimo 15 minutos' },
                max: { value: 120, message: 'Máximo 120 minutos' }
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Duración de Citas (minutos)</Text>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder="30"
                    value={value?.toString()}
                    onChangeText={(text) => onChange(parseInt(text) || 30)}
                    keyboardType="numeric"
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
            />

            <Text style={styles.sectionTitle}>Disponibilidad por Defecto</Text>
            {Object.keys(defaultAvailability).map((day) => {
              const dayName = day.charAt(0).toUpperCase() + day.slice(1);
              const slot = defaultAvailability[day];
              
              return (
                <View key={day} style={styles.timeSlotContainer}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayText}>{dayName}</Text>
                    <Switch
                      value={slot.available}
                      onValueChange={(value) => updateTimeSlot(day, 'available', value)}
                    />
                  </View>
                  
                  {slot.available && (
                    <View style={styles.timeInputs}>
                      <TextInput
                        style={styles.timeInput}
                        value={slot.start}
                        onChangeText={(value) => updateTimeSlot(day, 'start', value)}
                        placeholder="08:00"
                      />
                      <Text style={styles.timeSeparator}>a</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={slot.end}
                        onChangeText={(value) => updateTimeSlot(day, 'end', value)}
                        placeholder="17:00"
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, (loading || saving) && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading || saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {loading ? 'Registrando...' : 'Registrar Usuario'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>Cancelar y volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f766e',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 30,
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
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleButtonSelected: {
    backgroundColor: '#0f766e',
    borderColor: '#0d9488',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  roleTextSelected: {
    color: 'white',
  },
  vetSettings: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    marginTop: 10,
  },
  timeSlotContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    textAlign: 'center',
  },
  timeSeparator: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0f766e',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#0891b2',
    fontSize: 14,
  },
  backButton: {
    backgroundColor: '#0f766e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 40,
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});