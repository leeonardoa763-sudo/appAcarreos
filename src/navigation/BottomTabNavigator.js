// src/navigation/BottomTabNavigator.js
import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
// Hook para obtener rol del usuario
import { useAuth } from "../hooks/useAuth";

// Componentes
import CustomHeader from "../componets/CustomHeader.js";
import DrawerContent from "../componets/DrawerContent.js";

// Pantallas
import AcarreosScreen from "../screens/AcarreosScreen";
import InformesScreen from "../screens/InformesScreen";
import ValesScreen from "../screens/ValesScreen";
import SeleccionarTipoValeScreen from "../screens/SeleccionarTipoValeScreen";
import ArchivadosScreen from "../screens/ArchivadosScreen";
import ValeRentaScreen from "../screens/ValeRentaScreen";
import ValeMaterialScreen from "../screens/ValeMaterialScreen";
import ValeMaterialAsfalticoScreen from "../screens/ValeMaterialAsfalticoScreen";
import ConfiguracionScreen from "../screens/ConfiguracionScreen";
import EstadisticasScreen from "../screens/EstadisticasScreen";

import DevToolsScreen from "../screens/DevToolsScreen";
import PresupuestosObraScreen from "../screens/PresupuestosObraScreen";
import GestionMaterialesScreen from "../screens/GestionMaterialesScreen";
import GestionBancosScreen from "../screens/GestionBancosScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Stack para Vales
function ValesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        // Header por defecto oculto
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
        unmountOnBlur: true,
        // Configuración global del header cuando se muestra
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 2,
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerBackTitleVisible: false, // En iOS no mostrar texto "Atrás"
        headerBackTitleStyle: {
          fontSize: 12, // ← Tamaño de fuente del texto "Atrás"
        },
      }}
    >
      {/* Pantalla principal de Vales - SIN header */}
      <Stack.Screen name="ValesMain" component={ValesScreen} />

      {/* Seleccionar tipo - SIN header */}
      <Stack.Screen
        name="SeleccionarTipoVale"
        component={SeleccionarTipoValeScreen}
      />

      {/* Pantalla de Archivados - CON header */}
      <Stack.Screen
        name="Archivados"
        component={ArchivadosScreen}
        options={{
          headerShown: true,
          headerTitle: "Vales Archivados",
          headerBackVisible: true,
        }}
      />

      {/* Pantalla de Renta - CON header */}
      <Stack.Screen
        name="ValeRentaScreen"
        component={ValeRentaScreen}
        options={{
          headerShown: true,
          headerTitle: "Nuevo Vale de Renta",
          headerBackVisible: true, // Mostrar botón de atrás nativo
        }}
      />

      {/* Pantalla de Material - CON header */}
      <Stack.Screen
        name="ValeMaterialScreen"
        component={ValeMaterialScreen}
        options={{
          headerShown: true,
          headerTitle: "Nuevo Vale de Material",
          headerBackVisible: true,
        }}
      />

      {/* Pantalla de Material Asfáltico - CON header */}
      <Stack.Screen
        name="ValeMaterialAsfalticoScreen"
        component={ValeMaterialAsfalticoScreen}
        options={{
          headerShown: true,
          headerTitle: "Nuevo Vale Asfáltico",
          headerBackVisible: true,
        }}
      />
    </Stack.Navigator>
  );
}

// Stack para el panel de administrador
function DevStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="DevToolsMain" component={DevToolsScreen} />
      <Stack.Screen
        name="PresupuestosObra"
        component={PresupuestosObraScreen}
        options={{
          headerShown: true,
          headerTitle: "Presupuestos de Obra",
          headerStyle: { backgroundColor: colors.surface, elevation: 2 },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: "bold", fontSize: 18, color: colors.textPrimary },
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="GestionMateriales"
        component={GestionMaterialesScreen}
        options={{
          headerShown: true,
          headerTitle: "Gestion de Materiales",
          headerStyle: { backgroundColor: colors.surface, elevation: 2 },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: "bold", fontSize: 18, color: colors.textPrimary },
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="GestionBancos"
        component={GestionBancosScreen}
        options={{
          headerShown: true,
          headerTitle: "Bancos de Material",
          headerStyle: { backgroundColor: colors.surface, elevation: 2 },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: "bold", fontSize: 18, color: colors.textPrimary },
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Tabs principales
function MainTabs() {
  const { userRole } = useAuth();
  const esChecador = userRole === "CHECADOR";
  const esAdministrador = userRole === "Administrador";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Vales") {
            iconName = focused
              ? "file-document-multiple"
              : "file-document-multiple-outline";
          } else if (route.name === "Acarreos") {
            iconName = focused ? "dump-truck" : "dump-truck";
          } else if (route.name === "Informes") {
            iconName = focused ? "chart-box" : "chart-box-outline";
          } else if (route.name === "Estadísticas") {
            iconName = focused ? "chart-line" : "chart-line-variant";
          }

          return (
            <MaterialCommunityIcons name={iconName} size={26} color={color} />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // Altura dinámica según plataforma
          height: Platform.select({
            ios: 85, // iPhone con n otch/isla dinámica
            android: 115, // Android estándar
          }),
          paddingBottom: Platform.select({
            ios: 25, // Espacio para el área segura en iOS
            android: 25,
          }),
          paddingTop: 8,
          elevation: 8,
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        header: ({ route }) => {
          let title = route.name;
          return <CustomHeader title={title} />;
        },
      })}
    >
      {/* Tabs que TODOS los roles ven */}
      <Tab.Screen name="Vales" component={ValesStack} />
      <Tab.Screen name="Acarreos" component={AcarreosScreen} />

      {/* 🆕 Tabs que el CHECADOR NO ve */}
      {!esChecador && (
        <>
          <Tab.Screen name="Informes" component={InformesScreen} />
          <Tab.Screen name="Estadísticas" component={EstadisticasScreen} />
        </>
      )}
      {esAdministrador && (
        <Tab.Screen
          name="DevTools"
          component={DevStack}
          options={{
            tabBarLabel: "Admin",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="shield-crown-outline"
                size={26}
                color={color}
              />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Drawer Navigator (menú lateral)
export default function Navigation() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: "left",
        drawerType: "slide",
        drawerStyle: {
          backgroundColor: colors.surface,
        },
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
      <Drawer.Screen
        name="Configuracion"
        component={ConfiguracionScreen}
        options={{
          headerShown: true,
          headerTitle: "Configuración",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
    </Drawer.Navigator>
  );
}
