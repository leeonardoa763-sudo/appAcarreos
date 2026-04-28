/**
 * storageUtils.js
 *
 * Utilidades para manejo de AsyncStorage
 *
 * PROPÓSITO:
 * - Funciones reutilizables para limpiar storage
 * - Evita duplicación de código
 * - Manejo de errores centralizado
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export const getCached = async (key, ttlMs) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > ttlMs) return null;
    return data;
  } catch {
    return null;
  }
};

export const setCached = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignorar errores de escritura en caché
  }
};

/**
 * Limpia todas las claves de Supabase del AsyncStorage
 *
 * @returns {Promise<number>} Número de claves eliminadas
 */
export const clearSupabaseStorage = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const supabaseKeys = allKeys.filter((key) => key.includes("supabase"));

    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      return supabaseKeys.length;
    }

    return 0;
  } catch (error) {
    console.error("[storageUtils] ❌ Error limpiando storage:", error);
    throw error;
  }
};

/**
 * Obtiene todas las claves de Supabase
 *
 * @returns {Promise<string[]>} Array de claves
 */
export const getSupabaseKeys = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter((key) => key.includes("supabase"));
  } catch (error) {
    console.error("[storageUtils] ❌ Error obteniendo claves:", error);
    return [];
  }
};

/**
 * Limpia una clave específica del storage
 *
 * @param {string} key - Clave a eliminar
 */
export const clearStorageKey = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("[storageUtils] ❌ Error eliminando clave:", error);
    throw error;
  }
};
