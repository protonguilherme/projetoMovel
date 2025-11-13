// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Telas de Autenticação
import LoginScreen from './frontend/screens/LoginScreen';
import RegisterScreen from './frontend/screens/RegisterScreen';
import ForgotPasswordScreen from './frontend/screens/ForgotPasswordScreen';

// Telas Principais
import HomeScreen from './frontend/screens/HomeScreen';

// Telas de Clientes
import ClientsScreen from './frontend/screens/ClientsScreen';
import ClientDetailsScreen from './frontend/screens/ClientDetailsScreen';
import AddClientScreen from './frontend/screens/AddClientScreen';
import EditClientScreen from './frontend/screens/EditClientScreen';

// Telas de Ordens de Serviço
import ServiceOrdersScreen from './frontend/screens/ServiceOrdersScreen';
import ServiceOrderDetailsScreen from './frontend/screens/ServiceOrderDetailsScreen';
import AddServiceOrderScreen from './frontend/screens/AddServiceOrderScreen';
import EditServiceOrderScreen from './frontend/screens/EditServiceOrderScreen';

// Telas de Agendamentos
import ScheduleScreen from './frontend/screens/ScheduleScreen';
import ScheduleDetailsScreen from './frontend/screens/ScheduleDetailsScreen';
import AddScheduleScreen from './frontend/screens/AddScheduleScreen';

// Telas de Estoque - ✅ CORRIGIDO: Nome consistente
import StockScreen from './frontend/screens/StockScreen';

// Tela de Perfil
import ProfileScreen from './frontend/screens/ProfileScreen';

// ✅ DEFINIÇÃO DOS TIPOS DE NAVEGAÇÃO (EXPORTADO!)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: { user: any };
  
  // Clientes
  ClientsList: { user: any; shouldRefresh?: boolean; newClientId?: string };
  AddClient: { user: any };
  EditClient: { client: any; user: any };
  ClientDetails: { client: any; user: any };
  
  // Ordens de Serviço
  ServiceOrdersList: { user: any; shouldRefresh?: boolean; newServiceOrderId?: string };
  AddServiceOrder: { user: any };
  EditServiceOrder: { serviceOrder: any; user: any };
  ServiceOrderDetails: { serviceOrder: any; user: any };
  
  // Agendamentos - ✅ CORRIGIDO: Adicionado prefilledData
  ScheduleList: { user: any; shouldRefresh?: boolean; newScheduleId?: string; prefilledData?: any };
  AddSchedule: { user: any };
  ScheduleDetails: { schedule: any; user: any; client?: any };
  
  // Estoque
  Stock: { user: any; shouldRefresh?: boolean; newItemId?: string };
  
  // Perfil
  Profile: { user: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Autenticação */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Home */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* Clientes */}
        <Stack.Screen name="ClientsList" component={ClientsScreen} />
        <Stack.Screen name="AddClient" component={AddClientScreen} />
        <Stack.Screen name="EditClient" component={EditClientScreen} />
        <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />

        {/* Ordens de Serviço */}
        <Stack.Screen name="ServiceOrdersList" component={ServiceOrdersScreen} />
        <Stack.Screen name="AddServiceOrder" component={AddServiceOrderScreen} />
        <Stack.Screen name="EditServiceOrder" component={EditServiceOrderScreen} />
        <Stack.Screen name="ServiceOrderDetails" component={ServiceOrderDetailsScreen} />

        {/* Agendamentos */}
        <Stack.Screen name="ScheduleList" component={ScheduleScreen} />
        <Stack.Screen name="AddSchedule" component={AddScheduleScreen} />
        <Stack.Screen name="ScheduleDetails" component={ScheduleDetailsScreen} />

        {/* Estoque */}
        <Stack.Screen name="Stock" component={StockScreen} />

        {/* Perfil */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
