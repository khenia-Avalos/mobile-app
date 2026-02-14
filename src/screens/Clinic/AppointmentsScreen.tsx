// mobile-app/src/screens/Clinic/AppointmentsScreen.tsx
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
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, DateData } from 'react-native-calendars';
import axios from '../../api/axios-mobile';

// Tipos
interface Appointment {
  _id: string;
  title: string;
  description?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
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
  'no-show': '#8b5cf6'
};

const statusLabels = {
  'scheduled': 'Programada',
  'confirmed': 'Confirmada',
  'in-progress': 'En Progreso',
  'completed': 'Completada',
  'cancelled': 'Cancelada',
  'no-show': 'No Asistió'
};

export default function AppointmentsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { appointments, fetchAppointments, loading } = useClinic();
  
  // Estados
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

  // Cargar citas iniciales
  useEffect(() => {
    loadAppointments();
  }, []);

  // Filtrar citas cuando cambia la fecha o las citas
  useEffect(() => {
    if (appointments.length > 0) {
      filterAppointmentsByDate(selectedDate);
      updateMarkedDates();
    }
  }, [appointments, selectedDate]);

  const loadAppointments = async () => {
    await fetchAppointments({ showPast: 'true' });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  // Filtrar citas por fecha
  const filterAppointmentsByDate = (date: string) => {
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
      return aptDate === date;
    });
    
    // Ordenar por hora
    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setFilteredAppointments(filtered);
  };

  // Actualizar marcadores del calendario
  const updateMarkedDates = () => {
    const marks: any = {};
    
    appointments.forEach(apt => {
      const date = new Date(apt.appointmentDate).toISOString().split('T')[0];
      
      if (!marks[date]) {
        marks[date] = {
          marked: true,
          dotColor: getStatusColor(apt.status),
          selected: date === selectedDate
        };
      } else if (date === selectedDate) {
        marks[date].selected = true;
      }
    });
    
    // Asegurar que la fecha seleccionada esté marcada
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

  // Manejar cambio de fecha en calendario
  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
    filterAppointmentsByDate(day.dateString);
  };

  // Buscar citas por nombre de cliente o mascota
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Ingresa un término de búsqueda');
      return;
    }

    setSearchLoading(true);
    try {
      // Buscar en citas locales primero
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

  // Obtener color según estado
  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || '#6b7280';
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Ver detalles de cita
  const viewAppointmentDetails = (appointment: Appointment) => {
    Alert.alert(
      'Detalle de Cita',
      `${appointment.title}\n\n` +
      `📅 ${new Date(appointment.appointmentDate).toLocaleDateString('es-ES')}\n` +
      `⏰ ${appointment.startTime} - ${appointment.endTime}\n` +
      `🐕 ${appointment.pet?.name || 'Sin mascota'} (${appointment.pet?.species || '?'})\n` +
      `👤 ${appointment.owner?.firstName || ''} ${appointment.owner?.lastName || ''}\n` +
      `👨‍⚕️ ${appointment.veterinarian?.username || ''}\n` +
      `📝 ${appointment.description || 'Sin descripción'}`,
      [
        { text: 'Cerrar' },
        { 
          text: 'Cambiar Estado',
          onPress: () => showStatusOptions(appointment)
        }
      ]
    );
  };

  // Mostrar opciones de estado
  const showStatusOptions = (appointment: Appointment) => {
    const options = [
      { label: 'Confirmada', value: 'confirmed' },
      { label: 'En Progreso', value: 'in-progress' },
      { label: 'Completada', value: 'completed' },
      { label: 'Cancelada', value: 'cancelled' },
      { label: 'No Asistió', value: 'no-show' }
    ];

    Alert.alert(
      'Cambiar Estado',
      'Selecciona el nuevo estado:',
      [
        ...options.map(opt => ({
          text: opt.label,
          onPress: () => updateAppointmentStatus(appointment._id, opt.value)
        })),
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  // Actualizar estado (simulado - necesitarías implementar en contexto)
  const updateAppointmentStatus = async (id: string, status: string) => {
    Alert.alert('Éxito', `Cita marcada como ${statusLabels[status as keyof typeof statusLabels]}`);
    // Aquí iría la llamada real a la API
  };

  // Renderizar tarjeta de cita
  const renderAppointmentCard = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => viewAppointmentDetails(item)}
    >
      <View style={styles.appointmentHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
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
            🐕 {item.pet.name} ({item.pet.species})
          </Text>
        )}
        {item.owner && (
          <Text style={styles.detailText}>
            👤 {item.owner.firstName} {item.owner.lastName}
          </Text>
        )}
        {item.veterinarian && (
          <Text style={styles.detailText}>
            👨‍⚕️ {item.veterinarian.username}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Citas</Text>
          <Text style={styles.subtitle}>
            {formatDate(selectedDate)}
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
        // VISTA CALENDARIO
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

          {/* Citas del día seleccionado */}
          <View style={styles.appointmentsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Citas del {new Date(selectedDate).toLocaleDateString('es-ES', { 
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
        // VISTA LISTA (TODAS LAS CITAS)
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
            <Text style={styles.listHeader}>Todas las Citas</Text>
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
                        {new Date(item.appointmentDate).toLocaleDateString()} {item.startTime} - {item.pet?.name}
                      </Text>
                      <Text style={styles.searchResultOwner}>
                        {item.owner?.firstName} {item.owner?.lastName}
                      </Text>
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
    borderLeftColor: '#0891b2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
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
    maxHeight: '90%',
    minHeight: '50%',
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
  },
});