// src/screens/Clinic/ReceptionDashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../contexts/ClinicContext';

export default function ReceptionDashboardScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { 
    owners, 
    pets, 
    appointments, 
    fetchOwners, 
    fetchPets, 
    fetchAppointments,
    loading 
  } = useClinic();
  
  const [refreshing, setRefreshing] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Cargando datos para recepción - fecha:', today);
      
      // Cargar todos los datos sin filtros
      const [ownersData, petsData, appointmentsData] = await Promise.all([
        fetchOwners(),
        fetchPets(),
        fetchAppointments({ date: today })
      ]);
      
      console.log('📊 Datos cargados:', {
        owners: ownersData?.length || 0,
        pets: petsData?.length || 0,
        appointments: appointmentsData?.length || 0
      });
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos. Intente nuevamente.',
        [{ text: 'OK' }]
      );
    }
  }, [fetchOwners, fetchPets, fetchAppointments]);

  // Cargar datos cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Actualizar citas de hoy cuando cambien las citas
  useEffect(() => {
    console.log('🔄 Actualizando citas de hoy. Total citas:', appointments?.length);
    
    if (appointments && appointments.length > 0) {
      const todayApts = appointments.filter((apt: any) => 
        apt.status === 'scheduled' || apt.status === 'confirmed'
      );
      setTodayAppointments(todayApts);
      console.log('📅 Citas de hoy filtradas:', todayApts.length);
    } else {
      setTodayAppointments([]);
    }
  }, [appointments]);

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

  // Mostrar indicador de carga
  if (!dataLoaded && loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)}>
            <Text style={styles.welcome}>
              Hola, {user?.username} 👋
            </Text>
          </TouchableOpacity>
          <Text style={styles.subtitle}>
            Recepción - Clínica Veterinaria
          </Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('Owners' as never)}
        >
          <Text style={styles.statNumber}>{owners?.length || 0}</Text>
          <Text style={styles.statLabel}>Clientes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => {
            Alert.alert(
              'Mascotas', 
              `${pets?.length || 0} mascotas registradas.`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.statNumber}>{pets?.length || 0}</Text>
          <Text style={styles.statLabel}>Pacientes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('Appointments' as never)}
        >
          <Text style={styles.statNumber}>{todayAppointments?.length || 0}</Text>
          <Text style={styles.statLabel}>Citas Hoy</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.quickActions}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        </View>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('OwnerForm' as never)}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Nuevo Cliente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              navigation.navigate('Owners' as never);
              setTimeout(() => {
                Alert.alert(
                  'Agregar Mascota',
                  'Selecciona un cliente de la lista y luego toca "Agregar Mascota" en su perfil.',
                  [{ text: 'Entendido' }]
                );
              }, 500);
            }}
          >
            <Text style={styles.actionIcon}>🐕</Text>
            <Text style={styles.actionText}>Nuevo Paciente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AppointmentForm' as never)}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Agendar Cita</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Appointments' as never)}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Ver Agenda</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.todaySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Citas para hoy</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments' as never)}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        
        {!todayAppointments || todayAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay citas para hoy</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AppointmentForm' as never)}
            >
              <Text style={styles.emptyButtonText}>Agendar primera cita</Text>
            </TouchableOpacity>
          </View>
        ) : (
          todayAppointments.slice(0, 3).map((apt, index) => (
            <TouchableOpacity 
              key={apt._id || index}
              style={styles.appointmentCard}
              onPress={() => {
                Alert.alert(
                  'Detalle de Cita',
                  `${apt.title}\n\n` +
                  `📅 ${new Date(apt.appointmentDate).toLocaleDateString('es-ES')}\n` +
                  `⏰ ${apt.startTime} - ${apt.endTime}\n` +
                  `🐾 ${apt.pet?.name || 'Sin mascota'}\n` +
                  `👤 ${apt.owner?.firstName || ''} ${apt.owner?.lastName || ''}\n` +
                  `📞 ${apt.owner?.phone || 'Sin teléfono'}\n` +
                  `📝 ${apt.description || 'Sin descripción'}`,
                  [
                    { text: 'Cerrar', style: 'cancel' },
                    { 
                      text: 'Ver en Agenda', 
                      onPress: () => navigation.navigate('Appointments' as never)
                    }
                  ]
                );
              }}
            >
              <View style={styles.aptInfo}>
                <Text style={styles.aptTime}>
                  {apt.startTime} - {apt.endTime}
                </Text>
                <Text style={styles.aptTitle}>{apt.title}</Text>
                {apt.pet && (
                  <Text style={styles.aptPet}>
                    🐾 {apt.pet.name} ({apt.pet.species})
                  </Text>
                )}
                {apt.owner && (
                  <Text style={styles.aptOwner}>
                    👤 {apt.owner.firstName} {apt.owner.lastName}
                  </Text>
                )}
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(apt.status) }
              ]}>
                <Text style={styles.statusText}>
                  {getStatusText(apt.status)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
      
      <View style={styles.quickNotes}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recordatorios</Text>
        </View>
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            • Verificar disponibilidad de veterinarios antes de agendar citas
          </Text>
          <Text style={styles.noteText}>
            • Confirmar citas con 24 horas de anticipación
          </Text>
          <Text style={styles.noteText}>
            • Registrar alergias y condiciones especiales de mascotas
          </Text>
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
    backgroundColor: '#0f766e',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  quickActions: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#f8fafc',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  seeAll: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#94a3b8',
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  appointmentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#0891b2',
  },
  aptInfo: {
    flex: 1,
  },
  aptTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  aptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  aptPet: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  aptOwner: {
    fontSize: 13,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  quickNotes: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noteCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  noteText: {
    fontSize: 14,
    color: '#0c4a6e',
    marginBottom: 8,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#0f172a',
  },
});