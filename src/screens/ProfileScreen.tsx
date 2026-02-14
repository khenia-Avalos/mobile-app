import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, logout, updateUserProfile } = useAuth();
  const navigation = useNavigation();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    lastname: '',
    email: '',
    phoneNumber: '',
    specialty: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        lastname: user.lastname || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        specialty: user.specialty || '',
      });
    }
  }, [user]);

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
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!formData.lastname.trim()) {
      Alert.alert('Error', 'El apellido es requerido');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'El email es requerido');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'El teléfono es requerido');
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserProfile(formData);
      
      if (result.ok) {
        Alert.alert(
          'Éxito',
          'Perfil actualizado correctamente',
          [{ text: 'OK' }]
        );
        setIsEditing(false);
      } else {
        Alert.alert(
          'Error',
          'No se pudo actualizar el perfil',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      lastname: user?.lastname || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      specialty: user?.specialty || '',
    });
    setIsEditing(false);
  };

  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      'admin': 'Administrador',
      'veterinarian': 'Veterinario',
      'assistant': 'Asistente',
      'client': 'Cliente'
    };
    return roles[role] || role;
  };

  const getInitials = () => {
    const first = user?.username?.charAt(0) || '';
    const last = user?.lastname?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container}>
        {/* Header con avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.userName}>
            {user?.username} {user?.lastname}
          </Text>
        
        </View>

        {/* Tarjeta de información */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {isEditing ? 'Editar Perfil' : 'Información Personal'}
            </Text>
            {!isEditing && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editButtonText}> Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            // MODO EDICIÓN
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(text) => setFormData({...formData, username: text})}
                  placeholder="Tu nombre"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastname}
                  onChangeText={(text) => setFormData({...formData, lastname: text})}
                  placeholder="Tu apellido"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
                  placeholder="+50670983832"
                  keyboardType="phone-pad"
                />
              </View>

              {user?.role === 'veterinarian' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Especialidad</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.specialty}
                    onChangeText={(text) => setFormData({...formData, specialty: text})}
                    placeholder="Medicina General, Cirugía, etc."
                  />
                </View>
              )}

              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveButton, loading && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // MODO VISUALIZACIÓN
            <View>
              <View style={styles.infoRow}>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombre completo</Text>
                  <Text style={styles.infoValue}>
                    {user?.username} {user?.lastname}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Correo electrónico</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{user?.phoneNumber || 'No registrado'}</Text>
                </View>
              </View>

              {user?.role === 'veterinarian' && (
                <View style={styles.infoRow}>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Especialidad</Text>
                    <Text style={styles.infoValue}>{user?.specialty || 'Medicina General'}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Configuración */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configuración</Text>
          
      <TouchableOpacity 
    style={styles.menuItem}
    onPress={() => navigation.navigate('ForgotPassword' as never)}
  >
    <View style={styles.menuItemLeft}>
      <Text style={styles.menuItemText}>Cambiar contraseña</Text>
    </View>
    <Text style={styles.menuItemArrow}>›</Text>
  </TouchableOpacity>
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#219eb4',
    padding: 32,
    paddingTop: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#a2b6aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roleAdmin: {
    backgroundColor: '#8b5cf6',
  },
  roleVet: {
    backgroundColor: '#0891b2',
  },
  roleAssistant: {
    backgroundColor: '#6b7280',
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
  },
  editButtonText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  form: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#219eb4',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#0f172a',
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#94a3b8',
  },
  logoutButton: {
    backgroundColor: '#bbbaba',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});