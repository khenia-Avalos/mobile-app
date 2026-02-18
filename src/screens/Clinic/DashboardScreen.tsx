// src/screens/Clinic/DashboardScreen.tsx
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
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../api/axios-mobile';

export default function DashboardScreen() {
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
  const [veterinariansCount, setVeterinariansCount] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  // ✅ Función para obtener la fecha actual en Costa Rica (YYYY-MM-DD)
  const getCurrentDateCR = useCallback(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    const crDateStr = date.toLocaleDateString('en-CA', options);
    return crDateStr;
  }, []);

  // ✅ Función para obtener fecha con formato legible
  const getFormattedDateCR = useCallback(() => {
    const date = new Date();
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Costa_Rica'
    });
  }, []);
  
  // Cargar datos iniciales
  useEffect(() => {
    const initialLoad = async () => {
      const todayCR = getCurrentDateCR();
      setCurrentDate(todayCR);
      console.log(' Cargando citas para hoy (Costa Rica):', todayCR);
      
      try {
        // Cargar datos en paralelo pero asegurando que appointments se cargue con el filtro de fecha
        await Promise.all([
          fetchOwners(),
          fetchPets(),
          fetchAppointments({ date: todayCR }) // 👈 IMPORTANTE: Pasar la fecha actual
        ]);
        
        setInitialLoadDone(true);
      } catch (error) {
        console.error('Error loading initial data:', error);
        // Intentar cargar appointments sin filtro si falla con filtro
        try {
          await fetchAppointments();
        } catch (e) {
          console.error('Error loading appointments without filter:', e);
        }
        setInitialLoadDone(true);
      }
    };
    
    initialLoad();
    fetchVeterinariansCount();
  }, []); // Solo ejecutar una vez al montar

  useFocusEffect(
    useCallback(() => {
      const todayCR = getCurrentDateCR();
      
      // Si cambió el día (pasó la medianoche) o es la primera carga
      if (currentDate !== todayCR || !initialLoadDone) {
        console.log('🔄 Día cambiado o primera carga, recargando datos para:', todayCR);
        setCurrentDate(todayCR);
        
        // Recargar appointments con la nueva fecha
        fetchAppointments({ date: todayCR }).catch(error => {
          console.error('Error reloading appointments on focus:', error);
        });
      }
    }, [currentDate, initialLoadDone, getCurrentDateCR])
  );

  // Función para cargar todos los datos (incluyendo veterinarios)
  const loadData = useCallback(async () => {
    const todayCR = getCurrentDateCR();
    setCurrentDate(todayCR);
    
    try {
      await Promise.all([
        fetchOwners(),
        fetchPets(),
        fetchAppointments({ date: todayCR })
      ]);
      await fetchVeterinariansCount();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [getCurrentDateCR]);

  const fetchVeterinariansCount = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      
      let allUsers = [];
      if (response.data?.users) {
        allUsers = response.data.users;
      } else if (Array.isArray(response.data)) {
        allUsers = response.data;
      } else if (response.data?.data) {
        allUsers = response.data.data;
      }
      
      const veterinarians = allUsers.filter((u: any) => u.role === 'veterinarian');
      setVeterinariansCount(veterinarians.length);
    } catch (error) {
      console.error('Error fetching veterinarians count:', error);
      setVeterinariansCount(0);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // ✅ Filtrar citas de hoy cuando cambien appointments
  useEffect(() => {
    const todayCR = getCurrentDateCR();
    
    const todayApts = appointments.filter(apt => {
      // Asegurar que appointmentDate existe y tiene el formato correcto
      if (!apt.appointmentDate) return false;
      
      const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
      const matches = aptDate === todayCR;
      
      if (matches) {
        console.log(` Cita encontrada para hoy: ${apt.title} - ${aptDate}`);
      }
      
      return matches;
    });
    
    console.log(`Citas para hoy (todos los estados): ${todayApts.length} de ${appointments.length} totales`);
    setTodayAppointments(todayApts);
  }, [appointments, getCurrentDateCR]);

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
  
  const handleRegisterNavigation = () => {
    if (user?.role === 'admin') {
      navigation.navigate('Register' as never);
    } else {
      Alert.alert(
        'Acceso Restringido',
        'Solo los administradores pueden registrar nuevos usuarios.',
        [{ text: 'OK' }]
      );
    }
  };

  const navigateToPatients = () => {
    navigation.navigate('Patients' as never);
  };

  const navigateToVeterinarians = () => {
    navigation.navigate('Staff' as never);
  };

  // No mostrar nada hasta que se complete la carga inicial
  if (!initialLoadDone && loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando dashboard...</Text>
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
              Hola, Dr. {user?.username} 
            </Text>
          </TouchableOpacity>
          <Text style={styles.subtitle}>
            {getFormattedDateCR()}
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
          <Text style={styles.statNumber}>{owners.length}</Text>
          <Text style={styles.statLabel}>Clientes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={navigateToPatients}
        >
          <Text style={styles.statNumber}>{pets.length}</Text>
          <Text style={styles.statLabel}>Pacientes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={navigateToVeterinarians}
        >
          <Text style={styles.statNumber}>{veterinariansCount}</Text>
          <Text style={styles.statLabel}>Veterinarios</Text>
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
            <Text style={styles.actionText}>Nueva Cita</Text>
          </TouchableOpacity>
          
          {user?.role === 'admin' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRegisterNavigation}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Registrar Usuario</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Citas de hoy - MUESTRA TODOS LOS ESTADOS */}
      <View style={styles.todaySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Citas para hoy ({todayAppointments.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments' as never)}>
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
          todayAppointments.slice(0, 5).map((apt) => (
            <TouchableOpacity 
              key={apt._id}
              style={styles.appointmentCard}
              onPress={() => {
                Alert.alert(
                  'Detalle de Cita',
                  `${apt.title}\n\n` +
                  `${new Date(apt.appointmentDate).toLocaleDateString('es-ES', { timeZone: 'America/Costa_Rica' })}\n` +
                  ` ${apt.startTime} - ${apt.endTime}\n` +
                  ` ${apt.pet?.name || 'Sin mascota'} (${apt.pet?.species || ''})\n` +
                  ` ${apt.owner?.firstName || ''} ${apt.owner?.lastName || ''}\n` +
                  ` ${apt.veterinarian?.username || ''}\n` +
                  ` ${apt.description || 'Sin descripción'}`,
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
                     {apt.pet.name} ({apt.pet.species})
                  </Text>
                )}
                {apt.owner && (
                  <Text style={styles.aptOwner}>
                     {apt.owner.firstName} {apt.owner.lastName}
                  </Text>
                )}
                {apt.veterinarian && (
                  <Text style={styles.aptVet}>
                     {apt.veterinarian.username}
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
        {todayAppointments.length > 5 && (
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate('Appointments' as never)}
          >
            <Text style={styles.viewMoreText}>Ver {todayAppointments.length - 5} citas más...</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#219eb4',
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
    textTransform: 'capitalize',
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
  todayStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  todayStatItem: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    width: '22%',
    alignItems: 'center',
  },
  todayStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  todayStatLabel: {
    fontSize: 10,
    color: '#0284c7',
    marginTop: 2,
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
    marginBottom: 24,
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
    fontSize: 16,
  },
  emptyButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    marginBottom: 2,
  },
  aptVet: {
    fontSize: 12,
    color: '#0891b2',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewMoreText: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '600',
  },
});