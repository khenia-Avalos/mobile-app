// mobile-app/App.tsx - VERSIÓN ESTABLE
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/hooks/useAuth';
import { TaskProvider } from './src/contexts/TasksContext';
import { ClinicProvider } from './src/contexts/ClinicContext';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <ClinicProvider>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </ClinicProvider>
      </TaskProvider>
    </AuthProvider>
  );
}