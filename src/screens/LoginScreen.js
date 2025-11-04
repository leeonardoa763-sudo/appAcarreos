/**
 * LoginScreen.js
 *
 * Pantalla de inicio de sesión
 *
 * PROPÓSITO:
 * - Autenticar usuarios con email y contraseña
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

import React, { useState, useRef } from "react";
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
import {
  promiseWithTimeout,
  TIMEOUT_DURATIONS,
  createObservableTimeout,
} from "../utils/sessionTimeout";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginTimeout, setLoginTimeout] = useState(null);

  // Referencia para manejar timeout observable
  const timeoutRef = useRef(null);

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
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  form: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: colors.background,
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: colors.textPrimary,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    padding: 5,
  },
  timeoutWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  timeoutWarningText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});

export default LoginScreen;
