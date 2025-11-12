// src/components/DrawerContent.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { useAuth } from "../hooks/useAuth";

const DrawerContent = (props) => {
  const { userProfile, userName, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          // 🆕 Cerrar drawer primero
          props.navigation.closeDrawer();

          // 🆕 Hacer signOut (ahora con el orden correcto)
          await signOut();

          // 🆕 La navegación a Login la manejará AuthGuard automáticamente
          console.log(
            "[DrawerContent] Logout completado, AuthGuard redirigirá a Login"
          );
        },
      },
    ]);
  };

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      {/* Header del Drawer */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons
            name="account-circle"
            size={80}
            color="#fff"
          />
        </View>
        <Text style={styles.userName}>{userName || "Usuario"}</Text>
        <Text style={styles.userEmail}>
          {userProfile?.current_email || userProfile?.email || "Sin email"}
        </Text>
        {userProfile?.roles?.role && (
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons
              name="shield-account"
              size={14}
              color="#fff"
            />
            <Text style={styles.roleText}>{userProfile.roles.role}</Text>
          </View>
        )}
      </View>

      {/* Opciones del menú */}
      <View style={styles.menuItems}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => props.navigation.navigate("MainTabs")}
        >
          <MaterialCommunityIcons
            name="home-outline"
            size={24}
            color={colors.textPrimary}
          />
          <Text style={styles.menuText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => props.navigation.navigate("Configuracion")}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={24}
            color={colors.textPrimary}
          />
          <Text style={styles.menuText}>Configuración</Text>
        </TouchableOpacity>

        {userProfile?.obras?.obra && (
          <TouchableOpacity style={styles.menuItem}>
            <MaterialCommunityIcons
              name="office-building"
              size={24}
              color={colors.secondary}
            />
            <Text style={[styles.menuText, styles.obraText]}>
              {userProfile.obras.obra}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color={colors.danger}
          />
          <Text style={[styles.menuText, styles.logoutText]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Control Acarreos v1.0</Text>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  userEmail: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  menuItems: {
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 15,
    fontWeight: "500",
  },
  obraText: {
    color: colors.secondary,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  logoutItem: {
    marginTop: 10,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: "600",
  },
  footer: {
    marginTop: "auto",
    paddingVertical: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default DrawerContent;
