/**
 * AuthGuard.js
 *
 * Componente guardian de autenticación
 *
 * PROPÓSITO:
 * - Proteger rutas que requieren autenticación
 * - Mostrar pantallas según estado de autenticación
 * - Manejar errores de timeout y conexión
 * - Redirigir a Login cuando no hay sesión
 *
 * ESTADOS MANEJADOS:
 * - Loading: Cargando sesión inicial
 * - Timeout: Carga excedió límite de tiempo
 * - No Profile: Usuario sin registro en BD
 * - Not Authenticated: Sin sesión activa
 * - Authenticated: Sesión válida, mostrar app
 */

import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import LoginScreen from "../screens/LoginScreen";
import { colors } from "../config/colors";

const AuthGuard = ({ children }) => {
  const {
    user,
    userProfile,
    loading,
    profileError,
    timeoutError,
    isAuthenticated,
    signOut,
    retryLoad,
  } = useAuth();

  // Usuario no autenticado - mostrar Login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Error de timeout - mostrar pantalla de error con opción de reintentar
  if (timeoutError) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="clock-alert-outline"
          size={80}
          color={colors.danger}
        />

        <Text style={styles.errorTitle}>Tiempo de Espera Agotado</Text>

        <Text style={styles.errorMessage}>{timeoutError.message}</Text>

        <View style={styles.timeoutInfoBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.timeoutInfoText}>
            La aplicación tardó demasiado en responder. Esto puede deberse a:
            {"\n"}• Conexión a internet lenta{"\n"}• Problemas con el servidor
            {"\n"}• Datos móviles limitados
          </Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.timeoutActions}>
          <TouchableOpacity style={styles.retryButton} onPress={retryLoad}>
            <MaterialCommunityIcons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={colors.danger}
            />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          Si el problema persiste, contacta al administrador
        </Text>
      </View>
    );
  }

  // Loading inicial
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
        <Text style={styles.loadingSubtext}>Verificando credenciales</Text>
      </View>
    );
  }

  // Usuario autenticado pero sin perfil en la base de datos
  if (profileError) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="account-alert"
          size={80}
          color={colors.danger}
        />

        <Text style={styles.errorTitle}>Perfil No Encontrado</Text>

        <Text style={styles.errorMessage}>
          {profileError.code === "NO_PROFILE"
            ? profileError.message
            : "No se pudo cargar tu perfil de usuario."}
        </Text>

        {user?.email && (
          <View style={styles.userInfoBox}>
            <Text style={styles.userInfoLabel}>Email de sesión:</Text>
            <Text style={styles.userInfoValue}>{user.email}</Text>
            <Text style={styles.userInfoLabel}>User ID:</Text>
            <Text style={styles.userInfoValue}>{user.id}</Text>
          </View>
        )}

        <Text style={styles.errorHelp}>
          Contacta al administrador para que vincule tu usuario con un perfil de
          residente o administrador.
        </Text>

        <TouchableOpacity style={styles.backButton} onPress={signOut}>
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.backButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Usuario autenticado pero perfil aún cargando
  if (!userProfile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  // Todo OK - mostrar la app
  return children;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.danger,
    marginTop: 20,
    marginBottom: 15,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  timeoutInfoBox: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    width: "100%",
    maxWidth: 350,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  timeoutInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 10,
    flex: 1,
  },
  timeoutActions: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutButtonText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  userInfoBox: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
    maxWidth: 350,
  },
  userInfoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: "600",
  },
  userInfoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 5,
    fontFamily: "monospace",
  },
  errorHelp: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 200,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default AuthGuard;
