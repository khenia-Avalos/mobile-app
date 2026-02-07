// src/screens/Clinic/OwnersScreen.tsx
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useClinic } from '../../contexts/ClinicContext';

export default function OwnersScreen() {
  const navigation = useNavigation();
  const { 
    owners, 
    fetchOwners, 
    deleteOwner,
    loading 
  } = useClinic();

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleDelete = (ownerId: string, ownerName: string) => {
    Alert.alert(
      'Eliminar Cliente',
      `¿Eliminar a ${ownerName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await deleteOwner(ownerId);
            fetchOwners();
          }
        },
      ]
    );
  };

  const renderOwner = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.ownerCard}
      onPress={() => navigation.navigate('OwnerDetail', { id: item._id } as never)}
    >
      <View style={styles.ownerInfo}>
        <Text style={styles.ownerName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.ownerContact}>
          📞 {item.phone} • 📧 {item.email}
        </Text>
        <Text style={styles.ownerPets}>
          🐾 {item.petCount || 0} mascotas
        </Text>
      </View>
      <View style={styles.ownerActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('OwnerForm', { id: item._id } as never)}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(item._id, `${item.firstName} ${item.lastName}`)}
        >
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('OwnerForm' as never)}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={owners}
        renderItem={renderOwner}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={fetchOwners}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay clientes registrados</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('OwnerForm' as never)}
            >
              <Text style={styles.emptyButtonText}>Agregar primer cliente</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  ownerCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  ownerContact: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  ownerPets: {
    fontSize: 12,
    color: '#94a3b8',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});