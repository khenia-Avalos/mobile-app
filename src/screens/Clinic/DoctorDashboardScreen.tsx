// src/screens/Clinic/DoctorDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  FlatList,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../contexts/ClinicContext';
import axios from '../../api/axios-mobile';

export default function DoctorDashboardScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { appointments, fetchAppointments, loading } = useClinic();
  
  const [refreshing, setRefreshing] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [todaysDate, setTodaysDate] = useState('');

  useEffect(() => {
    loadDashboardData();
    
    // Establecer fecha actual formateada
  
  }, []);

  const loadDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0];
    await fetchAppointments({ 
      date: today,
      veterinarian: user?.id 
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Filtrar citas del día para este doctor
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const doctorAppointments = appointments.filter(apt => 
      apt.appointmentDate?.split('T')[0] === today &&
      apt.veterinarian?._id === user?.id
    );
    setTodayAppointments(doctorAppointments);
  }, [appointments, user]);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      await axios.patch(`/appointments/${appointmentId}/status`, { status });
      Alert.alert('✅ Éxito', 'Estado actualizado');
      loadDashboardData(); // Recargar datos
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo actualizar el estado');
    }
  };

  const renderAppointment = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => {
        Alert.alert(
          'Detalles de la Cita',
          `📅 ${new Date(item.appointmentDate).toLocaleDateString('es-ES')}\n` +
          `⏰ ${item.startTime} - ${item.endTime}\n` +
          `🐾 Paciente: ${item.pet?.name}\n` +
          `👤 Dueño: ${item.owner?.firstName} ${item.owner?.lastName}\n` +
          `📞 Teléfono: ${item.owner?.phone}\n` +
          `📝 Motivo: ${item.title}\n` +
          `🏷️ Tipo: ${item.type}`,
          [
            { text: 'Cerrar', style: 'cancel' },
            { 
              text: 'Marcar como En Progreso', 
              onPress: () => handleUpdateAppointmentStatus(item._id, 'in-progress'),
              style: 'default'
            },
            { 
              text: 'Marcar como Completada', 
              onPress: () => handleUpdateAppointmentStatus(item._id, 'completed'),
              style: 'default'
            }
          ]
        );
      }}
    >
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentTime}>
          {item.startTime} - {item.endTime}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.appointmentTitle}>{item.title}</Text>
      
      <View style={styles.appointmentDetails}>
        <Text style={styles.patientInfo}>
          🐾 {item.pet?.name} ({item.pet?.species})
        </Text>
        <Text style={styles.ownerInfo}>
          👤 {item.owner?.firstName} {item.owner?.lastName}
        </Text>
        {item.pet?.specialConditions && (
          <Text style={styles.specialConditions}>
            ⚠️ {item.pet.specialConditions}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>
            Hola, Dr. {user?.username} 
          </Text>
          <Text style={styles.subtitle}>
            {todaysDate}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Salir</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Resumen del Día</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{todayAppointments.length}</Text>
            <Text style={styles.statLabel}>Total Citas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {todayAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length}
            </Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {todayAppointments.filter(a => a.status === 'in-progress').length}
            </Text>
            <Text style={styles.statLabel}>En Progreso</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {todayAppointments.filter(a => a.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.appointmentsSection}>
        <Text style={styles.sectionTitle}>
          Citas para Hoy ({todayAppointments.length})
        </Text>
        
        {todayAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
         
          </View>
        ) : (
          <FlatList
            data={todayAppointments}
            renderItem={renderAppointment}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </View>
      
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Mi Perfil</Text>
          </TouchableOpacity>
         
          
        
        </View>
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
    case 'cancelled': return '#ef4444';
    case 'no-show': return '#8b5cf6';
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#219eb4',
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#bbf7d0',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  statLabel: {
    fontSize: 12,
    color: '#0284c7',
    marginTop: 4,
  },
  appointmentsSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0891b2',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  appointmentDetails: {
    marginTop: 4,
  },
  patientInfo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  ownerInfo: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  specialConditions: {
    fontSize: 12,
    color: '#dc2626',
    fontStyle: 'italic',
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  quickActions: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#f0f9ff',
    width: '31%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0c4a6e',
    textAlign: 'center',
  },
});