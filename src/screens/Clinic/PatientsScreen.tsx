// src/screens/Clinic/PatientsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { useAuth } from '../../hooks/useAuth';

// Tipos
interface Pet {
  _id: string;
  name: string;
  species: string;
  breed?: string;
  color?: string;
  gender?: string;
  birthDate?: string;
  weight?: number;
  weightUnit?: string;
  chipNumber?: string;
  allergies?: string[];
  medications?: string[];
  specialConditions?: string;
  notes?: string;
  sterilized?: boolean;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function PatientsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { pets, owners, fetchPets, fetchOwners, deletePet, loading } = useClinic();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPets();
  }, [pets, searchQuery]);

  const loadData = async () => {
    await Promise.all([
      fetchPets(),
      fetchOwners()
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterPets = () => {
    if (!searchQuery.trim()) {
      setFilteredPets(pets);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = pets.filter(pet => {
      const ownerName = pet.owner ? 
        `${pet.owner.firstName} ${pet.owner.lastName}`.toLowerCase() : '';
      return pet.name.toLowerCase().includes(query) || 
             ownerName.includes(query) ||
             (pet.breed && pet.breed.toLowerCase().includes(query)) ||
             (pet.species && pet.species.toLowerCase().includes(query));
    });
    setFilteredPets(filtered);
  };

  const handleAddPet = () => {
    Alert.alert(
      'Agregar Paciente',
      'Primero debes seleccionar un cliente de la lista de clientes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Ir a Clientes',
          onPress: () => navigation.navigate('Owners' as never)
        }
      ]
    );
  };

  const handleEditPet = (pet: Pet) => {
    navigation.navigate('PetForm' as never, { 
      id: pet._id,
      ownerId: pet.owner._id 
    } as never);
  };

  const handleDeletePet = (pet: Pet) => {
    Alert.alert(
      'Eliminar Paciente',
      `¿Estás seguro de eliminar a ${pet.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deletePet(pet._id);
              if (result.success) {
                Alert.alert('Éxito', 'Paciente eliminado correctamente');
              } else {
                Alert.alert('Error', result.message || 'No se pudo eliminar el paciente');
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error al eliminar');
            }
          }
        }
      ]
    );
  };

  const viewPetDetails = (pet: Pet) => {
    setSelectedPet(pet);
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

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'Desconocida';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} años` : `${today.getMonth() - birth.getMonth()} meses`;
  };

  const getGenderText = (gender?: string) => {
    switch(gender?.toLowerCase()) {
      case 'macho': return 'Macho';
      case 'hembra': return 'Hembra';
      case 'masculino': return 'Masculino';
      case 'femenino': return 'Femenino';
      default: return 'No especificado';
    }
  };

  const renderPetCard = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => viewPetDetails(item)}
    >
      <View style={styles.petHeader}>
        <View style={styles.petTitleContainer}>
          <Text style={styles.petName}>
            {item.name}
          </Text>
          <View style={[styles.speciesBadge, { 
            backgroundColor: item.species === 'Perro' ? '#0891b2' : 
                           item.species === 'Gato' ? '#8b5cf6' : '#6b7280' 
          }]}>
            <Text style={styles.speciesText}>{item.species}</Text>
          </View>
        </View>
        <Text style={styles.petBreed}>{item.breed || 'Sin raza'}</Text>
      </View>

      <View style={styles.ownerInfo}>
        <Text style={styles.ownerLabel}>Dueño:</Text>
        <View style={styles.ownerDetails}>
          <Text style={styles.ownerName}>
            {item.owner?.firstName} {item.owner?.lastName}
          </Text>
          {item.owner?.phone && (
            <Text style={styles.ownerPhone}>{item.owner.phone}</Text>
          )}
        </View>
      </View>

      <View style={styles.petDetails}>
        {item.gender && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sexo:</Text>
            <Text style={styles.detailValue}>{getGenderText(item.gender)}</Text>
          </View>
        )}
        {item.color && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Color:</Text>
            <Text style={styles.detailValue}>{item.color}</Text>
          </View>
        )}
        {item.birthDate && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Edad:</Text>
            <Text style={styles.detailValue}>{calculateAge(item.birthDate)}</Text>
          </View>
        )}
        {item.weight && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Peso:</Text>
            <Text style={styles.detailValue}>{item.weight} {item.weightUnit || 'kg'}</Text>
          </View>
        )}
      </View>

      {item.chipNumber && (
        <View style={styles.chipContainer}>
          <Text style={styles.chipLabel}>Microchip:</Text>
          <Text style={styles.chipValue}>{item.chipNumber}</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditPet(item)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePet(item)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pacientes</Text>
          <Text style={styles.subtitle}>
            Total: {pets.length} {pets.length === 1 ? 'mascota' : 'mascotas'}
          </Text>
        </View>
      
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, dueño o raza..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        {searchQuery !== '' && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de pacientes */}
      <FlatList
        data={filteredPets}
        renderItem={renderPetCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🐕</Text>
            <Text style={styles.emptyTitle}>No hay pacientes</Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'No se encontraron pacientes con esa búsqueda'
                : 'Agrega tu primer paciente desde el botón "+ Nuevo Paciente"'}
            </Text>
          </View>
        }
      />

      {/* Modal de detalles */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Paciente</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedPet && (
              <ScrollView style={styles.modalBody}>
                {/* Información básica */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Información Básica</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Nombre:</Text>
                    <Text style={styles.modalValue}>{selectedPet.name}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Especie:</Text>
                    <Text style={styles.modalValue}>{selectedPet.species}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Raza:</Text>
                    <Text style={styles.modalValue}>{selectedPet.breed || 'No especificada'}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Color:</Text>
                    <Text style={styles.modalValue}>{selectedPet.color || 'No especificado'}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Sexo:</Text>
                    <Text style={styles.modalValue}>{getGenderText(selectedPet.gender)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Fecha nac.:</Text>
                    <Text style={styles.modalValue}>{formatDate(selectedPet.birthDate)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Edad:</Text>
                    <Text style={styles.modalValue}>{calculateAge(selectedPet.birthDate)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Peso:</Text>
                    <Text style={styles.modalValue}>
                      {selectedPet.weight ? `${selectedPet.weight} ${selectedPet.weightUnit || 'kg'}` : 'No registrado'}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Esterilizado:</Text>
                    <Text style={styles.modalValue}>{selectedPet.sterilized ? 'Sí' : 'No'}</Text>
                  </View>
                  {selectedPet.chipNumber && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Microchip:</Text>
                      <Text style={styles.modalValue}>{selectedPet.chipNumber}</Text>
                    </View>
                  )}
                </View>

                {/* Dueño */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Dueño</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Nombre:</Text>
                    <Text style={styles.modalValue}>
                      {selectedPet.owner?.firstName} {selectedPet.owner?.lastName}
                    </Text>
                  </View>
                  {selectedPet.owner?.phone && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Teléfono:</Text>
                      <Text style={styles.modalValue}>{selectedPet.owner.phone}</Text>
                    </View>
                  )}
                  {selectedPet.owner?.email && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Email:</Text>
                      <Text style={styles.modalValue}>{selectedPet.owner.email}</Text>
                    </View>
                  )}
                </View>

                {/* Alergias */}
                {selectedPet.allergies && selectedPet.allergies.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Alergias</Text>
                    {selectedPet.allergies.map((allergy, index) => (
                      <Text key={index} style={styles.modalListItem}>• {allergy}</Text>
                    ))}
                  </View>
                )}

                {/* Medicamentos */}
                {selectedPet.medications && selectedPet.medications.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Medicamentos</Text>
                    {selectedPet.medications.map((med, index) => (
                      <Text key={index} style={styles.modalListItem}>• {med}</Text>
                    ))}
                  </View>
                )}

                {/* Condiciones especiales */}
                {selectedPet.specialConditions && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Condiciones especiales</Text>
                    <Text style={styles.modalText}>{selectedPet.specialConditions}</Text>
                  </View>
                )}

                {/* Notas */}
                {selectedPet.notes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Notas</Text>
                    <Text style={styles.modalText}>{selectedPet.notes}</Text>
                  </View>
                )}

                {/* Fechas */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Registro</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Creado:</Text>
                    <Text style={styles.modalValue}>{formatDate(selectedPet.createdAt)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Actualizado:</Text>
                    <Text style={styles.modalValue}>{formatDate(selectedPet.updatedAt)}</Text>
                  </View>
                </View>

                {/* Botones de acción */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalEditButton]}
                    onPress={() => {
                      setModalVisible(false);
                      handleEditPet(selectedPet);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalDeleteButton]}
                    onPress={() => {
                      setModalVisible(false);
                      handleDeletePet(selectedPet);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    backgroundColor: '#219eb4',
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
  },
  addButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  searchContainer: {
    padding: 16,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  clearButton: {
    position: 'absolute',
    right: 28,
    top: 28,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  petCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#0891b2',
  },
  petHeader: {
    marginBottom: 12,
  },
  petTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  speciesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speciesText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  petBreed: {
    fontSize: 14,
    color: '#64748b',
  },
  ownerInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ownerLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  ownerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  ownerPhone: {
    fontSize: 14,
    color: '#0891b2',
  },
  petDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  chipLabel: {
    fontSize: 12,
    color: '#0369a1',
    marginRight: 8,
  },
  chipValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#0891b2',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
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
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  modalLabel: {
    width: 100,
    fontSize: 14,
    color: '#64748b',
  },
  modalValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  modalListItem: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
    marginLeft: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalEditButton: {
    backgroundColor: '#0891b2',
  },
  modalDeleteButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});