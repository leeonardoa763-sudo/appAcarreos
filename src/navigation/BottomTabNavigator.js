// src/navigation/BottomTabNavigator.js
import React from "react";
import { Platform, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { AYUDA_URLS } from "../config/ayuda";
import { MODO_PIPA } from "../utils/pipasAgua";
// Hook para obtener rol del usuario
import { useAuth } from "../hooks/useAuth";

// Componentes
import CustomHeader from "../componets/CustomHeader.js";
import DrawerContent from "../componets/DrawerContent.js";
import BotonAyuda from "../componets/common/BotonAyuda.js";

// Pantallas
import AcarreosScreen from "../screens/AcarreosScreen";
import InformesScreen from "../screens/InformesScreen";
import ValesScreen from "../screens/ValesScreen";
import SeleccionarTipoValeScreen from "../screens/SeleccionarTipoValeScreen";
import HistorialValesScreen from "../screens/HistorialValesScreen";
import ValeRentaScreen from "../screens/ValeRentaScreen";
import ValeMaterialScreen from "../screens/ValeMaterialScreen";
import ValeMaterialAsfalticoScreen from "../screens/ValeMaterialAsfalticoScreen";
import ConfiguracionScreen from "../screens/ConfiguracionScreen";
import EstadisticasScreen from "../screens/EstadisticasScreen";

import DevToolsScreen from "../screens/DevToolsScreen";
import PresupuestosObraScreen from "../screens/PresupuestosObraScreen";
import GestionMaterialesScreen from "../screens/GestionMaterialesScreen";
import GestionBancosScreen from "../screens/GestionBancosScreen";
import GestionObrasScreen from "../screens/GestionObrasScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

/**
 * Icono de ayuda para el header de las pantallas de creacion de vale.
 *
 * Cada pantalla lleva a SU leccion del Centro de Ayuda, no a la portada: el
 * residente que ya esta llenando un vale de material no tiene que volver a
 * elegir el tipo. La envoltura solo separa el icono del borde de la pantalla.
 */
const ayudaHeaderRight = (url) => () => (
  <View style={{ paddingRight: 12 }}>
    <BotonAyuda url={url} size={24} />
  </View>
);

// Las dos variantes de renta se arman aqui, una sola vez. El `options` de
// ValeRentaScreen es una funcion (depende de route.params), asi que llamar
// ayudaHeaderRight ahi adentro daria un componente nuevo cada vez que se
// re-evalua y React Navigation remontaria el icono sin necesidad.
const AYUDA_HEADER_RENTA = ayudaHeaderRight(AYUDA_URLS.crearRenta);
const AYUDA_HEADER_PIPA = ayudaHeaderRight(AYUDA_URLS.guiaRentaPipa);

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

      {/* Historial de Vales - CON header. Sustituye a la vieja pantalla de
          Archivados, que filtraba por una columna que nadie escribia. */}
      <Stack.Screen
        name="Historial"
        component={HistorialValesScreen}
        options={{
          headerShown: true,
          headerTitle: "Historial de Vales",
          headerBackVisible: true,
        }}
      />

      {/* Pantalla de Renta - CON header. La misma pantalla sirve para pipas
          de agua (modo="pipa"), solo cambia el titulo. */}
      <Stack.Screen
        name="ValeRentaScreen"
        component={ValeRentaScreen}
        options={({ route }) => {
          const esModoPipa = route.params?.modo === MODO_PIPA;
          return {
            headerShown: true,
            headerTitle: esModoPipa
              ? "Nuevo Vale de Pipa de Agua"
              : "Nuevo Vale de Renta",
            headerBackVisible: true, // Mostrar botón de atrás nativo
            // Pipa todavía no tiene lección grabada: su guía es la página puente.
            headerRight: esModoPipa ? AYUDA_HEADER_PIPA : AYUDA_HEADER_RENTA,
          };
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
          headerRight: ayudaHeaderRight(AYUDA_URLS.crearMaterial),
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
          headerRight: ayudaHeaderRight(AYUDA_URLS.crearAsfaltico),
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
      <Stack.Screen
        name="GestionObras"
        component={GestionObrasScreen}
        options={{
          headerShown: true,
          headerTitle: "Gestion de Obras",
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
            web: 70,
          }),
          paddingBottom: Platform.select({
            ios: 25, // Espacio para el área segura en iOS
            android: 25,
            web: 10,
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
