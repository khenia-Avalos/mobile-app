// src/screens/Clinic/ClientsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';

// Tipos
interface Owner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  pets?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export default function ClientsScreen() {
  const navigation = useNavigation();
  const { owners, fetchOwners, deleteOwner } = useClinic();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Owner[]>([]);
  const [selectedClient, setSelectedClient] = useState<Owner | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [owners, searchQuery]);

  const loadClients = async () => {
    await fetchOwners();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(owners);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = owners.filter(client => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const email = client.email?.toLowerCase() || '';
      const phone = client.phone?.toLowerCase() || '';
      
      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
    
    setFilteredClients(filtered);
  };

  const handleAddClient = () => {
    navigation.navigate('OwnerForm' as never);
  };

  const handleEditClient = (client: Owner) => {
    navigation.navigate('OwnerForm' as never, { id: client._id } as never);
  };

  const handleDeleteClient = (client: Owner) => {
    Alert.alert(
      'Eliminar Cliente',
      `¿Estás seguro de eliminar a ${client.firstName} ${client.lastName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteOwner(client._id);
              if (result.success) {
                Alert.alert('Éxito', 'Cliente eliminado correctamente');
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error al eliminar');
            }
          }
        }
      ]
    );
  };

  const viewClientDetails = (client: Owner) => {
    setSelectedClient(client);
    setModalVisible(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No registrada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderClientCard = ({ item }: { item: Owner }) => (
    <TouchableOpacity style={styles.card} onPress={() => viewClientDetails(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.firstName} {item.lastName}</Text>
        <View style={styles.petBadge}>
          <Text style={styles.petBadgeText}>{item.pets?.length || 0} mascotas</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.cardText}>📧 {item.email || 'Sin email'}</Text>
        <Text style={styles.cardText}>📱 {item.phone || 'Sin teléfono'}</Text>
        {item.address && <Text style={styles.cardText}>📍 {item.address}</Text>}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEditClient(item)}>
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteClient(item)}>
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Clientes</Text>
            <Text style={styles.headerSubtitle}>Total: {owners.length} clientes</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddClient}>
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* BUSCADOR - AHORA SÍ VISIBLE */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, email o teléfono..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* LISTA */}
        <FlatList
          data={filteredClients}
          renderItem={renderClientCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0891b2']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No hay clientes</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron resultados' : 'Agrega tu primer cliente'}
              </Text>
            </View>
          }
        />

        {/* MODAL */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalles del Cliente</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {selectedClient && (
                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Información Personal</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Nombre:</Text>
                      <Text style={styles.modalValue}>{selectedClient.firstName} {selectedClient.lastName}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Email:</Text>
                      <Text style={styles.modalValue}>{selectedClient.email || 'No registrado'}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Teléfono:</Text>
                      <Text style={styles.modalValue}>{selectedClient.phone || 'No registrado'}</Text>
                    </View>
                    {selectedClient.address && (
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Dirección:</Text>
                        <Text style={styles.modalValue}>{selectedClient.address}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Mascotas ({selectedClient.pets?.length || 0})</Text>
                    {selectedClient.pets && selectedClient.pets.length > 0 ? (
                      selectedClient.pets.map((pet: any, index: number) => (
                        <View key={index} style={styles.petItem}>
                          <Text style={styles.petName}>• {pet.name}</Text>
                          <Text style={styles.petDetails}>{pet.species} {pet.breed ? `- ${pet.breed}` : ''}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.modalText}>No tiene mascotas registradas</Text>
                    )}
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalEditButton} onPress={() => {
                      setModalVisible(false);
                      handleEditClient(selectedClient);
                    }}>
                      <Text style={styles.modalButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalDeleteButton} onPress={() => {
                      setModalVisible(false);
                      handleDeleteClient(selectedClient);
                    }}>
                      <Text style={styles.modalButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#0f766e',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d1fae5',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#0e5f5a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    paddingRight: 45,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0891b2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  petBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  petBadgeText: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: 12,
    gap: 6,
  },
  cardText: {
    fontSize: 14,
    color: '#4b5563',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  editButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 22,
    color: '#6b7280',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  modalLabel: {
    width: 80,
    fontSize: 14,
    color: '#6b7280',
  },
  modalValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  petItem: {
    marginBottom: 6,
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  petDetails: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalEditButton: {
    flex: 1,
    backgroundColor: '#0891b2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});