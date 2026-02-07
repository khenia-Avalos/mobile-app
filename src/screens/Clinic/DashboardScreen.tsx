// src/screens/Clinic/DashboardScreen.tsx
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { 
    clients, 
    appointments, 
    fetchClients, 
    fetchAppointments,
    loading 
  } = useClinic();

  useEffect(() => {
    fetchClients();
    fetchAppointments({ date: new Date().toISOString().split('T')[0] });
  }, []);

  const todayAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' || apt.status === 'confirmed'
  ).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          Hola, Dr. {user?.username} 👋
        </Text>
        <Text style={styles.subtitle}>
          Panel de Control - Clínica Veterinaria
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{clients.length}</Text>
          <Text style={styles.statLabel}>Pacientes</Text>
          <TouchableOpacity 
            style={styles.statButton}
            onPress={() => navigation.navigate('Clients' as never)}
          >
            <Text style={styles.statButtonText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayAppointments}</Text>
          <Text style={styles.statLabel}>Citas Hoy</Text>
          <TouchableOpacity 
            style={styles.statButton}
            onPress={() => navigation.navigate('Appointments' as never)}
          >
            <Text style={styles.statButtonText}>Ver agenda</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ClientForm' as never)}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Nuevo Paciente</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AppointmentForm' as never)}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Nueva Cita</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Calendar' as never)}
          >
            <Text style={styles.actionIcon}>📆</Text>
            <Text style={styles.actionText}>Calendario</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Próximamente', 'Reportes en desarrollo')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Reportes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Citas de hoy */}
      <View style={styles.todaySection}>
        <Text style={styles.sectionTitle}>Citas para hoy</Text>
        {todayAppointments === 0 ? (
          <Text style={styles.emptyText}>No hay citas para hoy</Text>
        ) : (
          appointments.slice(0, 3).map((apt, index) => (
            <View key={index} style={styles.appointmentCard}>
              <View>
                <Text style={styles.aptTitle}>{apt.title}</Text>
                <Text style={styles.aptClient}>{apt.client?.petName || 'Paciente'}</Text>
                <Text style={styles.aptTime}>
                  {apt.startTime} - {apt.endTime}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(apt.status) }
              ]}>
                <Text style={styles.statusText}>
                  {getStatusText(apt.status)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch(status) {
    case 'scheduled': return '#3b82f6';
    case 'confirmed': return '#10b981';
    case 'in-progress': return '#f59e0b';
    case 'completed': return '#6b7280';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  statButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  statButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  todaySection: {
    marginBottom: 40,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  aptClient: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  aptTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});