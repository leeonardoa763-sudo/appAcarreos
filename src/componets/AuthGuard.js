// src/components/AuthGuard.js
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

const AuthGuard = ({ children }) => {
  const { user, userProfile, loading, profileError, isAuthenticated, signOut } =
    useAuth();

  // 🆕 CRÍTICO: Si no está autenticado, mostrar Login inmediatamente
  // Esto previene el parpadeo de la app después del logout
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Loading inicial
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando...</Text>
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
          color="#E74C3C"
        />

        <Text style={styles.errorTitle}>⚠️ Perfil No Encontrado</Text>

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
        <ActivityIndicator size="large" color="#FF6B35" />
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
    backgroundColor: "#F5F6FA",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#7F8C8D",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#F5F6FA",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E74C3C",
    marginTop: 20,
    marginBottom: 15,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  userInfoBox: {
    backgroundColor: "#ECF0F1",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
    maxWidth: 350,
  },
  userInfoLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 8,
    fontWeight: "600",
  },
  userInfoValue: {
    fontSize: 14,
    color: "#2C3E50",
    marginBottom: 5,
    fontFamily: "monospace",
  },
  errorHelp: {
    fontSize: 14,
    color: "#95A5A6",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: "#FF6B35",
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
