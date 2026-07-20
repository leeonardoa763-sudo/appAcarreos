/**
 * AuthGuard.js
 *
 * Componente guardian de autenticación y versiones
 *
 * PROPÓSITO:
 * - Verificar versión de la app antes de permitir acceso
 * - Proteger rutas que requieren autenticación
 * - Mostrar pantallas según estado de autenticación
 * - Manejar errores de timeout y conexión
 * - Redirigir a Login cuando no hay sesión
 *
 * ESTADOS MANEJADOS:
 * - Checking Version: Verificando versión de la app 🆕
 * - Version Outdated: Versión obsoleta, bloquear acceso 🆕
 * - Loading: Cargando sesión inicial
 * - Timeout: Carga excedió límite de tiempo
 * - No Profile: Usuario sin registro en BD
 * - Not Authenticated: Sin sesión activa
 * - Authenticated: Sesión válida, mostrar app
 */

import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import LoginScreen from "../screens/LoginScreen";
import UpdateRequiredScreen from "../screens/UpdateRequiredScreen"; // 🆕
import { colors } from "../config/colors";
import { IS_WEB } from "../config/features";
import { checkAppVersion } from "../utils/versionChecker"; // 🆕

const AuthGuard = ({ children }) => {
  const { user, userProfile, loading, profileError, isAuthenticated, signOut } =
    useAuth();

  const [isRetrying, setIsRetrying] = useState(false);
  const [timeoutDetected, setTimeoutDetected] = useState(false);

  // 🆕 Estados para verificación de versión
  const [checkingVersion, setCheckingVersion] = useState(true);
  const [versionInfo, setVersionInfo] = useState(null);

  // 🆕 Verificar versión al montar el componente
  useEffect(() => {
    verifyAppVersion();
  }, []);

  /**
   * 🆕 Verifica la versión de la app
   */
  const verifyAppVersion = async () => {
    // En web la verificacion no aplica: la unica salida que ofrece
    // UpdateRequiredScreen es descargar el APK, y en un navegador no hay nada
    // que instalar. Ademas el bundle web siempre es el ultimo desplegado, asi
    // que no existe una version "vieja" que bloquear. Sin esto, cada release
    // que sube version_minima bloquea la web hasta re-exportarla.
    if (IS_WEB) {
      setVersionInfo(null);
      setCheckingVersion(false);
      return;
    }

    try {

      const versionCheck = await checkAppVersion();

      if (versionCheck.needsUpdate) {
        setVersionInfo(versionCheck);
      } else {
        setVersionInfo(null);
      }
    } catch (error) {
      console.error("[AuthGuard] ❌ Error verificando versión:", error);
      setVersionInfo(null);
    } finally {
      setCheckingVersion(false);
    }
  };

  // Detectar timeout si carga tarda más de 15 segundos
  React.useEffect(() => {
    if (loading) {
      const timeoutTimer = setTimeout(() => {
        if (loading) {
          setTimeoutDetected(true);
        }
      }, 5000); // 15 segundos

      return () => clearTimeout(timeoutTimer);
    } else {
      setTimeoutDetected(false);
    }
  }, [loading]);

  /**
   * Intenta recargar la aplicación
   */
  const handleRetry = async () => {
    setIsRetrying(true);
    setTimeoutDetected(false);

    try {
      // Recargar la app forzando re-render
      window.location?.reload?.(); // Para web
      // Para mobile, el loading se reiniciará automáticamente
    } catch (error) {
      console.error("[AuthGuard] Error en retry:", error);
    } finally {
      setTimeout(() => {
        setIsRetrying(false);
      }, 1000);
    }
  };

  /**
   * Cierra sesión y limpia todo
   */
  const handleSignOut = () => {
    Alert.alert("Cerrar Sesión", "¿Deseas cerrar sesión y empezar de nuevo?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            setTimeoutDetected(false);
          } catch (error) {
            console.error("[AuthGuard] Error cerrando sesión:", error);
          }
        },
      },
    ]);
  };
  // PRIORIDAD 1: Auth o versión cargando (agrupar ambos loadings)
  if (checkingVersion || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
        <Text style={styles.loadingSubtext}>Verificando credenciales</Text>
      </View>
    );
  }

  // PRIORIDAD 2: Versión obsoleta (bloquear acceso)
  if (versionInfo && versionInfo.needsUpdate) {
    return <UpdateRequiredScreen versionInfo={versionInfo} />;
  }

  // PRIORIDAD 3: Timeout detectado
  if (timeoutDetected) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="clock-alert-outline"
          size={80}
          color={colors.warning}
        />
        <Text style={styles.errorTitle}>Tiempo de Espera Agotado</Text>
        <Text style={styles.errorMessage}>
          La aplicación está tardando más de lo esperado en cargar tus datos.
        </Text>
        <View style={styles.timeoutInfoBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.timeoutInfoText}>
            Esto puede deberse a:{"\n"}• Conexión a internet lenta{"\n"}•
            Problemas con el servidor{"\n"}• Datos móviles limitados
          </Text>
        </View>
        <View style={styles.timeoutActions}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            disabled={isRetrying}
          >
            <MaterialCommunityIcons
              name={isRetrying ? "loading" : "refresh"}
              size={20}
              color="white"
            />
            <Text style={styles.retryButtonText}>
              {isRetrying ? "Reintentando..." : "Reintentar"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={isRetrying}
          >
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={colors.danger}
            />
            <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helpText}>
          Si el problema persiste, intenta cerrar sesión y volver a iniciar
        </Text>
      </View>
    );
  }

  // PRIORIDAD 4: No autenticado
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // PRIORIDAD 5: Usuario inactivo
  if (profileError?.code === "USUARIO_INACTIVO") {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="account-cancel"
          size={80}
          color={colors.danger}
        />
        <Text style={styles.errorTitle}>Usuario Discontinuado</Text>
        <Text style={styles.errorMessage}>
          Tu acceso a la aplicación ha sido desactivado por un administrador.
        </Text>
        <View style={styles.timeoutInfoBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.timeoutInfoText}>
            Si crees que esto es un error, comunícate con el administrador del
            sistema para reactivar tu cuenta.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => signOut()}
        >
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={colors.danger}
          />
          <Text style={styles.signOutButtonText}>Entendido, salir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // PRIORIDAD 6: Sin perfil en BD
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
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={colors.danger}
          />
          <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Usuario autenticado con perfil - mostrar app
  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  timeoutInfoBox: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    width: "100%",
  },
  timeoutInfoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  timeoutActions: {
    width: "100%",
    marginTop: 10,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  signOutButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  troubleButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  troubleText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  userInfoBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    width: "100%",
  },
  userInfoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  userInfoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
    marginTop: 2,
  },
  errorHelp: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
});

export default AuthGuard;
