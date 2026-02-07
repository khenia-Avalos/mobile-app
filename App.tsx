import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './src/contexts/authContext';
import { TaskProvider } from './src/contexts/TasksContext';
import MainNavigator from './src/navigation/MainNavigator';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </TaskProvider>
    </AuthProvider>
  );
}
//LOS CAMBIOS FUERON Web: BrowserRouter, Mobile: NavigationContainer
// React Native no usa navegador, necesita contenedor propio
//NavigationContainer crea contexto de navegación que mantiene estado de rutas