	// Inicio
  // se cambio porque	Tailwind → StyleSheet porque RN no soporta CSS	
  // StyleSheet.create() crea objetos de estilo que RN renderiza nativamente


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
          <Text style={styles.title}>¡Hola, {user?.username}!</Text>
          <Text style={styles.subtitle}>Tu panel de gestión está listo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Ir a mi Agenda</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Tasks' as never)}
          >
            <Text style={styles.buttonText}>Ver Tareas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Perfil</Text>
          <TouchableOpacity 
            style={styles.buttonSecondary}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Text style={styles.buttonTextSecondary}>Ver Perfil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Veterinaria</Text>
        <Text style={styles.subtitle}>Gestiona tu agenda y clientes</Text>
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
    marginBottom: 40,
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
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
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