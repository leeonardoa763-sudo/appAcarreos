// src/components/DrawerContent.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { useAuth } from "../hooks/useAuth";
// 🆕 Importar utilidades de recordar cuenta
import {
  clearCredentials,
  hasRememberedCredentials,
} from "../utils/rememberAccount";

const DrawerContent = (props) => {
  const { userProfile, userName, signOut } = useAuth();
  // 🆕 Estado para saber si hay credenciales guardadas
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  // 🆕 Verificar si hay credenciales guardadas al montar
  useEffect(() => {
    checkStoredCredentials();
  }, []);

  /**
   * 🆕 Verifica si hay credenciales guardadas
   */
  const checkStoredCredentials = async () => {
    const hasCredentials = await hasRememberedCredentials();
    setHasStoredCredentials(hasCredentials);
  };

  /**
   * 🆕 Maneja el olvido del dispositivo (borrar credenciales)
   */
  const handleForgetDevice = () => {
    Alert.alert(
      "Olvidar Dispositivo",
      "Se borrarán las credenciales guardadas y deberás iniciar sesión manualmente la próxima vez.\n\n¿Deseas continuar?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Olvidar",
          style: "destructive",
          onPress: async () => {
            try {
              await clearCredentials();
              setHasStoredCredentials(false);

              Alert.alert(
                "Dispositivo Olvidado",
                "Las credenciales han sido borradas. La próxima vez deberás iniciar sesión manualmente.",
                [{ text: "Entendido" }],
              );

              console.log(
                "[DrawerContent] ✅ Credenciales borradas exitosamente",
              );
            } catch (error) {
              console.error(
                "[DrawerContent] ❌ Error borrando credenciales:",
                error,
              );
              Alert.alert(
                "Error",
                "No se pudieron borrar las credenciales. Intenta de nuevo.",
                [{ text: "OK" }],
              );
            }
          },
        },
      ],
    );
  };

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
          props.navigation.closeDrawer();
          await signOut();
          console.log(
            "[DrawerContent] Logout completado, AuthGuard redirigirá a Login",
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

        <View style={styles.divider} />

        {/* 🆕 Opción "Olvidar este dispositivo" (solo si hay credenciales) */}
        {hasStoredCredentials && (
          <>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleForgetDevice}
            >
              <MaterialCommunityIcons
                name="cellphone-remove"
                size={24}
                color={colors.warning}
              />
              <Text style={[styles.menuText, styles.warningText]}>
                Olvidar este dispositivo
              </Text>
            </TouchableOpacity>
            <View style={styles.divider} />
          </>
        )}

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
        <Text style={styles.footerText}>
          Creador: Ing Leonardo Aguilar Saucedo
        </Text>
        {/* 🆕 Indicador si hay credenciales guardadas */}
        {hasStoredCredentials && (
          <View style={styles.credentialsIndicator}>
            <MaterialCommunityIcons
              name="shield-check"
              size={12}
              color={colors.accent}
            />
            <Text style={styles.credentialsText}>
              Login automático activado
            </Text>
          </View>
        )}
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
  // 🆕 Estilos para "Olvidar dispositivo"
  warningText: {
    color: colors.warning,
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
  // 🆕 Indicador de credenciales guardadas
  credentialsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(26, 147, 111, 0.1)",
    borderRadius: 12,
  },
  credentialsText: {
    color: colors.accent,
    fontSize: 10,
    marginLeft: 4,
    fontWeight: "600",
  },
});

export default DrawerContent;
