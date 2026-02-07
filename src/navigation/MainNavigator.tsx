// src/navigation/MainNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';

// PANTALLAS PÚBLICAS
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';

// PANTALLAS AUTENTICADAS (CLÍNICA)
import DashboardScreen from '../screens/Clinic/DashboardScreen';
import OwnersScreen from '../screens/Clinic/OwnersScreen';
import OwnerFormScreen from '../screens/Clinic/OwnerFormScreen';
import AppointmentFormScreen from '../screens/Clinic/AppointmentFormScreen';

// PANTALLAS AUTENTICADAS (TAREAS EXISTENTES)
import TasksScreen from '../screens/Tasks/TasksScreen';
import TaskFormScreen from '../screens/Tasks/TaskFormScreen';
import ProfileScreen from '../screens/ProfileScreen';

// TEMPORAL: Pantallas que aún no existen (comentadas)
// import PetFormScreen from '../screens/Clinic/PetFormScreen';
// import AppointmentsScreen from '../screens/Clinic/AppointmentsScreen';
// import CalendarScreen from '../screens/Clinic/CalendarScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  const { isAuthenticated, authChecked } = useAuth();

  if (!authChecked) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // USUARIO AUTENTICADO
        <>
          {/* PANEL DE CONTROL */}
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          
          {/* CLIENTES */}
          <Stack.Screen name="Owners" component={OwnersScreen} />
          <Stack.Screen name="OwnerForm" component={OwnerFormScreen} />
          
          {/* CITAS */}
          <Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} />
          
          {/* TEMPORAL: Comentar estas líneas hasta crear las pantallas */}
          {/* <Stack.Screen name="Appointments" component={AppointmentsScreen} /> */}
          {/* <Stack.Screen name="Calendar" component={CalendarScreen} /> */}
          {/* <Stack.Screen name="PetForm" component={PetFormScreen} /> */}
          
          {/* TAREAS EXISTENTES */}
          <Stack.Screen name="Tasks" component={TasksScreen} />
          <Stack.Screen name="TaskForm" component={TaskFormScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        // USUARIO NO AUTENTICADO
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}