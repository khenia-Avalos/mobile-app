// src/screens/Clinic/DoctorAppointmentsScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';
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
  'scheduled': '#3b82f6',      // Azul - Programada
  'confirmed': '#10b981',      // Verde - Confirmada
  'in-progress': '#f59e0b',    // Naranja - En Progreso
  'completed': '#6b7280',      // Gris - Completada
  'cancelled': '#ef4444',       // Rojo - Cancelada
  'no-show': '#8b5cf6',        // Púrpura - No Asistió
  'rescheduled': '#f97316'      // Naranja quemado - Reprogramada
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

// Función para formatear fecha correctamente en zona horaria de Costa Rica
const formatDateCR = (dateString: string, options: Intl.DateTimeFormatOptions) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
  return date.toLocaleDateString('es-CR', { 
    timeZone: 'America/Costa_Rica',
    ...options 
  });
};

export default function DoctorAppointmentsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { appointments, fetchAppointments, updateAppointment, deleteAppointment, loading } = useClinic();
  
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
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

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      filterAppointmentsByDate(selectedDate);
      updateMarkedDates();
    }
  }, [appointments, selectedDate]);

  const loadAppointments = async () => {
    // Cargar SOLO las citas del doctor actual
    await fetchAppointments({ 
      showPast: 'true',
      veterinarianId: user?._id || user?.id
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const filterAppointmentsByDate = (date: string) => {
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
      return aptDate === date;
    });
    
    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setFilteredAppointments(filtered);
  };

  const updateMarkedDates = () => {
    const marks: any = {};
    
    appointments.forEach(apt => {
      const date = new Date(apt.appointmentDate).toISOString().split('T')[0];
      
      if (!marks[date]) {
        marks[date] = {
          marked: true,
          dotColor: statusColors[apt.status as keyof typeof statusColors] || '#6b7280',
          selected: date === selectedDate
        };
      } else if (date === selectedDate) {
        marks[date].selected = true;
      }
    });
    
    if (!marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: '#0891b2'
      };
    } else {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = '#0891b2';
    }
    
    setMarkedDates(marks);
  };

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
    filterAppointmentsByDate(day.dateString);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Ingresa un término de búsqueda');
      return;
    }

    setSearchLoading(true);
    try {
      const term = searchTerm.toLowerCase();
      const results = appointments.filter(apt => {
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
    Alert.alert(
      'Detalle de Cita',
      `${appointment.title}\n\n` +
      `Fecha: ${new Date(appointment.appointmentDate).toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica' })}\n` +
      `Hora: ${appointment.startTime} - ${appointment.endTime}\n` +
      `Mascota: ${appointment.pet?.name || 'Sin mascota'} (${appointment.pet?.species || '?'})\n` +
      `Dueño: ${appointment.owner?.firstName || ''} ${appointment.owner?.lastName || ''}\n` +
      `Veterinario: ${appointment.veterinarian?.username || ''}\n` +
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
      const result = await updateAppointment(id, { status: newStatus });
      
      if (result.success) {
        const updatedAppointments = appointments.map(apt => 
          apt._id === id ? { ...apt, status: newStatus as any } : apt
        );
        
        setFilteredAppointments(prev => 
          prev.map(apt => apt._id === id ? { ...apt, status: newStatus as any } : apt)
        );
        
        setSearchResults(prev => 
          prev.map(apt => apt._id === id ? { ...apt, status: newStatus as any } : apt)
        );
        
        updateMarkedDates();
        
        Alert.alert(
          'Éxito',
          `Cita marcada como ${statusLabels[newStatus as keyof typeof statusLabels]}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message || 'No se pudo actualizar el estado');
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
              const deleteResult = await deleteAppointment(appointment._id);
              
              if (deleteResult.success) {
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
                Alert.alert('Error', deleteResult.message || 'No se pudo eliminar la cita');
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
            Mascota: {item.pet.name} ({item.pet.species})
          </Text>
        )}
        {item.owner && (
          <Text style={styles.detailText}>
            Dueño: {item.owner.firstName} {item.owner.lastName}
          </Text>
        )}
        {item.veterinarian && (
          <Text style={styles.detailText}>
            Veterinario: {item.veterinarian.username}
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mis Citas</Text>
          <Text style={styles.subtitle}>
            {formatDateCR(selectedDate, { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <Text style={styles.iconButtonText}>🔍</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
          >
            <Text style={styles.iconButtonText}>
              {viewMode === 'calendar' ? '📅' : '📋'}
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

            {loading ? (
              <ActivityIndicator size="large" color="#0891b2" style={styles.loader} />
            ) : filteredAppointments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay citas para este día</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AppointmentForm' as never)}
                >
                  <Text style={styles.emptyButtonText}>+ Agendar Cita</Text>
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
          data={appointments.sort((a, b) => 
            new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
          )}
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
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.searchResultItem}
                      onPress={() => {
                        setSelectedDate(new Date(item.appointmentDate).toISOString().split('T')[0]);
                        setSearchModalVisible(false);
                        setViewMode('calendar');
                      }}
                    >
                      <Text style={styles.searchResultTitle}>{item.title}</Text>
                      <Text style={styles.searchResultSubtitle}>
                        {new Date(item.appointmentDate).toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica' })} {item.startTime} - {item.pet?.name}
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
                  )}
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
              <TouchableOpacity
                style={[styles.statusOption, { borderLeftColor: '#3b82f6' }]}
                onPress={() => handleStatusSelect('scheduled')}
              >
                <Text style={styles.statusOptionText}>Programada</Text>
                <Text style={styles.statusOptionBadge}>📅</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, { borderLeftColor: '#10b981' }]}
                onPress={() => handleStatusSelect('confirmed')}
              >
                <Text style={styles.statusOptionText}>Confirmada</Text>
                <Text style={styles.statusOptionBadge}>✅</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, { borderLeftColor: '#f59e0b' }]}
                onPress={() => handleStatusSelect('in-progress')}
              >
                <Text style={styles.statusOptionText}>En Progreso</Text>
                <Text style={styles.statusOptionBadge}>⚙️</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, { borderLeftColor: '#6b7280' }]}
                onPress={() => handleStatusSelect('completed')}
              >
                <Text style={styles.statusOptionText}>Completada</Text>
                <Text style={styles.statusOptionBadge}>✔️</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, { borderLeftColor: '#ef4444' }]}
                onPress={() => handleStatusSelect('cancelled')}
              >
                <Text style={styles.statusOptionText}>Cancelada</Text>
                <Text style={styles.statusOptionBadge}>❌</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, { borderLeftColor: '#8b5cf6' }]}
                onPress={() => handleStatusSelect('no-show')}
              >
                <Text style={styles.statusOptionText}>No Asistió</Text>
                <Text style={styles.statusOptionBadge}>🚫</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, { borderLeftColor: '#f97316', marginBottom: 20 }]}
                onPress={() => handleStatusSelect('reschedule')}
              >
                <Text style={styles.statusOptionText}>Reprogramar (eliminar y crear nueva)</Text>
                <Text style={styles.statusOptionBadge}>🔄</Text>
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
    marginTop: 4,
    textTransform: 'capitalize',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 20,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
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
    fontSize: 18,
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
    fontSize: 20,
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
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
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
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  appointmentDetails: {
    gap: 4,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  changeStatusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  changeStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rescheduleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f97316',
    flex: 1,
    alignItems: 'center',
  },
  rescheduleButtonText: {
    color: 'white',
    fontSize: 12,
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalClose: {
    fontSize: 24,
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
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchButton: {
    backgroundColor: '#0891b2',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  searchResultOwner: {
    fontSize: 13,
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
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  statusOptionBadge: {
    fontSize: 20,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});