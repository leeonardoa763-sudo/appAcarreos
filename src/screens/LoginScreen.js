/**
 * LoginScreen.js
 *
 * Pantalla de inicio de sesión con auto-login y diseño moderno
 *
 * PROPÓSITO:
 * - Autenticar usuarios con email y contraseña
 * - Auto-login si hay credenciales guardadas
 * - Opción "Recordar en este dispositivo"
 * - Implementar timeout para proceso de login (10 segundos)
 * - Mostrar feedback visual durante el proceso
 * - Manejar errores de autenticación y conexión
 * - Diseño moderno con gradiente naranja y formas geométricas
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
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import { colors } from "../config/colors";
import {
  promiseWithTimeout,
  TIMEOUT_DURATIONS,
  createObservableTimeout,
} from "../utils/sessionTimeout";
import {
  saveCredentials,
  getCredentials,
  clearCredentials,
  hasRememberedCredentials,
} from "../utils/rememberAccount";

const { width, height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginTimeout, setLoginTimeout] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(true);

  const timeoutRef = useRef(null);
  const isMounted = useRef(true);

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

  const attemptAutoLogin = async () => {
    try {
      const hasCredentials = await hasRememberedCredentials();

      if (!hasCredentials) {
        if (isMounted.current) {
          setIsAutoLoggingIn(false);
        }
        return;
      }

      const credentials = await getCredentials();

      if (!credentials.email || !credentials.password) {
        if (isMounted.current) {
          setIsAutoLoggingIn(false);
        }
        return;
      }

      if (isMounted.current) {
        setEmail(credentials.email);
        setRememberMe(true);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          await clearCredentials();

          if (isMounted.current) {
            Alert.alert(
              "Sesión Expirada",
              "Por favor ingresa tu contraseña nuevamente",
              [{ text: "OK" }],
            );
          }
        }
      }
    } catch (error) {
      console.error("[LoginScreen] Error en auto-login:", error);
    } finally {
      if (isMounted.current) {
        setIsAutoLoggingIn(false);
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa email y contraseña");
      return;
    }

    setLoading(true);
    setLoginTimeout(null);

    timeoutRef.current = createObservableTimeout(
      () => {
        handleLoginTimeout();
      },
      (secondsRemaining) => {
        if (secondsRemaining === 3) {
          setLoginTimeout(secondsRemaining);
        }
      },
      TIMEOUT_DURATIONS.LOGIN,
    );

    try {
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      const { data, error } = await promiseWithTimeout(
        loginPromise,
        TIMEOUT_DURATIONS.LOGIN,
      );

      if (timeoutRef.current) {
        timeoutRef.current.clear();
      }

      if (error) {
        throw error;
      }

      if (rememberMe) {
        await saveCredentials(email.trim().toLowerCase(), password);
      } else {
        await clearCredentials();
      }
    } catch (error) {
      if (timeoutRef.current) {
        timeoutRef.current.clear();
      }

      if (error.name === "TimeoutError") {
        handleLoginTimeout();
        return;
      }

      let errorMessage = "Error al iniciar sesión. Intenta de nuevo.";

      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email o contraseña incorrectos";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Por favor verifica tu email antes de iniciar sesión";
      } else if (error.message?.includes("fetch")) {
        errorMessage =
          "Error de conexión. Verifica tu internet e intenta de nuevo.";
      }

      Alert.alert("Error de Autenticación", errorMessage, [{ text: "OK" }]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setLoginTimeout(null);
      }
    }
  };

  const handleLoginTimeout = async () => {
    if (!isMounted.current) return;

    setLoading(false);
    setLoginTimeout(null);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("[LoginScreen] Error limpiando sesión:", error);
    }

    Alert.alert(
      "Tiempo de Espera Excedido",
      "El inicio de sesión tardó demasiado. Por favor verifica tu conexión a internet e intenta de nuevo.",
      [{ text: "OK" }],
    );
  };

  if (isAutoLoggingIn) {
    return (
      <LinearGradient
        colors={["#D84315", "#FF6B35", "#FF8C61"]}
        style={styles.autoLoginContainer}
      >
        <Image
          source={require("../../assets/logo.png")}
          style={styles.autoLoginLogo}
          resizeMode="contain"
        />
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
          style={styles.autoLoginSpinner}
        />
        <Text style={styles.autoLoginText}>Iniciando sesión...</Text>
        <Text style={styles.autoLoginSubtext}>
          Verificando credenciales guardadas
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#D84315", "#FF6B35", "#FF8C61"]}
      style={styles.gradient}
    >
      {/* Formas geométricas decorativas */}
      <View style={styles.decorativeShapes}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Logo y Nombre de la App */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Control de Acarreos</Text>
          <Text style={styles.subtitle}>Sistema de Vales Digitales</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Campo Email */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color="#FFFFFF"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              editable={!loading}
            />
          </View>

          {/* Campo Contraseña */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={20}
              color="#FFFFFF"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
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
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Checkbox "Recordar en este dispositivo" */}
          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
              size={24}
              color="#FFFFFF"
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
                color="#FFFFFF"
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
                <ActivityIndicator size="small" color="#D84315" />
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
            color="rgba(255, 255, 255, 0.8)"
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
                color="rgba(255, 255, 255, 0.7)"
              />
              <Text style={styles.developerText}>
                Desarrollado por: Ing. Leonardo Aguilar Saucedo
              </Text>
            </View>
            <View style={styles.developerRow}>
              <MaterialCommunityIcons
                name="phone"
                size={14}
                color="rgba(255, 255, 255, 0.7)"
              />
              <Text style={styles.developerText}>Contacto: 492 145 2396</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  decorativeShapes: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    top: height * 0.3,
    right: -30,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  autoLoginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  autoLoginLogo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  autoLoginSpinner: {
    marginTop: 20,
  },
  autoLoginText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
  },
  autoLoginSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    height: "100%",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 8,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingLeft: 4,
  },
  rememberMeText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
  },
  timeoutWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  timeoutWarningText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D84315",
    marginLeft: 8,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 8,
    textAlign: "center",
  },
  developerInfo: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
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
    color: "rgba(255, 255, 255, 0.75)",
    marginLeft: 6,
  },
});

export default LoginScreen;
