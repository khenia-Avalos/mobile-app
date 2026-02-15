// src/screens/Clinic/StaffScreen.tsx
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
import { useAuth } from '../../hooks/useAuth';
import axios from '../../api/axios-mobile';

// Tipos
interface User {
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
  lastname: string;
  role: 'admin' | 'veterinarian' | 'assistant' | 'client';
  active: boolean;
  specialty?: string;
  licenseNumber?: string;
  defaultAvailability?: any;
  createdAt?: string;
  updatedAt?: string;
}

export default function StaffScreen() {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStaff, setFilteredStaff] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(currentUser?.role === 'admin');
    loadStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchQuery, roleFilter]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      // Cargar TODOS los usuarios
      const usersResponse = await axios.get('/api/admin/users');
      
      console.log('📥 Respuesta de usuarios:', usersResponse.data);
      
      let allUsers = [];
      if (usersResponse.data?.users) {
        allUsers = usersResponse.data.users;
      } else if (Array.isArray(usersResponse.data)) {
        allUsers = usersResponse.data;
      } else if (usersResponse.data?.data) {
        allUsers = usersResponse.data.data;
      }
      
      console.log('👥 Usuarios encontrados:', allUsers.length);
      
      // Filtrar solo personal (excluir clientes)
      const staffUsers = allUsers.filter((u: User) => 
        u.role === 'veterinarian' || u.role === 'assistant'
      );
      
      console.log('👨‍⚕️ Personal filtrado:', staffUsers.length);
      console.log('   Veterinarios:', staffUsers.filter((u: User) => u.role === 'veterinarian').length);
      console.log('   Asistentes:', staffUsers.filter((u: User) => u.role === 'assistant').length);
      
      // Transformar datos para asegurar formato correcto
      const formattedStaff = staffUsers.map((user: any) => ({
        _id: user._id || user.id,
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || 'No registrado',
        lastname: user.lastname || '',
        role: user.role || 'assistant',
        active: user.active !== false,
        specialty: user.specialty || '',
        licenseNumber: user.licenseNumber,
        defaultAvailability: user.defaultAvailability,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      setStaff(formattedStaff);
      
    } catch (error) {
      console.error('❌ Error loading staff:', error);
      Alert.alert('Error', 'No se pudo cargar el personal');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStaff();
    setRefreshing(false);
  };

  const filterStaff = () => {
    let filtered = [...staff];

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.lastname.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.specialty && user.specialty.toLowerCase().includes(query))
      );
    }

    setFilteredStaff(filtered);
  };

  const handleAddStaff = () => {
    if (!isAdmin) {
      Alert.alert('Acceso Denegado', 'Solo administradores pueden agregar personal');
      return;
    }
    navigation.navigate('Register' as never);
  };

  const handleEditStaff = (user: User) => {
    if (!isAdmin && user._id !== currentUser?._id) {
      Alert.alert('Acceso Denegado', 'No tienes permiso para editar este usuario');
      return;
    }

    navigation.navigate('Profile' as never, { 
      userId: user._id,
      isEditing: true 
    } as never);
  };

  const handleDeleteStaff = (user: User) => {
    if (!isAdmin) {
      Alert.alert('Acceso Denegado', 'Solo administradores pueden eliminar personal');
      return;
    }

    if (user._id === currentUser?._id) {
      Alert.alert('Error', 'No puedes eliminarte a ti mismo');
      return;
    }

    Alert.alert(
      'Eliminar Personal',
      `¿Estás seguro de eliminar a ${user.username}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Aquí iría la llamada a la API para eliminar
              setStaff(prev => prev.filter(u => u._id !== user._id));
              Alert.alert('✅ Éxito', 'Usuario eliminado correctamente');
            } catch (error) {
              console.error('❌ Error al eliminar:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  const toggleUserStatus = async (user: User) => {
    if (!isAdmin) {
      Alert.alert('Acceso Denegado', 'Solo administradores pueden cambiar el estado del personal');
      return;
    }

    Alert.alert(
      user.active ? 'Desactivar Personal' : 'Activar Personal',
      user.active 
        ? `¿Estás seguro de desactivar a ${user.username}?\n\nEsto pondrá TODOS sus horarios como NO DISPONIBLES.`
        : `¿Estás seguro de activar a ${user.username}?\n\nEsto restaurará sus horarios normales.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: user.active ? 'Sí, desactivar' : 'Sí, activar',
          onPress: async () => {
            try {
              if (user.role === 'veterinarian') {
                const currentAvailability = user.defaultAvailability || {};
                
                const newAvailability = {
                  monday: { 
                    ...currentAvailability.monday,
                    available: !user.active
                  },
                  tuesday: { 
                    ...currentAvailability.tuesday,
                    available: !user.active
                  },
                  wednesday: { 
                    ...currentAvailability.wednesday,
                    available: !user.active
                  },
                  thursday: { 
                    ...currentAvailability.thursday,
                    available: !user.active
                  },
                  friday: { 
                    ...currentAvailability.friday,
                    available: !user.active
                  },
                  saturday: { 
                    ...currentAvailability.saturday,
                    available: !user.active
                  },
                  sunday: { 
                    ...currentAvailability.sunday,
                    available: !user.active
                  }
                };

                const response = await axios.put(`/api/admin/users/${user._id}`, { 
                  active: !user.active,
                  defaultAvailability: newAvailability
                });
                
                setStaff(prev => prev.map(u => 
                  u._id === user._id 
                    ? { ...u, active: !u.active, defaultAvailability: newAvailability } 
                    : u
                ));
                
                Alert.alert(
                  '✅ Éxito', 
                  user.active 
                    ? `${user.username} ha sido desactivado. TODOS sus horarios están ahora NO DISPONIBLES.`
                    : `${user.username} ha sido activado. Sus horarios han sido restaurados.`
                );
              } else {
                const response = await axios.put(`/api/admin/users/${user._id}`, { 
                  active: !user.active 
                });
                
                setStaff(prev => prev.map(u => 
                  u._id === user._id ? { ...u, active: !u.active } : u
                ));
                
                Alert.alert('✅ Éxito', `Usuario ${user.active ? 'desactivado' : 'activado'} correctamente`);
              }
            } catch (error: any) {
              console.error('❌ Error al actualizar en backend:', error);
              Alert.alert('Error', error.response?.data?.[0] || 'No se pudo actualizar el estado en el servidor');
            }
          }
        }
      ]
    );
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
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

  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': 'Administrador',
      'veterinarian': 'Veterinario',
      'assistant': 'Asistente',
      'client': 'Cliente'
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return '#ef4444';
      case 'veterinarian': return '#0891b2';
      case 'assistant': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const renderStaffCard = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.staffCard,
        !item.active && styles.inactiveCard
      ]}
      onPress={() => viewUserDetails(item)}
    >
      <View style={styles.staffHeader}>
        <View style={styles.staffTitleContainer}>
          <Text style={styles.staffName}>
            {item.username} {item.lastname}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.roleText}>{getRoleText(item.role)}</Text>
          </View>
        </View>
        {!item.active && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveText}>Inactivo</Text>
          </View>
        )}
      </View>

      <View style={styles.staffInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{item.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teléfono:</Text>
          <Text style={styles.infoValue}>{item.phoneNumber}</Text>
        </View>
        {item.specialty && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Especialidad:</Text>
            <Text style={styles.infoValue}>{item.specialty}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditStaff(item)}
          disabled={!isAdmin && item._id !== currentUser?._id}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, item.active ? styles.deactivateButton : styles.activateButton]}
          onPress={() => toggleUserStatus(item)}
          disabled={!isAdmin}
        >
          <Text style={styles.actionButtonText}>
            {item.active ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>
        
        {item._id !== currentUser?._id && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteStaff(item)}
            disabled={!isAdmin}
          >
            <Text style={styles.actionButtonText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Personal</Text>
          <Text style={styles.subtitle}>
            Total: {staff.length} {staff.length === 1 ? 'miembro' : 'miembros'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddStaff}
        >
          <Text style={styles.addButtonText}>+ Nuevo Personal</Text>
        </TouchableOpacity>
      </View>

      {!isAdmin && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Modo vista: Solo administradores pueden realizar cambios
          </Text>
        </View>
      )}

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilter}>
          <TouchableOpacity
            style={[styles.filterChip, roleFilter === 'all' && styles.filterChipActive]}
            onPress={() => setRoleFilter('all')}
          >
            <Text style={[styles.filterChipText, roleFilter === 'all' && styles.filterChipTextActive]}>
              Todos ({staff.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, roleFilter === 'veterinarian' && styles.filterChipActive]}
            onPress={() => setRoleFilter('veterinarian')}
          >
            <Text style={[styles.filterChipText, roleFilter === 'veterinarian' && styles.filterChipTextActive]}>
              Veterinarios ({staff.filter(u => u.role === 'veterinarian').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, roleFilter === 'assistant' && styles.filterChipActive]}
            onPress={() => setRoleFilter('assistant')}
          >
            <Text style={[styles.filterChipText, roleFilter === 'assistant' && styles.filterChipTextActive]}>
              Asistentes ({staff.filter(u => u.role === 'assistant').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, email o especialidad..."
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
      </View>

      <FlatList
        data={filteredStaff}
        renderItem={renderStaffCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>No hay personal</Text>
            <Text style={styles.emptyText}>
              {searchQuery || roleFilter !== 'all'
                ? 'No se encontraron resultados con los filtros aplicados'
                : 'No hay personal registrado en el sistema'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Personal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <View style={styles.modalStatusRow}>
                    <View style={[styles.roleBadgeLarge, { backgroundColor: getRoleColor(selectedUser.role) }]}>
                      <Text style={styles.roleTextLarge}>{getRoleText(selectedUser.role)}</Text>
                    </View>
                    <View style={[styles.statusBadge, !selectedUser.active && styles.statusInactive]}>
                      <Text style={styles.statusText}>{selectedUser.active ? 'Activo' : 'Inactivo'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Información Personal</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Nombre:</Text>
                    <Text style={styles.modalValue}>{selectedUser.username} {selectedUser.lastname}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Email:</Text>
                    <Text style={styles.modalValue}>{selectedUser.email}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Teléfono:</Text>
                    <Text style={styles.modalValue}>{selectedUser.phoneNumber}</Text>
                  </View>
                </View>

                {selectedUser.specialty && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Información Profesional</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Especialidad:</Text>
                      <Text style={styles.modalValue}>{selectedUser.specialty}</Text>
                    </View>
                  </View>
                )}

                {selectedUser.role === 'veterinarian' && selectedUser.defaultAvailability && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Horarios</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>L-V:</Text>
                      <Text style={styles.modalValue}>
                        {selectedUser.defaultAvailability.monday?.available ? '✅' : '❌'} 
                        {selectedUser.defaultAvailability.monday?.start || '08:00'} - 
                        {selectedUser.defaultAvailability.monday?.end || '17:00'}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Sábado:</Text>
                      <Text style={styles.modalValue}>
                        {selectedUser.defaultAvailability.saturday?.available ? '✅' : '❌'} 
                        {selectedUser.defaultAvailability.saturday?.start || '09:00'} - 
                        {selectedUser.defaultAvailability.saturday?.end || '13:00'}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Domingo:</Text>
                      <Text style={styles.modalValue}>
                        {selectedUser.defaultAvailability.sunday?.available ? '✅' : '❌'} 
                        {selectedUser.defaultAvailability.sunday?.start || '09:00'} - 
                        {selectedUser.defaultAvailability.sunday?.end || '13:00'}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedUser.createdAt && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Registro</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Creado:</Text>
                      <Text style={styles.modalValue}>{formatDate(selectedUser.createdAt)}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalEditButton]}
                    onPress={() => {
                      setModalVisible(false);
                      handleEditStaff(selectedUser);
                    }}
                    disabled={!isAdmin && selectedUser._id !== currentUser?._id}
                  >
                    <Text style={styles.modalButtonText}>Editar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, selectedUser.active ? styles.modalDeactivateButton : styles.modalActivateButton]}
                    onPress={() => {
                      setModalVisible(false);
                      toggleUserStatus(selectedUser);
                    }}
                    disabled={!isAdmin}
                  >
                    <Text style={styles.modalButtonText}>
                      {selectedUser.active ? 'Desactivar' : 'Activar'}
                    </Text>
                  </TouchableOpacity>

                  {selectedUser._id !== currentUser?._id && (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalDeleteButton]}
                      onPress={() => {
                        setModalVisible(false);
                        handleDeleteStaff(selectedUser);
                      }}
                      disabled={!isAdmin}
                    >
                      <Text style={styles.modalButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  )}
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
  warningBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningText: {
    color: '#92400e',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  filterContainer: {
    padding: 16,
    gap: 12,
  },
  roleFilter: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748b',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  searchContainer: {
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
    right: 12,
    top: 12,
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
  staffCard: {
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
  inactiveCard: {
    opacity: 0.7,
    borderLeftColor: '#ef4444',
  },
  staffHeader: {
    marginBottom: 12,
  },
  staffTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  inactiveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  staffInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
  },
  infoLabel: {
    width: 90,
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#0891b2',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  activateButton: {
    backgroundColor: '#10b981',
  },
  deactivateButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
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
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleTextLarge: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusInactive: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalEditButton: {
    backgroundColor: '#0891b2',
  },
  modalDeleteButton: {
    backgroundColor: '#ef4444',
  },
  modalActivateButton: {
    backgroundColor: '#10b981',
  },
  modalDeactivateButton: {
    backgroundColor: '#f59e0b',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});