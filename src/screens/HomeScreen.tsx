import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { isAuthenticated, user } = useAuth();
  const navigation = useNavigation();

  if (isAuthenticated) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>¡Hola, {user?.username}! 👋</Text>
          <Text style={styles.subtitle}>¿Qué deseas hacer hoy?</Text>
        </View>

        {/* SECCIÓN NUEVA: CLÍNICA VETERINARIA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏥 Clínica Veterinaria</Text>
          
          {/* Botón principal para Dashboard */}
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Dashboard' as never)}
          >
            <Text style={styles.buttonIcon}>📊</Text>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.primaryButtonText}>Dashboard de Clínica</Text>
              <Text style={styles.buttonSubtext}>Gestión completa de pacientes y citas</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>

          {/* Grid de opciones rápidas */}
          <View style={styles.grid}>
            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('Clients' as never)}
            >
              <Text style={styles.gridIcon}>🐕</Text>
              <Text style={styles.gridText}>Pacientes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('ClientForm' as never)}
            >
              <Text style={styles.gridIcon}>➕</Text>
              <Text style={styles.gridText}>Nuevo Paciente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('Appointments' as never)}
            >
              <Text style={styles.gridIcon}>📅</Text>
              <Text style={styles.gridText}>Citas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('AppointmentForm' as never)}
            >
              <Text style={styles.gridIcon}>⏰</Text>
              <Text style={styles.gridText}>Nueva Cita</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN EXISTENTE: TAREAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Sistema Actual</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tareas</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('Tasks' as never)}
            >
              <Text style={styles.buttonText}>Ver Mis Tareas</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Perfil</Text>
            <TouchableOpacity 
              style={styles.buttonSecondary}
              onPress={() => navigation.navigate('Profile' as never)}
            >
              <Text style={styles.buttonTextSecondary}>Ver Mi Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // USUARIO NO AUTENTICADO (se mantiene igual)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Veterinaria</Text>
        <Text style={styles.subtitle}>Sistema de Gestión Veterinaria</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Comienza ahora</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('Register' as never)}
        >
          <Text style={styles.buttonTextSecondary}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    marginTop: 50,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f766e',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  
  // Secciones
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  
  // Botón principal de clínica
  primaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#0891b2',
  },
  buttonIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#94a3b8',
  },
  
  // Grid de opciones
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  gridItem: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gridText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  
  // Cards existentes (tareas y perfil)
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0891b2',
  },
  buttonTextSecondary: {
    color: '#0891b2',
    fontSize: 16,
    fontWeight: '600',
  },
});