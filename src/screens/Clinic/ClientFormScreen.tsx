// src/screens/Clinic/ClientFormScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ClientFormScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    ownerName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPhone: '',
    petName: '',
    petSpecies: 'Perro',
  });

  const handleSubmit = () => {
    if (!form.ownerName || !form.petName) {
      Alert.alert('Error', 'Nombre del dueño y mascota son requeridos');
      return;
    }
    
    Alert.alert('Éxito', 'Paciente registrado (modo demo)');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nuevo Paciente</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Nombre del Dueño *</Text>
        <TextInput
          style={styles.input}
          placeholder="Juan"
          value={form.ownerName}
          onChangeText={(text) => setForm({...form, ownerName: text})}
        />

        <Text style={styles.label}>Apellido del Dueño</Text>
        <TextInput
          style={styles.input}
          placeholder="Pérez"
          value={form.ownerLastName}
          onChangeText={(text) => setForm({...form, ownerLastName: text})}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="+506 8888 8888"
          value={form.ownerPhone}
          onChangeText={(text) => setForm({...form, ownerPhone: text})}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Nombre de la Mascota *</Text>
        <TextInput
          style={styles.input}
          placeholder="Firulais"
          value={form.petName}
          onChangeText={(text) => setForm({...form, petName: text})}
        />

        <Text style={styles.label}>Especie</Text>
        <View style={styles.speciesButtons}>
          {['Perro', 'Gato', 'Ave', 'Roedor'].map((species) => (
            <TouchableOpacity
              key={species}
              style={[
                styles.speciesButton,
                form.petSpecies === species && styles.speciesButtonActive
              ]}
              onPress={() => setForm({...form, petSpecies: species})}
            >
              <Text style={[
                styles.speciesButtonText,
                form.petSpecies === species && styles.speciesButtonTextActive
              ]}>
                {species}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Guardar Paciente</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f766e',
    textAlign: 'center',
    marginVertical: 30,
  },
  form: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    marginBottom: 20,
  },
  speciesButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  speciesButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  speciesButtonActive: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  speciesButtonText: {
    color: '#64748b',
    fontWeight: '500',
  },
  speciesButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
});