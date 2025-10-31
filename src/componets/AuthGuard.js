// src/components/AuthGuard.js - CORRECCIÓN FINAL
import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import LoginScreen from "../screens/LoginScreen";

const AuthGuard = ({ children }) => {
  const { user, isAuthenticated, loading, userProfile, profileError, signOut } =
    useAuth(); // ← Agregar user aquí

  const handleBackToLogin = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 10 }}>Cargando...</Text>
      </View>
    );
  }

  // Si hay error de perfil, mostrar opción para volver
  if (profileError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Perfil No Encontrado</Text>
        <Text style={styles.errorMessage}>
          El usuario está autenticado pero no tiene perfil en el sistema.
        </Text>
        <Text style={styles.errorDetails}>User ID: {user?.id}</Text>{" "}
        {/* ← Ahora user existe */}
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <Text style={styles.backButtonText}>Volver al Inicio de Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (!userProfile) {
    return (
      <View style={styles.centerContainer}>
        <Text>Cargando perfil de usuario...</Text>
      </View>
    );
  }

  return children;
};

// ... los styles permanecen igual
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#f5f5f5",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 15,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 22,
  },
  errorDetails: {
    fontSize: 12,
    color: "#95a5a6",
    textAlign: "center",
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: "center",
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default AuthGuard;

// src/components/AuthGuard.js version anterior
// import React from "react";
// import { View, ActivityIndicator, StyleSheet } from "react-native";
// import { useAuth } from "../hooks/useAuth.js";
// import LoginScreen from "../screens/LoginScreen.js";

// const AuthGuard = ({ children }) => {
//   const { isAuthenticated, loading } = useAuth();

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#3498db" />
//       </View>
//     );
//   }

//   if (!isAuthenticated) {
//     return <LoginScreen />;
//   }

//   return <>{children}</>;
// };

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//   },
// });

// export default AuthGuard;
