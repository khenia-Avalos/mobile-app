// mobile-app/src/screens/Clinic/AppointmentsScreen.tsx - VERSIÓN SIMPLIFICADA
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';

export default function AppointmentsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { loading } = useClinic();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Citas</Text>
          <Text style={styles.subtitle}>
            {user?.role === 'veterinarian' ? 'Mis Citas' : 'Gestión de Citas'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AppointmentForm' as never)}
        >
          <Text style={styles.addButtonText}>+ Nueva Cita</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.comingSoon}>Calendario de Citas</Text>
          <Text style={styles.comingSoonSubtitle}>
            Próximamente: Vista completa de citas y calendario
          </Text>
          
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={() => navigation.navigate('AppointmentForm' as never)}
          >
            <Text style={styles.demoButtonText}>Crear Nueva Cita</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#0f766e',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#bbf7d0',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  demoButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  demoButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});