/**
 * rememberAccount.js
 *
 * Utilidad para recordar credenciales de usuario
 *
 * PROPÓSITO:
 * - Guardar credenciales de forma segura con SecureStore
 * - Permitir auto-login cuando el usuario abre la app
 * - Gestionar opción "Recordar en este dispositivo"
 *
 * SEGURIDAD:
 * - Usa expo-secure-store (encriptado nativo)
 * - Credenciales nunca se exponen en logs
 * - Opción para borrar credenciales (olvidar dispositivo)
 */

import * as SecureStore from "expo-secure-store";

// Claves para SecureStore
const KEYS = {
  EMAIL: "remembered_email",
  PASSWORD: "remembered_password",
  REMEMBER_ENABLED: "remember_enabled",
};

/**
 * Guarda las credenciales del usuario de forma segura
 *
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<boolean>} - true si guardó exitosamente
 */
export const saveCredentials = async (email, password) => {
  try {
    await SecureStore.setItemAsync(KEYS.EMAIL, email);
    await SecureStore.setItemAsync(KEYS.PASSWORD, password);
    await SecureStore.setItemAsync(KEYS.REMEMBER_ENABLED, "true");

    return true;
  } catch (error) {
    console.error("[RememberAccount] ❌ Error guardando credenciales:", error);
    return false;
  }
};

/**
 * Obtiene las credenciales guardadas
 *
 * @returns {Promise<{email: string|null, password: string|null, rememberEnabled: boolean}>}
 */
export const getCredentials = async () => {
  try {
    const rememberEnabled = await SecureStore.getItemAsync(
      KEYS.REMEMBER_ENABLED
    );

    // Si no está habilitado, no devolver credenciales
    if (rememberEnabled !== "true") {
      return { email: null, password: null, rememberEnabled: false };
    }

    const email = await SecureStore.getItemAsync(KEYS.EMAIL);
    const password = await SecureStore.getItemAsync(KEYS.PASSWORD);

    return {
      email,
      password,
      rememberEnabled: true,
    };
  } catch (error) {
    console.error("[RememberAccount] ❌ Error obteniendo credenciales:", error);
    return { email: null, password: null, rememberEnabled: false };
  }
};

/**
 * Borra las credenciales guardadas (olvidar dispositivo)
 *
 * @returns {Promise<boolean>} - true si borró exitosamente
 */
export const clearCredentials = async () => {
  try {
    await SecureStore.deleteItemAsync(KEYS.EMAIL);
    await SecureStore.deleteItemAsync(KEYS.PASSWORD);
    await SecureStore.deleteItemAsync(KEYS.REMEMBER_ENABLED);

    return true;
  } catch (error) {
    console.error("[RememberAccount] ❌ Error borrando credenciales:", error);
    return false;
  }
};

/**
 * Verifica si hay credenciales guardadas
 *
 * @returns {Promise<boolean>}
 */
export const hasRememberedCredentials = async () => {
  try {
    const rememberEnabled = await SecureStore.getItemAsync(
      KEYS.REMEMBER_ENABLED
    );
    return rememberEnabled === "true";
  } catch (error) {
    console.error(
      "[RememberAccount] ❌ Error verificando credenciales:",
      error
    );
    return false;
  }
};

/**
 * Actualiza solo el estado de "recordar dispositivo"
 *
 * @param {boolean} enabled - true para habilitar, false para deshabilitar
 * @returns {Promise<boolean>}
 */
export const setRememberEnabled = async (enabled) => {
  try {
    if (enabled) {
      await SecureStore.setItemAsync(KEYS.REMEMBER_ENABLED, "true");
    } else {
      // Si se deshabilita, borrar también las credenciales
      await clearCredentials();
    }

    return true;
  } catch (error) {
    console.error("[RememberAccount] ❌ Error actualizando remember:", error);
    return false;
  }
};
