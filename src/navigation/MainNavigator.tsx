// src/navigation/MainNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// PANTALLAS PÚBLICAS (SIEMPRE ACCESIBLES)
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';

// PANTALLAS AUTENTICADAS (CLÍNICA - ADMIN)
import DashboardScreen from '../screens/Clinic/DashboardScreen';
import OwnersScreen from '../screens/Clinic/OwnersScreen';
import OwnerFormScreen from '../screens/Clinic/OwnerFormScreen';
import OwnerDetailScreen from '../screens/Clinic/OwnerDetailScreen';
import PetFormScreen from '../screens/Clinic/PetFormScreen';
import AppointmentFormScreen from '../screens/Clinic/AppointmentFormScreen';
import AppointmentsScreen from '../screens/Clinic/AppointmentsScreen';
import PatientsScreen from '../screens/Clinic/PatientsScreen';
import StaffScreen from '../screens/Clinic/StaffScreen';

// PANTALLAS AUTENTICADAS (DOCTOR)
import DoctorDashboardScreen from '../screens/Clinic/DoctorDashboardScreen';

// PANTALLAS AUTENTICADAS (RECEPCIÓN)
import ReceptionDashboardScreen from '../screens/Clinic/ReceptionDashboardScreen';

// PANTALLAS AUTENTICADAS (TAREAS EXISTENTES)
import TasksScreen from '../screens/Tasks/TasksScreen';
import TaskFormScreen from '../screens/Tasks/TaskFormScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

// Pantalla de carga
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
    <ActivityIndicator size="large" color="#0891b2" />
  </View>
);

export default function MainNavigator() {
  const { user, isAuthenticated, authChecked } = useAuth();

  // Mientras verifica autenticación, mostrar loading
  if (!authChecked) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated || !user ? (
        // USUARIO NO AUTENTICADO
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : (
        // USUARIO AUTENTICADO - REDIRECCIÓN POR ROL
        user.role === 'admin' ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Owners" component={OwnersScreen} />
            <Stack.Screen name="OwnerForm" component={OwnerFormScreen} />
            <Stack.Screen name="OwnerDetail" component={OwnerDetailScreen} />
            <Stack.Screen name="PetForm" component={PetFormScreen} />
            <Stack.Screen name="Appointments" component={AppointmentsScreen} />
            <Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} />
            <Stack.Screen name="Tasks" component={TasksScreen} />
            <Stack.Screen name="TaskForm" component={TaskFormScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Patients" component={PatientsScreen} />
            <Stack.Screen name="Staff" component={StaffScreen} />
            {/* ✅ Agregar ForgotPassword también en autenticado */}
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : user.role === 'veterinarian' ? (
          <>
            <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : user.role === 'assistant' ? (
          <>
            <Stack.Screen name="ReceptionDashboard" component={ReceptionDashboardScreen} />
            <Stack.Screen name="Owners" component={OwnersScreen} />
            <Stack.Screen name="OwnerForm" component={OwnerFormScreen} />
            <Stack.Screen name="PetForm" component={PetFormScreen} />
            <Stack.Screen name="Appointments" component={AppointmentsScreen} />
            <Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )
      )}
    </Stack.Navigator>
  );
}