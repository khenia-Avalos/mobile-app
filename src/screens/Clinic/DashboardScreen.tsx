// src/screens/Clinic/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
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
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0];
    await Promise.all([
      fetchOwners(),
      fetchPets(),
      fetchAppointments({ date: today })
    ]);
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // Filtrar citas de hoy programadas/confirmadas
  useEffect(() => {
    const todayApts = appointments.filter(apt => 
      apt.status === 'scheduled' || apt.status === 'confirmed'
    );
    setTodayAppointments(todayApts);
  }, [appointments]);
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>
          Hola, Dr. {user?.username} 👋
        </Text>
        <Text style={styles.subtitle}>
          Clínica Veterinaria
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('Owners' as never)}
        >
          <Text style={styles.statNumber}>{owners.length}</Text>
          <Text style={styles.statLabel}>Clientes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => {
            // TEMPORAL: Muestra alerta hasta crear pantalla Pets
            Alert.alert(
              'Mascotas', 
              `${pets.length} mascotas registradas.\n\nPantalla de mascotas en desarrollo.`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.statNumber}>{pets.length}</Text>
          <Text style={styles.statLabel}>Pacientes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => {
            // TEMPORAL: Muestra alerta hasta crear pantalla Appointments
            Alert.alert(
              'Citas Hoy', 
              `${todayAppointments.length} citas programadas para hoy.\n\nPantalla de citas en desarrollo.`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.statNumber}>{todayAppointments.length}</Text>
          <Text style={styles.statLabel}>Citas Hoy</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
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
              Alert.alert(
                'Próximamente',
                'Formulario de mascotas en desarrollo.\n\nPrimero crea un cliente, luego podrás agregar sus mascotas.',
                [{ text: 'Entendido' }]
              );
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
            <Text style={styles.actionText}>Nueva Cita</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'Próximamente',
                'Calendario de citas en desarrollo.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.actionIcon}>📆</Text>
            <Text style={styles.actionText}>Calendario</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Citas de hoy */}
      <View style={styles.todaySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Citas para hoy</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Próximamente',
              'Lista completa de citas en desarrollo.',
              [{ text: 'OK' }]
            );
          }}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        
        {todayAppointments.length === 0 ? (
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
                  `📝 ${apt.description || 'Sin descripción'}`,
                  [{ text: 'OK' }]
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
      
      {/* Últimos clientes agregados */}
      {owners.length > 0 && (
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Últimos Clientes</Text>
          {owners
            .slice(0, 3)
            .map((owner, index) => (
              <TouchableOpacity 
                key={owner._id || index}
                style={styles.upcomingCard}
                onPress={() => {
                  Alert.alert(
                    'Información del Cliente',
                    `${owner.firstName} ${owner.lastName}\n\n` +
                    `📧 ${owner.email}\n` +
                    `📞 ${owner.phone}\n` +
                    `🏠 ${owner.address || 'Sin dirección'}\n` +
                    `🐾 ${owner.petCount || 0} mascotas`,
                    [
                      { text: 'Cerrar', style: 'cancel' },
                      { 
                        text: 'Ver Detalles', 
                        onPress: () => {
                          // TEMPORAL: Navegar a edición hasta crear pantalla de detalles
                          navigation.navigate('OwnerForm', { id: owner._id } as never);
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.upcomingDate}>
                  {new Date(owner.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
                <Text style={styles.upcomingTitle}>
                  {owner.firstName} {owner.lastName}
                </Text>
                <Text style={styles.upcomingTime}>
                  📞 {owner.phone} • 🐾 {owner.petCount || 0} mascotas
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}
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
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#0f766e',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#bbf7d0',
    marginTop: 4,
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  upcomingSection: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
  },
  upcomingCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  upcomingDate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  upcomingTime: {
    fontSize: 14,
    color: '#64748b',
  },
});