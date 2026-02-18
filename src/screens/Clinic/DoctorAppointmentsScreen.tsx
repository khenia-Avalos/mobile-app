// src/screens/Clinic/DoctorAppointmentsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ScrollView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../api/axios-mobile';
import { Calendar, DateData } from 'react-native-calendars';

// Tipos
interface Appointment {
  _id: string;
  title: string;
  description?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
  type: string;
  pet?: {
    _id: string;
    name: string;
    species: string;
    breed?: string;
  };
  owner?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  veterinarian?: {
    _id: string;
    username: string;
  };
}

// Colores para estados
const statusColors = {
  'scheduled': '#3b82f6',
  'confirmed': '#10b981',
  'in-progress': '#f59e0b',
  'completed': '#6b7280',
  'cancelled': '#ef4444',
  'no-show': '#8b5cf6',
  'rescheduled': '#f97316'
};

const statusLabels = {
  'scheduled': 'Programada',
  'confirmed': 'Confirmada',
  'in-progress': 'En Progreso',
  'completed': 'Completada',
  'cancelled': 'Cancelada',
  'no-show': 'No Asistió',
  'rescheduled': 'Reprogramada'
};

// Función para obtener fecha actual en Costa Rica (YYYY-MM-DD)
const getCurrentDateCR = (): string => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  return date.toLocaleDateString('en-CA', options);
};

// Función para obtener fecha de la cita SIN CONVERSIÓN
const getAppointmentDate = (apt: any): string => {
  if (!apt.appointmentDate) return '';
  if (apt.appointmentDate.includes('T')) {
    return apt.appointmentDate.split('T')[0];
  }
  return apt.appointmentDate;
};

// Función para formatear fecha
const formatDateCR = (dateString: string, options: Intl.DateTimeFormatOptions) => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return date.toLocaleDateString('es-CR', { 
      timeZone: 'America/Costa_Rica',
      ...options 
    });
  } catch (error) {
    return dateString;
  }
};

export default function DoctorAppointmentsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // 📌 ESTADO LOCAL - Aquí guardamos las citas para que NO desaparezcan
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de UI
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDateCR());
  const [markedDates, setMarkedDates] = useState<any>({});
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Appointment[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // 📌 SOLUCIÓN RADICAL: Cargar citas DIRECTAMENTE con axios
  const loadAppointmentsDirect = async (showLoading = true) => {
    const vetId = user?._id || user?.id;
    
    if (!vetId) {
      console.log('❌ No hay ID de veterinario');
      return;
    }
    
    if (showLoading) setLoading(true);
    
    try {
      console.log('📡 Cargando citas del veterinario:', vetId);
      
      // Llamada directa al API en lugar de depender del contexto
      const response = await axios.get('/api/appointments', {
        params: { 
          veterinarianId: vetId,
          showPast: 'true'
        }
      });
      
      let appointmentsData = [];
      if (response.data?.appointments) {
        appointmentsData = response.data.appointments;
      } else if (Array.isArray(response.data)) {
        appointmentsData = response.data;
      } else if (response.data?.data) {
        appointmentsData = response.data.data;
      }
      
      console.log(`✅ Cargadas ${appointmentsData.length} citas`);
      
      // 📌 GUARDAR EN ESTADO LOCAL - así no desaparecen
      setMyAppointments(appointmentsData);
      
      // Actualizar filtros y marcadores
      updateLocalData(appointmentsData, selectedDate);
      
    } catch (error) {
      console.error('❌ Error cargando citas:', error);
      Alert.alert('Error', 'No se pudieron cargar las citas');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para actualizar datos locales
  const updateLocalData = (appointments: Appointment[], date: string) => {
    // Filtrar por fecha
    const filtered = appointments.filter(apt => {
      const aptDate = getAppointmentDate(apt);
      return aptDate === date;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    setFilteredAppointments(filtered);
    
    // Actualizar marcadores del calendario
    const marks: any = {};
    appointments.forEach(apt => {
      const aptDate = getAppointmentDate(apt);
      if (!marks[aptDate]) {
        marks[aptDate] = {
          marked: true,
          dotColor: statusColors[apt.status as keyof typeof statusColors] || '#6b7280'
        };
      }
    });
    
    marks[date] = {
      ...marks[date],
      selected: true,
      selectedColor: '#0891b2'
    };
    
    setMarkedDates(marks);
  };

  // 📌 Cargar al montar el componente
  useEffect(() => {
    loadAppointmentsDirect();
  }, []);

  // 📌 Cargar CADA VEZ que la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 Pantalla enfocada - recargando citas...');
      loadAppointmentsDirect(false); // false para no mostrar loading pesado
    }, [])
  );

  // Efecto para actualizar cuando cambia la fecha seleccionada
  useEffect(() => {
    if (myAppointments.length > 0) {
      updateLocalData(myAppointments, selectedDate);
    }
  }, [selectedDate, myAppointments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointmentsDirect(false);
  };

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Ingresa un término de búsqueda');
      return;
    }

    setSearchLoading(true);
    try {
      const term = searchTerm.toLowerCase();
      const results = myAppointments.filter(apt => {
        const ownerName = apt.owner ? 
          `${apt.owner.firstName} ${apt.owner.lastName}`.toLowerCase() : '';
        const petName = apt.pet?.name?.toLowerCase() || '';
        
        return ownerName.includes(term) || petName.includes(term);
      });

      setSearchResults(results);
      
      if (results.length === 0) {
        Alert.alert('Sin resultados', 'No se encontraron citas con ese término');
      }
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
    } finally {
      setSearchLoading(false);
    }
  };

  const viewAppointmentDetails = (appointment: Appointment) => {
    const aptDate = getAppointmentDate(appointment);
    const [year, month, day] = aptDate.split('-');
    const displayDate = `${day}/${month}/${year}`;
    
    Alert.alert(
      'Detalle de Cita',
      `${appointment.title}\n\n` +
      `Fecha: ${displayDate}\n` +
      `Hora: ${appointment.startTime} - ${appointment.endTime}\n` +
      `Mascota: ${appointment.pet?.name || 'Sin mascota'} (${appointment.pet?.species || '?'})\n` +
      `Dueño: ${appointment.owner?.firstName || ''} ${appointment.owner?.lastName || ''}\n` +
      `Descripción: ${appointment.description || 'Sin descripción'}`,
      [
        { text: 'Cerrar' },
        { 
          text: 'Cambiar Estado',
          onPress: () => showStatusOptions(appointment)
        }
      ]
    );
  };

  const showStatusOptions = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setStatusModalVisible(true);
  };

  const handleStatusSelect = async (newStatus: string) => {
    if (!selectedAppointment) return;
    
    setStatusModalVisible(false);
    
    if (newStatus === 'reschedule') {
      handleReschedule(selectedAppointment);
    } else {
      await updateAppointmentStatus(selectedAppointment._id, newStatus);
    }
  };

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    setUpdatingStatus(id);
    try {
      console.log(`Actualizando cita ${id} a estado: ${newStatus}`);
      
      const response = await axios.patch(`/api/appointments/${id}/status`, { status: newStatus });
      
      if (response.data?.success) {
        // Actualizar estado local INMEDIATAMENTE
        const updatedAppointments = myAppointments.map(apt => 
          apt._id === id ? { ...apt, status: newStatus as any } : apt
        );
        
        setMyAppointments(updatedAppointments);
        updateLocalData(updatedAppointments, selectedDate);
        
        Alert.alert(
          'Éxito',
          `Cita marcada como ${statusLabels[newStatus as keyof typeof statusLabels]}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', response.data?.message || 'No se pudo actualizar el estado');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      Alert.alert('Error', error.message || 'Error al actualizar el estado');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    Alert.alert(
      'Reprogramar Cita',
      '¿Estás seguro de eliminar esta cita y crear una nueva?\n\n' +
      'Se eliminará la cita actual y podrás agendar un nuevo horario.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, reprogramar',
          style: 'destructive',
          onPress: async () => {
            setUpdatingStatus(appointment._id);
            try {
              const response = await axios.delete(`/api/appointments/${appointment._id}`);
              
              if (response.data?.success) {
                // Eliminar del estado local
                const updatedAppointments = myAppointments.filter(apt => apt._id !== appointment._id);
                setMyAppointments(updatedAppointments);
                updateLocalData(updatedAppointments, selectedDate);
                
                Alert.alert(
                  'Cita eliminada',
                  'Ahora puedes crear una nueva cita',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        navigation.navigate('AppointmentForm' as never, {
                          petId: appointment.pet?._id,
                          ownerId: appointment.owner?._id
                        } as never);
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Error', response.data?.message || 'No se pudo eliminar la cita');
              }
            } catch (error: any) {
              console.error('Error rescheduling:', error);
              Alert.alert('Error', error.message || 'Error al reprogramar la cita');
            } finally {
              setUpdatingStatus(null);
            }
          }
        }
      ]
    );
  };

  const renderAppointmentCard = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={[
        styles.appointmentCard,
        { borderLeftColor: statusColors[item.status] || '#0891b2' }
      ]}
      onPress={() => viewAppointmentDetails(item)}
      disabled={updatingStatus === item._id}
    >
      {updatingStatus === item._id && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      )}
      
      <View style={styles.appointmentHeader}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#6b7280' }]}>
          <Text style={styles.statusText}>
            {statusLabels[item.status as keyof typeof statusLabels] || item.status}
          </Text>
        </View>
        <Text style={styles.appointmentTime}>{item.startTime} - {item.endTime}</Text>
      </View>

      <Text style={styles.appointmentTitle}>{item.title}</Text>

      <View style={styles.appointmentDetails}>
        {item.pet && (
          <Text style={styles.detailText}>
            {item.pet.name} ({item.pet.species})
          </Text>
        )}
        {item.owner && (
          <Text style={styles.detailText}>
            {item.owner.firstName} {item.owner.lastName}
          </Text>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.changeStatusButton, { backgroundColor: statusColors[item.status] || '#6b7280' }]}
          onPress={() => showStatusOptions(item)}
          disabled={updatingStatus === item._id}
        >
          <Text style={styles.changeStatusText}>Cambiar Estado</Text>
        </TouchableOpacity>

        {item.status !== 'rescheduled' && (
          <TouchableOpacity
            style={styles.rescheduleButton}
            onPress={() => handleReschedule(item)}
            disabled={updatingStatus === item._id}
          >
            <Text style={styles.rescheduleButtonText}>Reprogramar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const isToday = selectedDate === getCurrentDateCR();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Mis Citas</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {formatDateCR(selectedDate, { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
            {isToday && <Text style={styles.todayTag}> (Hoy)</Text>}
          </Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <Text style={styles.iconButtonText}>Buscar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
          >
            <Text style={styles.iconButtonText}>
              {viewMode === 'calendar' ? 'Lista' : 'Calendario'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AppointmentForm' as never)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modo Vista */}
      {viewMode === 'calendar' ? (
        <>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: '#0891b2',
              todayTextColor: '#0891b2',
              arrowColor: '#0891b2',
              monthTextColor: '#0f172a',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13
            }}
            style={styles.calendar}
          />

          <View style={styles.appointmentsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Citas del {formatDateCR(selectedDate, { 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </Text>
              <Text style={styles.appointmentCount}>
                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'cita' : 'citas'}
              </Text>
            </View>

            {loading && !refreshing && filteredAppointments.length === 0 ? (
              <ActivityIndicator size="large" color="#0891b2" style={styles.loader} />
            ) : filteredAppointments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay citas para este día</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AppointmentForm' as never)}
                >
                  <Text style={styles.emptyButtonText}>Agendar Cita</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filteredAppointments}
                renderItem={renderAppointmentCard}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            )}
          </View>
        </>
      ) : (
        <FlatList
          data={myAppointments.sort((a, b) => {
            const dateA = getAppointmentDate(a);
            const dateB = getAppointmentDate(b);
            if (dateA === dateB) {
              return a.startTime.localeCompare(b.startTime);
            }
            return dateB.localeCompare(dateA);
          })}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>Todas mis Citas</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay citas registradas</Text>
            </View>
          }
        />
      )}

      {/* Modal de Búsqueda */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buscar Citas</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Nombre del cliente o mascota..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={searchLoading}
              >
                {searchLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.searchButtonText}>Buscar</Text>
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 && (
              <>
                <Text style={styles.resultsText}>
                  {searchResults.length} resultado(s) encontrado(s)
                </Text>
                <FlatList
                  data={searchResults}
                  renderItem={({ item }) => {
                    const aptDate = getAppointmentDate(item);
                    const [year, month, day] = aptDate.split('-');
                    const displayDate = `${day}/${month}/${year}`;
                    
                    return (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => {
                          setSelectedDate(aptDate);
                          setSearchModalVisible(false);
                          setViewMode('calendar');
                        }}
                      >
                        <Text style={styles.searchResultTitle}>{item.title}</Text>
                        <Text style={styles.searchResultSubtitle}>
                          {displayDate} {item.startTime} - {item.pet?.name}
                        </Text>
                        <Text style={styles.searchResultOwner}>
                          {item.owner?.firstName} {item.owner?.lastName}
                        </Text>
                        <View style={[styles.searchResultStatus, { backgroundColor: statusColors[item.status] }]}>
                          <Text style={styles.searchResultStatusText}>
                            {statusLabels[item.status as keyof typeof statusLabels]}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  keyExtractor={(item) => item._id}
                  style={styles.resultsList}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE ESTADOS */}
      <Modal
        visible={statusModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Estado</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <View style={styles.currentStatusContainer}>
                <Text style={styles.currentStatusLabel}>Estado actual:</Text>
                <View style={[styles.currentStatusBadge, { backgroundColor: statusColors[selectedAppointment.status] }]}>
                  <Text style={styles.currentStatusText}>
                    {statusLabels[selectedAppointment.status]}
                  </Text>
                </View>
              </View>
            )}

            <ScrollView style={styles.statusList}>
              {Object.entries(statusLabels).map(([key, label]) => (
                key !== 'rescheduled' && (
                  <TouchableOpacity
                    key={key}
                    style={[styles.statusOption, { borderLeftColor: statusColors[key as keyof typeof statusColors] }]}
                    onPress={() => handleStatusSelect(key)}
                  >
                    <Text style={styles.statusOptionText}>{label}</Text>
                  </TouchableOpacity>
                )
              ))}
              <TouchableOpacity
                style={[styles.statusOption, { borderLeftColor: '#f97316', marginBottom: 20 }]}
                onPress={() => handleStatusSelect('reschedule')}
              >
                <Text style={styles.statusOptionText}>Reprogramar (eliminar y crear nueva)</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#219eb4',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 13,
    color: '#bbf7d0',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  todayTag: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  calendar: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appointmentsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  appointmentCount: {
    fontSize: 14,
    color: '#64748b',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    position: 'relative',
  },
  updatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  appointmentTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  appointmentDetails: {
    gap: 2,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  changeStatusButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  changeStatusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  rescheduleButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f97316',
    flex: 1,
    alignItems: 'center',
  },
  rescheduleButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalClose: {
    fontSize: 22,
    color: '#64748b',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchButton: {
    backgroundColor: '#0891b2',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsText: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    color: '#64748b',
    fontWeight: '500',
  },
  resultsList: {
    padding: 16,
  },
  searchResultItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  searchResultOwner: {
    fontSize: 12,
    color: '#0891b2',
    marginBottom: 4,
  },
  searchResultStatus: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  searchResultStatusText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '600',
  },
  currentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  currentStatusLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  currentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  currentStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusList: {
    padding: 16,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    padding: 14,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});