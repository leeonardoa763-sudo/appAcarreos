// src/screens/ConfiguracionScreen.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { useAuth } from "../hooks/useAuth";

const ConfiguracionScreen = () => {
  const { signOut, userProfile, userName } = useAuth();

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
          const { error } = await signOut();
          if (error) {
            Alert.alert("Error", "No se pudo cerrar la sesión");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Sección de Usuario */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons
              name="account-circle"
              size={80}
              color={colors.primary}
            />
          </View>
          <Text style={styles.userName}>{userName || "Usuario"}</Text>
          <Text style={styles.userEmail}>
            {userProfile?.current_email || userProfile?.email || "Sin email"}
          </Text>
          {userProfile?.roles?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{userProfile.roles.role}</Text>
            </View>
          )}
        </View>

        {/* Opciones */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionItem}>
            <MaterialCommunityIcons
              name="account-outline"
              size={24}
              color={colors.textPrimary}
            />
            <Text style={styles.optionText}>Mi Perfil</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={colors.textPrimary}
            />
            <Text style={styles.optionText}>Notificaciones</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <MaterialCommunityIcons
              name="help-circle-outline"
              size={24}
              color={colors.textPrimary}
            />
            <Text style={styles.optionText}>Ayuda</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <MaterialCommunityIcons
              name="information-outline"
              size={24}
              color={colors.textPrimary}
            />
            <Text style={styles.optionText}>Acerca de</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Versión */}
        <Text style={styles.version}>Versión 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: colors.surface,
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 5,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  optionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  version: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: "auto",
    marginBottom: 20,
  },
});

export default ConfiguracionScreen;
