import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import TasksScreen from '../screens/Tasks/TasksScreen';
import TaskFormScreen from '../screens/Tasks/TaskFormScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';




import DashboardScreen from '../screens/Clinic/DashboardScreen';
// import ClientsScreen from '../screens/Clinic/ClientsScreen';
// import ClientFormScreen from '../screens/Clinic/ClientFormScreen';
// import AppointmentsScreen from '../screens/Clinic/AppointmentsScreen';
// import AppointmentFormScreen from '../screens/Clinic/AppointmentFormScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  const { isAuthenticated, authChecked } = useAuth();

  if (!authChecked) {
    return null; // O un loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // USUARIO AUTENTICADO
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Tasks" component={TasksScreen} />
          <Stack.Screen name="TaskForm" component={TaskFormScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />


           <Stack.Screen name="Dashboard" component={DashboardScreen} />

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

//ESTE REMPLAZA AL NAVBAR
/* Navegación principal
	Mobile usa stack navigation (pila), no navbar fijo	
  Stack.Navigator maneja transiciones entre pantallas como pila (push/pop) */