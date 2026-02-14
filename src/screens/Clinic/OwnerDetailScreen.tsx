// src/screens/Clinic/OwnerDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  FlatList,
  RefreshControl 
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  OwnerDetail: { id: string };
  PetDetail: { id: string };
  PetForm: { id?: string; ownerId: string };
  OwnerForm: { id?: string };
};

type OwnerDetailScreenRouteProp = RouteProp<RootStackParamList, 'OwnerDetail'>;
type OwnerDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OwnerDetail'>;

export default function OwnerDetailScreen() {
  const navigation = useNavigation<OwnerDetailScreenNavigationProp>();
  const route = useRoute<OwnerDetailScreenRouteProp>();
  const { id } = route.params;
  
  const { fetchOwner, deletePet } = useClinic(); // ✅ AGREGAR deletePet
  const [owner, setOwner] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOwner();
  }, [id]);

  const loadOwner = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const ownerData = await fetchOwner(id);
      if (ownerData) {
        setOwner(ownerData);
        setPets(ownerData.pets || []);
      } else {
        setOwner(null);
        setPets([]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el cliente');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // ✅ HANDLE DELETE PET CORREGIDO
  const handleDeletePet = (petId: string, petName: string) => {
    Alert.alert(
      'Eliminar Mascota',
      `¿Estás seguro de eliminar a ${petName}?\n\n`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deletePet(petId);
              
              if (result.success) {
                Alert.alert(' Éxito', 'Mascota eliminada correctamente');
                // ✅ RECARGAR para actualizar la lista
                loadOwner();
              } else {
                Alert.alert('❌ Error', result.message || 'No se pudo eliminar la mascota');
              }
            } catch (error) {
              console.error('Error eliminando mascota:', error);
              Alert.alert('❌ Error', 'Ocurrió un error al eliminar la mascota');
            }
          }
        },
      ]
    );
  };

  const renderPet = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.petCard}
      onPress={() => navigation.navigate('PetDetail', { id: item._id })}
    >
      <View style={styles.petInfo}>
        <Text style={styles.petName}>
           {item.name} ({item.species})
        </Text>
        <Text style={styles.petDetails}>
          {item.breed ? `${item.breed} • ` : ''}
          {item.gender} • {item.weight ? `${item.weight} ${item.weightUnit || 'kg'}` : 'Peso no registrado'}
        </Text>
        {item.specialConditions && (
          <Text style={styles.petConditions}>
             {item.specialConditions}
          </Text>
        )}
      </View>
      <View style={styles.petActions}>
        <TouchableOpacity 
          style={styles.petEditButton}
          onPress={() => navigation.navigate('PetForm', { 
            id: item._id,
            ownerId: id 
          })}
        >
          <Text style={styles.petEditButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.petDeleteButton}
          onPress={() => handleDeletePet(item._id, item.name)}
        >
          <Text style={styles.petDeleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!owner && !loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Cliente no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={loadOwner}
          colors={['#0f766e']}
        />
      }
    >
      {/* Header con información del dueño */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {owner?.firstName} {owner?.lastName}
        </Text>
        <View style={styles.ownerActions}>
          <TouchableOpacity 
            style={styles.editOwnerButton}
            onPress={() => navigation.navigate('OwnerForm', { id })}
          >
            <Text style={styles.editOwnerButtonText}>Editar Cliente</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addPetButton}
            onPress={() => navigation.navigate('PetForm', { ownerId: id })}
          >
            <Text style={styles.addPetButtonText}>+ Agregar Mascota</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Información del dueño */}
      <View style={styles.ownerInfoSection}>
        <Text style={styles.sectionTitle}>Información del Cliente</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}> Email:</Text>
          <Text style={styles.infoValue}>{owner?.email || 'No registrado'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}> Teléfono:</Text>
          <Text style={styles.infoValue}>{owner?.phone || 'No registrado'}</Text>
        </View>
        
        {owner?.address && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}> Dirección:</Text>
            <Text style={styles.infoValue}>{owner.address}</Text>
          </View>
        )}
        
        {owner?.dni && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cédula:</Text>
            <Text style={styles.infoValue}>{owner.dni}</Text>
          </View>
        )}
      </View>

      {/* Contacto de emergencia */}
      {owner?.emergencyContact && (owner.emergencyContact.name || owner.emergencyContact.phone) && (
        <View style={styles.emergencySection}>
          <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
          
          {owner.emergencyContact.name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>👤 Nombre:</Text>
              <Text style={styles.infoValue}>{owner.emergencyContact.name}</Text>
            </View>
          )}
          
          {owner.emergencyContact.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📞 Teléfono:</Text>
              <Text style={styles.infoValue}>{owner.emergencyContact.phone}</Text>
            </View>
          )}
          
          {owner.emergencyContact.relationship && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🤝 Parentesco:</Text>
              <Text style={styles.infoValue}>{owner.emergencyContact.relationship}</Text>
            </View>
          )}
        </View>
      )}

      {/* Lista de mascotas */}
      <View style={styles.petsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Mascotas ({pets.length})
          </Text>
          <TouchableOpacity 
            style={styles.addPetSmallButton}
            onPress={() => navigation.navigate('PetForm', { ownerId: id })}
          >
            <Text style={styles.addPetSmallButtonText}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {pets.length === 0 ? (
          <View style={styles.emptyPets}>
            <Text style={styles.emptyPetsText}>
              Este cliente no tiene mascotas registradas
            </Text>
            <TouchableOpacity 
              style={styles.emptyPetsButton}
              onPress={() => navigation.navigate('PetForm', { ownerId: id })}
            >
              <Text style={styles.emptyPetsButtonText}>Agregar primera mascota</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={pets}
            renderItem={renderPet}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Notas */}
      {owner?.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <Text style={styles.notesText}>{owner.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#219eb4',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editOwnerButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  editOwnerButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  addPetButton: {
    backgroundColor: '#c7c7c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  addPetButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  ownerInfoSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emergencySection: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  petsSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  notesSection: {
    backgroundColor: '#f0f9ff',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPetSmallButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addPetSmallButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    width: 120,
  },
  infoValue: {
    fontSize: 16,
    color: '#6b7280',
    flex: 1,
  },
  petCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  petConditions: {
    fontSize: 13,
    color: '#dc2626',
    fontStyle: 'italic',
  },
  petActions: {
    flexDirection: 'row',
    gap: 8,
  },
  petEditButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  petEditButtonText: {
    color: 'white',
    fontSize: 12,
  },
  petDeleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  petDeleteButtonText: {
    color: 'white',
    fontSize: 12,
  },
  emptyPets: {
    alignItems: 'center',
    padding: 20,
  },
  emptyPetsText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyPetsButton: {
    backgroundColor: '#219eb4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyPetsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 100,
  },
});