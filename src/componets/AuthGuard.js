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
 * - Checking Version: Verificando versión de la app
 * - Version Outdated: Versión obsoleta, bloquear acceso
 * - Loading: Cargando sesión inicial
 * - Timeout: Carga excedió límite de tiempo
 * - No Profile: Usuario sin registro en BD
 * - Not Authenticated: Sin sesión activa
 * - Authenticated: Sesión válida, mostrar app
 */

import React, { useState, useEffect, useRef } from "react";
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
import UpdateRequiredScreen from "../screens/UpdateRequiredScreen";
import { colors } from "../config/colors";
import { checkAppVersion } from "../utils/versionChecker";
import ErrorReportable from "../componets/common/ErrorReportable";

// Tiempo máximo de espera antes de mostrar pantalla de timeout
const LOADING_TIMEOUT_MS = 12000;

const AuthGuard = ({ children }) => {
  const { user, userProfile, loading, profileError, isAuthenticated, signOut } =
    useAuth();

  const [isRetrying, setIsRetrying] = useState(false);
  const [timeoutDetected, setTimeoutDetected] = useState(false);
  const [timeoutCode, setTimeoutCode] = useState(null);

  // Estados para verificación de versión
  const [checkingVersion, setCheckingVersion] = useState(true);
  const [versionInfo, setVersionInfo] = useState(null);

  const timeoutRef = useRef(null);

  // Verificar versión al montar
  useEffect(() => {
    verifyAppVersion();
  }, []);

  const verifyAppVersion = async () => {
    try {
      console.log("[AuthGuard] Verificando version de la app...");
      const versionCheck = await checkAppVersion();

      if (versionCheck.needsUpdate) {
        console.log("[AuthGuard] Actualizacion requerida");
        setVersionInfo(versionCheck);
      } else {
        console.log("[AuthGuard] Version valida");
        setVersionInfo(null);
      }
    } catch (error) {
      console.error("[AuthGuard] Error verificando version:", error);
      setVersionInfo(null);
    } finally {
      setCheckingVersion(false);
    }
  };

  // Detectar timeout si la carga tarda más de LOADING_TIMEOUT_MS
  useEffect(() => {
    if (loading) {
      // Limpiar timer anterior si existía
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (loading) {
          const codigo = `AG-${Date.now().toString(36).toUpperCase().slice(-5)}`;
          console.warn("[AuthGuard] Timeout detectado, codigo:", codigo);
          setTimeoutCode(codigo);
          setTimeoutDetected(true);
        }
      }, LOADING_TIMEOUT_MS);
    } else {
      // Loading terminó — limpiar todo
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTimeoutDetected(false);
      setTimeoutCode(null);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading]);

  /**
   * Cierra sesión limpiamente y deja que AuthContext reinicie el flujo.
   * Es la única forma confiable de "reintentar" en mobile.
   */
  const handleRetry = async () => {
    setIsRetrying(true);
    setTimeoutDetected(false);
    setTimeoutCode(null);

    try {
      await signOut();
    } catch (error) {
      console.error("[AuthGuard] Error en retry:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Cerrar Sesión", "¿Deseas cerrar sesión y empezar de nuevo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            setTimeoutDetected(false);
            setTimeoutCode(null);
          } catch (error) {
            console.error("[AuthGuard] Error cerrando sesion:", error);
          }
        },
      },
    ]);
  };

  // ─── PRIORIDAD 1: Cargando ────────────────────────────────────────────────
  if (checkingVersion || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
        <Text style={styles.loadingSubtext}>Verificando credenciales</Text>
      </View>
    );
  }

  // ─── PRIORIDAD 2: Versión obsoleta ────────────────────────────────────────
  if (versionInfo?.needsUpdate) {
    return <UpdateRequiredScreen versionInfo={versionInfo} />;
  }

  // ─── PRIORIDAD 3: Timeout ─────────────────────────────────────────────────
  if (timeoutDetected) {
    return (
      <ErrorReportable
        codigo={timeoutCode}
        titulo="Tiempo de Espera Agotado"
        mensaje="La app tardó demasiado en verificar tu sesión. Puede deberse a conexión lenta o problemas con el servidor."
        detalle="timeout en AuthGuard durante carga de sesión"
        icono="clock-alert-outline"
        colorIcono={colors.warning}
        onReintentar={handleRetry}
        onSalir={handleSignOut}
        textoReintentar="Reintentar"
        textoSalir="Cerrar Sesión"
        cargando={isRetrying}
      />
    );
  }

  // ─── PRIORIDAD 4: No autenticado ──────────────────────────────────────────
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // ─── PRIORIDAD 5: Usuario inactivo ────────────────────────────────────────
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

  // ─── PRIORIDAD 6: Sin perfil en BD ────────────────────────────────────────
  if (profileError) {
    const codigoPerfil = `PF-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    return (
      <ErrorReportable
        codigo={codigoPerfil}
        titulo="Perfil No Encontrado"
        mensaje={
          profileError.code === "NO_PROFILE"
            ? profileError.message
            : "No se pudo cargar tu perfil de usuario."
        }
        detalle={`profileError.code: ${profileError.code || "desconocido"} | user: ${user?.id || "null"}`}
        icono="account-alert"
        colorIcono={colors.danger}
        onSalir={handleSignOut}
        textoSalir="Cerrar Sesión"
      />
    );
  }

  // ─── Usuario autenticado con perfil — mostrar app ─────────────────────────
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
  errorCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  errorCodeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorCodeValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.textPrimary,
    letterSpacing: 1,
  },
});

export default AuthGuard;
