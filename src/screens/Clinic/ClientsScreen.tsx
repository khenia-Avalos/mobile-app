// src/screens/Clinic/ClientsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ClientsScreen() {
  const navigation = useNavigation();
  
  // Datos de ejemplo - luego los reemplazarás con datos reales
  const exampleClients = [
    { id: '1', petName: 'Firulais', ownerName: 'Juan Pérez', species: 'Perro' },
    { id: '2', petName: 'Mishi', ownerName: 'Ana Gómez', species: 'Gato' },
  ];

  const renderClient = ({ item }: any) => (
    <TouchableOpacity style={styles.clientCard}>
      <Text style={styles.petName}>{item.petName}</Text>
      <Text style={styles.ownerName}>Dueño: {item.ownerName}</Text>
      <Text style={styles.species}>Especie: {item.species}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pacientes</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('ClientForm' as never)}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={exampleClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay pacientes registrados</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  addButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  clientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  ownerName: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  species: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
    fontSize: 16,
  },
});