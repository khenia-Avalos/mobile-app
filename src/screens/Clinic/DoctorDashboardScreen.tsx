// src/screens/Clinic/DoctorDashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  const [currentDateCR, setCurrentDateCR] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // ✅ Función para obtener la fecha actual en Costa Rica (YYYY-MM-DD)
  const getCurrentDateCR = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    return date.toLocaleDateString('en-CA', options);
  };

  // ✅ Función para obtener la fecha de la cita SIN CONVERSIÓN
  const getAppointmentDate = (apt: any): string => {
    if (!apt.appointmentDate) return '';
    
    if (apt.appointmentDate.includes('T')) {
      return apt.appointmentDate.split('T')[0];
    }
    
    return apt.appointmentDate;
  };

  // ✅ Cargar datos cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      console.log(' DoctorDashboard enfocado - cargando datos...');
      loadDashboardData();
    }, [])
  );

  useEffect(() => {
    const crDate = getCurrentDateCR();
    setCurrentDateCR(crDate);
    
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Costa_Rica'
    };
    setTodaysDate(today.toLocaleDateString('es-ES', options));
    
    loadDashboardData();
    
    const interval = setInterval(() => {
      const newCRDate = getCurrentDateCR();
      if (newCRDate !== currentDateCR) {
        console.log('Día cambiado en CR, recargando datos...');
        setCurrentDateCR(newCRDate);
        
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          timeZone: 'America/Costa_Rica'
        };
        setTodaysDate(today.toLocaleDateString('es-ES', options));
        
        loadDashboardData();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // ✅ EFECTO PRINCIPAL: Filtrar citas cada vez que cambian
  useEffect(() => {
    if (!initialLoadDone && appointments.length === 0) {
      console.log(' Esperando carga inicial de citas...');
      return;
    }
    
    filterTodayAppointments();
  }, [appointments, currentDateCR]);

  const filterTodayAppointments = () => {
    const todayCR = getCurrentDateCR();
    const vetId = user?._id || user?.id;
    
    console.log(' Filtrando citas para hoy:', todayCR);
    console.log('    Total citas disponibles:', appointments.length);
    
    if (appointments.length === 0) {
      console.log('   No hay citas para filtrar');
      setTodayAppointments([]);
      return;
    }
    
    // Mostrar todas las fechas para depuración
    appointments.forEach(apt => {
      const aptDate = getAppointmentDate(apt);
      console.log(`   Cita: ${apt.title} - Fecha backend: ${apt.appointmentDate} - Fecha extraída: ${aptDate}`);
    });
    
    const filtered = appointments.filter(apt => {
      const aptDate = getAppointmentDate(apt);
      const isToday = aptDate === todayCR;
      
      if (isToday) {
        console.log(`   Cita de HOY: ${apt.title} - ${apt.startTime} (${apt.status})`);
      }
      
      return isToday;
    });
    
    console.log(`Total citas para hoy: ${filtered.length}`);
    setTodayAppointments(filtered);
    setInitialLoadDone(true);
  };

  const loadDashboardData = async () => {
    const todayCR = getCurrentDateCR();
    const vetId = user?._id || user?.id;
    
    console.log(' DoctorDashboard - Cargando citas:');
    console.log('    Usuario:', user?.username);
    console.log('    ID del usuario:', vetId);
    console.log('    Fecha Costa Rica:', todayCR);
    
    try {
      // Cargar citas con filtro por fecha y por veterinario
      await fetchAppointments({ 
        date: todayCR,
        veterinarian: vetId,
        showPast: 'true' // Incluir todos los estados
      });
      
      console.log('Citas cargadas correctamente');
    } catch (error) {
      console.error(' Error cargando citas:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

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
      console.log(` Actualizando cita ${appointmentId} a estado: ${status}`);
      const response = await axios.patch(`/api/appointments/${appointmentId}/status`, { status });
      console.log(' Respuesta:', response.data);
      Alert.alert('Éxito', 'Estado actualizado');
      await loadDashboardData(); // Recargar después de actualizar
    } catch (error: any) {
      console.error(' Error al actualizar estado:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar el estado');
    }
  };

  const renderAppointment = ({ item }: any) => {
    const aptDate = getAppointmentDate(item);
    const [year, month, day] = aptDate.split('-');
    const displayDate = `${day}/${month}/${year}`;
    
    return (
      <TouchableOpacity 
        style={styles.appointmentCard}
        onPress={() => {
          Alert.alert(
            'Detalles de la Cita',
            `Fecha: ${displayDate}\n` +
            `Hora: ${item.startTime} - ${item.endTime}\n` +
            `Paciente: ${item.pet?.name || 'No especificado'}\n` +
            `Dueño: ${item.owner?.firstName || ''} ${item.owner?.lastName || ''}\n` +
            `Teléfono: ${item.owner?.phone || 'No registrado'}\n` +
            `Motivo: ${item.title}\n` +
            `Tipo: ${item.type || 'No especificado'}`,
            [
              { text: 'Cerrar', style: 'cancel' },
              ...(item.status !== 'in-progress' ? [{ 
                text: 'Marcar como En Progreso', 
                onPress: () => handleUpdateAppointmentStatus(item._id, 'in-progress')
              }] : []),
              ...(item.status !== 'completed' ? [{ 
                text: 'Marcar como Completada', 
                onPress: () => handleUpdateAppointmentStatus(item._id, 'completed')
              }] : [])
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
             {item.pet?.name || 'Sin mascota'} ({item.pet?.species || '?'})
          </Text>
          <Text style={styles.ownerInfo}>
             {item.owner?.firstName || ''} {item.owner?.lastName || ''}
          </Text>
          {item.pet?.specialConditions && (
            <Text style={styles.specialConditions}>
               {item.pet.specialConditions}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const totalAppointments = todayAppointments.length;
  const pendingAppointments = todayAppointments.filter(a => 
    a.status === 'scheduled' || a.status === 'confirmed'
  ).length;
  const inProgressAppointments = todayAppointments.filter(a => 
    a.status === 'in-progress'
  ).length;
  const completedAppointments = todayAppointments.filter(a => 
    a.status === 'completed'
  ).length;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)}>
          <Text style={styles.welcome}>
            Hola, Dra. {user?.username} {user?.lastname}
          </Text>
        </TouchableOpacity>
     
      </View>
      
      <View style={styles.dateCard}>
        <Text style={styles.dateText}>{todaysDate}</Text>
        <Text style={styles.dateSubtext}>Hora CR: {new Date().toLocaleTimeString('es-ES', { timeZone: 'America/Costa_Rica', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Resumen del Día</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalAppointments}</Text>
            <Text style={styles.statLabel}>Total Citas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pendingAppointments}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{inProgressAppointments}</Text>
            <Text style={styles.statLabel}>En Progreso</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedAppointments}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.appointmentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Citas para Hoy ({totalAppointments})
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('DoctorAppointments' as never)}>
            <Text style={styles.seeAllLink}>Ver todas mis citas ›</Text>
          </TouchableOpacity>
        </View>
        
        {loading && !refreshing && todayAppointments.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando citas...</Text>
          </View>
        ) : todayAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay citas para hoy</Text>
            <Text style={styles.emptySubtext}>Disfruta tu día</Text>
          </View>
        ) : (
          <FlatList
            data={todayAppointments.slice(0, 3)}
            renderItem={renderAppointment}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
        
        {todayAppointments.length > 3 && (
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate('DoctorAppointments' as never)}
          >
            <Text style={styles.viewMoreText}>
              Ver {todayAppointments.length - 3} citas más...
            </Text>
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
  dateCard: {
    backgroundColor: '#e6f7ff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  dateText: {
    fontSize: 16,
    color: '#0369a1',
    fontWeight: '500',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  dateSubtext: {
    fontSize: 14,
    color: '#0284c7',
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
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
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
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
  seeAllLink: {
    fontSize: 14,
    color: '#0891b2',
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
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '600',
  },
});