/* Crear/editar	
HTML form → View + TextInput porque no hay tags HTML	
react-hook-form funciona igual pero con componentes RN */


import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useTasks } from '../../contexts/TasksContext';
import { useNavigation, useRoute } from '@react-navigation/native';

type FormData = {
  title: string;
  description: string;
};

export default function TaskFormScreen() {
  const { createTask, updateTask, getTask } = useTasks();
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const { control, handleSubmit, setValue, reset } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    const result = await getTask(id);
    if (result.ok && result.data) {
      setValue('title', result.data.title);
      setValue('description', result.data.description);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (id) {
        await updateTask(id, data);
        Alert.alert('Éxito', 'Tarea actualizada');
      } else {
        await createTask(data);
        Alert.alert('Éxito', 'Tarea creada');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la tarea');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {id ? 'Editar Tarea' : 'Nueva Tarea'}
      </Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="title"
          rules={{ required: 'Título es requerido' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Título de la tarea"
                value={value}
                onChangeText={onChange}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="description"
          rules={{ required: 'Descripción es requerida' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.textArea, error && styles.inputError]}
                placeholder="Descripción de la tarea"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.buttonText}>
            {id ? 'Actualizar' : 'Crear'} Tarea
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f766e',
    textAlign: 'center',
    marginVertical: 40,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
});