// src/screens/Clinic/AppointmentsScreen.tsx (versión básica)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AppointmentsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Citas</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AppointmentForm' as never)}
        >
          <Text style={styles.addButtonText}>+ Nueva Cita</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.comingSoon}>
        Calendario de Citas - Próximamente
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  addButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  comingSoon: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
    fontSize: 16,
  },
});