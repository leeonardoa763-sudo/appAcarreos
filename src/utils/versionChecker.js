/**
 * versionChecker.js
 *
 * Utilidades para verificar y controlar versiones de la app
 *
 * PROPÓSITO:
 * - Verificar si la versión actual de la app es válida
 * - Comparar versiones semánticas (1.0.0 vs 1.2.3)
 * - Obtener configuración de versiones desde Supabase
 * - Bloquear acceso si versión obsoleta
 *
 * FORMATO DE VERSIÓN:
 * - Usa versionamiento semántico: MAJOR.MINOR.PATCH
 * - Ejemplo: 1.0.0, 1.2.3, 2.0.0
 */

import { supabase } from "../config/supabase";
import Constants from "expo-constants";

/**
 * Obtiene la versión actual de la app desde app.json
 *
 * @returns {string} - Versión actual (ej: "1.0.0")
 */
export const getCurrentAppVersion = () => {
  return Constants.expoConfig?.version || "1.0.0";
};

/**
 * Compara dos versiones semánticas
 *
 * @param {string} version1 - Primera versión (ej: "1.0.0")
 * @param {string} version2 - Segunda versión (ej: "1.2.0")
 * @returns {number} - Retorna: -1 si v1 < v2, 0 si v1 === v2, 1 si v1 > v2
 *
 * @example
 * compareVersions("1.0.0", "1.2.0") // -1 (1.0.0 es menor)
 * compareVersions("1.2.0", "1.0.0") // 1 (1.2.0 es mayor)
 * compareVersions("1.0.0", "1.0.0") // 0 (son iguales)
 */
export const compareVersions = (version1, version2) => {
  try {
    // Separar versiones en partes [major, minor, patch]
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    // Comparar cada parte
    for (let i = 0; i < 3; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0; // Son iguales
  } catch (error) {
    console.error("[versionChecker] Error comparando versiones:", error);
    return 0; // En caso de error, asume que son iguales
  }
};

/**
 * Verifica si una versión es mayor o igual a otra
 *
 * @param {string} currentVersion - Versión actual
 * @param {string} requiredVersion - Versión requerida
 * @returns {boolean} - true si currentVersion >= requiredVersion
 */
export const isVersionValid = (currentVersion, requiredVersion) => {
  const comparison = compareVersions(currentVersion, requiredVersion);
  return comparison >= 0; // Mayor o igual
};

/**
 * Obtiene la configuración de versiones desde Supabase
 *
 * @returns {Promise<Object|null>} - Configuración de versiones o null si hay error
 *
 * Retorna:
 * {
 *   version_minima: "1.0.0",
 *   version_actual: "1.2.0",
 *   download_url: "https://...",
 *   mensaje_actualizacion: "...",
 *   activo: true
 * }
 */
export const getVersionConfig = async () => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 5000),
    );

    const queryPromise = supabase
      .from("app_config")
      .select("*")
      .eq("activo", true)
      .single();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error("[versionChecker] Error obteniendo configuración:", error);
      return null;
    }

    return data;
  } catch (error) {
    if (error.message === "TIMEOUT") {
      console.warn(
        "[versionChecker] ⏱️ Timeout al obtener config, permitiendo acceso",
      );
    } else {
      console.error("[versionChecker] Error en getVersionConfig:", error);
    }
    return null;
  }
};

/**
 * Verifica si la app necesita actualización
 *
 * @returns {Promise<Object>} - Resultado de la verificación
 *
 * Retorna:
 * {
 *   needsUpdate: boolean,        // true si necesita actualización forzada
 *   isOutdated: boolean,          // true si hay versión más nueva disponible
 *   currentVersion: string,       // Versión actual de la app
 *   minimumVersion: string,       // Versión mínima requerida
 *   latestVersion: string,        // Última versión disponible
 *   downloadUrl: string,          // URL de descarga
 *   message: string,              // Mensaje personalizado
 *   configError: boolean          // true si hubo error obteniendo config
 * }
 */
export const checkAppVersion = async () => {
  const currentVersion = getCurrentAppVersion();


  // Obtener configuración de versiones
  const config = await getVersionConfig();

  // Si no se pudo obtener la configuración, permitir continuar
  if (!config) {
    console.warn(
      "[versionChecker] ⚠️ No se pudo obtener configuración, permitiendo acceso",
    );
    return {
      needsUpdate: false,
      isOutdated: false,
      currentVersion,
      minimumVersion: null,
      latestVersion: null,
      downloadUrl: null,
      message: null,
      configError: true,
    };
  }

  const {
    version_minima,
    version_actual,
    download_url,
    mensaje_actualizacion,
  } = config;

  // Verificar si versión actual es válida (mayor o igual a mínima)
  const needsUpdate = !isVersionValid(currentVersion, version_minima);

  // Verificar si hay versión más nueva disponible
  const isOutdated = compareVersions(currentVersion, version_actual) < 0;


  return {
    needsUpdate,
    isOutdated,
    currentVersion,
    minimumVersion: version_minima,
    latestVersion: version_actual,
    downloadUrl: download_url,
    message: mensaje_actualizacion || "Hay una nueva versión disponible.",
    configError: false,
  };
};

/**
 * Formatea un string de versión para mostrar
 *
 * @param {string} version - Versión (ej: "1.0.0")
 * @returns {string} - Versión formateada (ej: "v1.0.0")
 */
export const formatVersion = (version) => {
  return version ? `v${version}` : "Desconocida";
};
