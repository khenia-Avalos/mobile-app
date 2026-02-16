// mobile-app/src/screens/Clinic/OwnersScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  TextInput
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOwners, setFilteredOwners] = useState<any[]>([]);

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    filterOwners();
  }, [owners, searchQuery]);

  const filterOwners = () => {
    if (!searchQuery.trim()) {
      setFilteredOwners(owners);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = owners.filter(owner => {
      const fullName = `${owner.firstName} ${owner.lastName}`.toLowerCase();
      const email = owner.email?.toLowerCase() || '';
      const phone = owner.phone?.toLowerCase() || '';
      
      return fullName.includes(query) || 
             email.includes(query) || 
             phone.includes(query);
    });
    
    setFilteredOwners(filtered);
  };

  const handleDelete = (ownerId: string, ownerName: string) => {
    Alert.alert(
      'Eliminar Cliente',
      `¿Estás seguro de eliminar a ${ownerName}?\n\n`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteOwner(ownerId);
              
              if (result.success) {
                Alert.alert(' Éxito', 'Cliente eliminado correctamente');
              } else {
                if (result.message.includes('mascotas activas')) {
                  Alert.alert(
                    'No se puede eliminar', 
                    'Este cliente tiene mascotas activas. Debes archivar o transferir las mascotas primero.'
                  );
                } else {
                  Alert.alert(' Error', result.message);
                }
              }
            } catch (error) {
              console.error('Error eliminando cliente:', error);
              Alert.alert(' Error', 'Ocurrió un error al eliminar el cliente');
            }
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
           {item.phone || 'Sin teléfono'} •  {item.email || 'Sin email'}
        </Text>
        <Text style={styles.ownerPets}>
           {item.petCount || 0} {item.petCount === 1 ? 'mascota' : 'mascotas'}
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
      
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder=" Buscar por nombre, email o teléfono..."
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

      <FlatList
        data={filteredOwners}
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
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No se encontraron resultados' : 'No hay clientes registrados'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Prueba con otro término de búsqueda' 
                : 'Agrega tu primer cliente desde el botón "+ Nuevo"'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchButtonText}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('OwnerForm' as never)}
              >
                <Text style={styles.emptyButtonText}>Agregar primer cliente</Text>
              </TouchableOpacity>
            )}
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
    backgroundColor: '#219eb4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: '#a5b2a9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
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
    fontSize: 13,
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
    backgroundColor: '#0891b2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
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
  clearSearchButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearSearchButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
});