import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Importar las pantallas
import AcarreosScreen from "../screens/AcarreosScreen";
import InformesScreen from "../screens/InformesScreen";
import ValesScreen from "../screens/ValesScreen";
import SeleccionarTipoValeScreen from "../screens/SeleccionarTipoValeScreen";
import ValeRentaScreen from "../screens/ValeRentaScreen";
import ValeMaterialScreen from "../screens/ValeMaterialScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator para la sección de Vales
function ValesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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

function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Vales") {
            iconName = focused ? "copy" : "copy-outline";
          } else if (route.name === "Acarreos") {
            iconName = focused ? "car" : "car-outline";
          } else if (route.name === "Informes") {
            iconName = focused ? "document" : "document-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2E86C1",
        tabBarInactiveTintColor: "gray",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen name="Vales" component={ValesStack} />
      <Tab.Screen name="Acarreos" component={AcarreosScreen} />
      <Tab.Screen name="Informes" component={InformesScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <MyTabs />
    </NavigationContainer>
  );
}
