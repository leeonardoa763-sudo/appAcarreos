/**
 * LoginScreen.js
 *
 * Pantalla de inicio de sesión con auto-login
 *
 * PROPÓSITO:
 * - Autenticar usuarios con email y contraseña
 * - Auto-login si hay credenciales guardadas
 * - Opción "Recordar en este dispositivo"
 * - Implementar timeout para proceso de login (10 segundos)
 * - Mostrar feedback visual durante el proceso
 * - Manejar errores de autenticación y conexión
 *
 * VALIDACIONES:
 * - Email y contraseña requeridos
 * - Timeout automático si login tarda más de 10 segundos
 * - Limpieza de sesión si hay error de timeout
 *
 * NAVEGACIÓN:
 * - Login exitoso: AuthGuard maneja redirección automática
 * - Login fallido: Muestra error y permite reintentar
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import { colors } from "../config/colors";
//Estilos
import { screenStyles, formStyles } from "../styles";
import {
  promiseWithTimeout,
  TIMEOUT_DURATIONS,
  createObservableTimeout,
} from "../utils/sessionTimeout";
// 🆕 Importar utilidades de recordar cuenta
import {
  saveCredentials,
  getCredentials,
  clearCredentials,
  hasRememberedCredentials,
} from "../utils/rememberAccount";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginTimeout, setLoginTimeout] = useState(null);
  // 🆕 Estados para recordar cuenta
  const [rememberMe, setRememberMe] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(true);

  // Referencia para manejar timeout observable
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);

  // 🆕 Effect para intentar auto-login al montar
  useEffect(() => {
    isMounted.current = true;

    attemptAutoLogin();

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        timeoutRef.current.clear();
      }
    };
  }, []);

  /**
   * 🆕 Intenta hacer auto-login si hay credenciales guardadas
   */
  const attemptAutoLogin = async () => {
    try {
      // Verificar si hay credenciales guardadas
      const hasCredentials = await hasRememberedCredentials();

      if (!hasCredentials) {
        if (isMounted.current) {
          setIsAutoLoggingIn(false);
        }
        return;
      }

      // Obtener credenciales
      const credentials = await getCredentials();

      if (!credentials.email || !credentials.password) {
        if (isMounted.current) {
          setIsAutoLoggingIn(false);
        }
        return;
      }

      console.log("[LoginScreen] 🔄 Iniciando auto-login...");

      // Pre-llenar campos (para que usuario vea qué cuenta está usando)
      if (isMounted.current) {
        setEmail(credentials.email);
        setRememberMe(true);
      }

      // Pequeño delay para que usuario vea la pantalla
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Intentar login automático
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error("[LoginScreen] ❌ Auto-login falló:", error.message);

        // Si las credenciales son inválidas, borrarlas
        if (error.message.includes("Invalid login credentials")) {
          await clearCredentials();

          if (isMounted.current) {
            Alert.alert(
              "Sesión Expirada",
              "Por favor ingresa tu contraseña nuevamente",
              [{ text: "OK" }]
            );
          }
        }
      } else {
        console.log("[LoginScreen] ✅ Auto-login exitoso");
        // AuthGuard manejará la navegación
      }
    } catch (error) {
      console.error("[LoginScreen] ❌ Error en auto-login:", error);
    } finally {
      if (isMounted.current) {
        setIsAutoLoggingIn(false);
      }
    }
  };

  /**
   * Maneja el proceso de inicio de sesión con timeout
   */
  const handleLogin = async () => {
    // Validación de campos
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa email y contraseña");
      return;
    }

    setLoading(true);
    setLoginTimeout(null);

    // Crear timeout observable para mostrar contador
    timeoutRef.current = createObservableTimeout(
      () => {
        // Callback cuando expira el timeout
        handleLoginTimeout();
      },
      (secondsRemaining) => {
        // Mostrar advertencia cuando queden 3 segundos
        if (secondsRemaining === 3) {
          setLoginTimeout(secondsRemaining);
        }
      },
      TIMEOUT_DURATIONS.LOGIN
    );

    try {
      // Intentar login con timeout
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      const { data, error } = await promiseWithTimeout(
        loginPromise,
        TIMEOUT_DURATIONS.LOGIN,
        "El inicio de sesión tardó demasiado"
      );

      // Cancelar timeout si login completó
      if (timeoutRef.current) {
        timeoutRef.current.clear();
      }

      if (error) {
        // Manejar errores específicos de Supabase
        if (error.message.includes("Invalid login credentials")) {
          Alert.alert(
            "Error de inicio de sesión",
            "Email o contraseña incorrectos"
          );
        } else if (error.message.includes("Email not confirmed")) {
          Alert.alert(
            "Email no confirmado",
            "Por favor confirma tu email antes de iniciar sesión"
          );
        } else {
          Alert.alert("Error de inicio de sesión", error.message);
        }
      } else {
        console.log("Usuario logueado exitosamente");

        // 🆕 Guardar credenciales si está habilitado "Recordar"
        if (rememberMe) {
          const saved = await saveCredentials(
            email.trim().toLowerCase(),
            password
          );
          if (saved) {
            console.log(
              "[LoginScreen] ✅ Credenciales guardadas para próximo inicio"
            );
          }
        } else {
          // Si no está marcado, asegurarse de borrar credenciales previas
          await clearCredentials();
        }

        // AuthGuard manejará la navegación automáticamente
      }
    } catch (error) {
      // Manejar error de timeout
      if (error.message.includes("tardó demasiado")) {
        Alert.alert(
          "Tiempo de Espera Agotado",
          "El inicio de sesión está tardando demasiado. Verifica tu conexión a internet e intenta de nuevo.",
          [{ text: "OK" }]
        );

        // Limpiar posible sesión parcial
        await cleanupFailedLogin();
      } else {
        Alert.alert("Error", "Ocurrió un error inesperado");
        console.error("Login error:", error);
      }
    } finally {
      setLoading(false);
      setLoginTimeout(null);

      // Limpiar timeout si aún está activo
      if (timeoutRef.current) {
        timeoutRef.current.clear();
      }
    }
  };

  /**
   * Maneja el caso cuando el timeout expira
   */
  const handleLoginTimeout = () => {
    console.log("Login timeout alcanzado");
    setLoading(false);

    Alert.alert(
      "Tiempo Agotado",
      "El inicio de sesión tardó más de lo esperado. Por favor verifica tu conexión e intenta nuevamente.",
      [{ text: "Entendido" }]
    );
  };

  /**
   * Limpia sesión parcial después de un login fallido por timeout
   */
  const cleanupFailedLogin = async () => {
    try {
      await supabase.auth.signOut();

      // Limpiar AsyncStorage
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      const allKeys = await AsyncStorage.getAllKeys();
      const supabaseKeys = allKeys.filter((key) => key.includes("supabase"));

      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
        console.log("Sesión parcial limpiada después de timeout");
      }
    } catch (error) {
      console.error("Error limpiando sesión fallida:", error);
    }
  };

  // 🆕 Mostrar pantalla de auto-login
  if (isAutoLoggingIn) {
    return (
      <View style={styles.autoLoginContainer}>
        <MaterialCommunityIcons
          name="truck-delivery"
          size={80}
          color={colors.primary}
        />
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.autoLoginSpinner}
        />
        <Text style={styles.autoLoginText}>Iniciando sesión...</Text>
        <Text style={styles.autoLoginSubtext}>
          {email || "Verificando credenciales guardadas"}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="truck-delivery"
          size={60}
          color={colors.primary}
        />
        <Text style={styles.title}>CONTROL ACARREOS</Text>
        <Text style={styles.subtitle}>Iniciar Sesión</Text>
      </View>

      {/* Formulario */}
      <View style={styles.form}>
        {/* Campo Email */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons
            name="email-outline"
            size={20}
            color={colors.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
        </View>

        {/* Campo Contraseña */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={20}
            color={colors.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            disabled={loading}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* 🆕 Checkbox "Recordar en este dispositivo" */}
        <TouchableOpacity
          style={styles.rememberMeContainer}
          onPress={() => setRememberMe(!rememberMe)}
          disabled={loading}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
            size={24}
            color={rememberMe ? colors.primary : colors.textSecondary}
          />
          <Text style={styles.rememberMeText}>
            Recordar en este dispositivo
          </Text>
        </TouchableOpacity>

        {/* Advertencia de timeout */}
        {loginTimeout !== null && (
          <View style={styles.timeoutWarning}>
            <MaterialCommunityIcons
              name="clock-alert-outline"
              size={16}
              color={colors.accent}
            />
            <Text style={styles.timeoutWarningText}>
              Conexión lenta detectada...
            </Text>
          </View>
        )}

        {/* Botón de Login */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.buttonText}>Iniciando sesión...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.footerText}>
          Sistema de Control de Vales Digitales
        </Text>

        {/* Información del Desarrollador */}
        <View style={styles.developerInfo}>
          <View style={styles.developerRow}>
            <MaterialCommunityIcons
              name="account-hard-hat"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.developerText}>
              Desarrollado por: Ing. Leonardo Aguilar Saucedo
            </Text>
          </View>
          <View style={styles.developerRow}>
            <MaterialCommunityIcons
              name="phone"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.developerText}>Contacto: 492 145 2396</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  ...screenStyles,
  ...formStyles,
  // Ajuste del footer principal
  footer: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  // Estilos para información del desarrollador
  developerInfo: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    width: "100%",
    alignItems: "center",
  },
  developerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  developerText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  // 🆕 Estilos para checkbox "Recordar dispositivo"
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
    paddingLeft: 4,
  },
  rememberMeText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  // 🆕 Estilos para pantalla de auto-login
  autoLoginContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  autoLoginSpinner: {
    marginTop: 20,
  },
  autoLoginText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 16,
  },
  autoLoginSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
});

export default LoginScreen;
