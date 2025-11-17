// src/navigation/BottomTabNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";

// Componentes
import CustomHeader from "../componets/CustomHeader.js";
import DrawerContent from "../componets/DrawerContent.js";

// Pantallas
import AcarreosScreen from "../screens/AcarreosScreen";
import InformesScreen from "../screens/InformesScreen";
import ValesScreen from "../screens/ValesScreen";
import SeleccionarTipoValeScreen from "../screens/SeleccionarTipoValeScreen";
import ValeRentaScreen from "../screens/ValeRentaScreen";
import ValeMaterialScreen from "../screens/ValeMaterialScreen";
import ConfiguracionScreen from "../screens/ConfiguracionScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Stack para Vales
function ValesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="ValesMain" component={ValesScreen} />
      <Stack.Screen
        name="SeleccionarTipoVale"
        component={SeleccionarTipoValeScreen}
      />
      <Stack.Screen name="ValeRentaScreen" component={ValeRentaScreen} />
      <Stack.Screen name="ValeMaterialScreen" component={ValeMaterialScreen} />
    </Stack.Navigator>
  );
}

// Tabs principales
function MainTabs() {
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
          }

          return (
            <MaterialCommunityIcons name={iconName} size={26} color={color} />
          );
        },
        tabBarActiveTintColor: colors.primary, // Naranja construcción
        tabBarInactiveTintColor: colors.textSecondary, // Gris
        tabBarStyle: {
          backgroundColor: colors.surface, // Blanco
          borderTopColor: colors.border, // Borde gris claro
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        header: ({ route }) => {
          let title = route.name;
          return <CustomHeader title={title} />;
        },
      })}
    >
      <Tab.Screen name="Vales" component={ValesStack} />
      <Tab.Screen name="Acarreos" component={AcarreosScreen} />
      <Tab.Screen name="Informes" component={InformesScreen} />
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
