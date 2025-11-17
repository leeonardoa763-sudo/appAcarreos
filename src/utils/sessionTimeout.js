/**
 * sessionTimeout.js
 *
 * Utilidades para manejar timeouts de sesión y carga
 *
 * PROPÓSITO:
 * - Prevenir sesiones colgadas por problemas de red
 * - Cerrar automáticamente si la carga tarda demasiado
 * - Proporcionar feedback al usuario sobre el estado
 *
 * CONFIGURACIÓN:
 * - INITIAL_LOAD_TIMEOUT: 15 segundos para carga inicial
 * - LOGIN_TIMEOUT: 10 segundos para proceso de login
 * - PROFILE_FETCH_TIMEOUT: 8 segundos para cargar perfil
 */

// Tiempos de timeout en milisegundos
export const TIMEOUT_DURATIONS = {
  INITIAL_LOAD: 15000, // 15 segundos para carga inicial de app
  LOGIN: 10000, // 10 segundos para login
  PROFILE_FETCH: 8000, // 8 segundos para cargar perfil desde BD
  SESSION_CHECK: 5000, // 5 segundos para verificar sesión existente
};

/**
 * Crea un timeout que ejecuta un callback después de cierto tiempo
 *
 * @param {Function} callback - Función a ejecutar cuando expire el timeout
 * @param {number} duration - Duración en milisegundos
 * @returns {Object} - Objeto con métodos clear() y isActive()
 */
export const createTimeout = (callback, duration) => {
  let timeoutId = null;
  let isCleared = false;

  timeoutId = setTimeout(() => {
    if (!isCleared) {
      callback();
    }
  }, duration);

  return {
    // Cancela el timeout
    clear: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        isCleared = true;
      }
    },

    // Verifica si el timeout sigue activo
    isActive: () => !isCleared,
  };
};

/**
 * Ejecuta una promesa con timeout
 * Si la promesa tarda más que el timeout, se rechaza automáticamente
 *
 * @param {Promise} promise - Promesa a ejecutar
 * @param {number} timeout - Tiempo máximo en milisegundos
 * @param {string} errorMessage - Mensaje de error personalizado
 * @returns {Promise} - Promesa que se resuelve o rechaza según el timeout
 */
export const promiseWithTimeout = (
  promise,
  timeout,
  errorMessage = "Operación timeout"
) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeout);
    }),
  ]);
};

/**
 * Crea un timeout de sesión con estado observable
 * Útil para mostrar contadores en la UI
 *
 * @param {Function} onTimeout - Callback cuando expire
 * @param {Function} onTick - Callback cada segundo (recibe segundos restantes)
 * @param {number} duration - Duración total en milisegundos
 * @returns {Object} - Objeto con métodos clear() y getRemainingTime()
 */
export const createObservableTimeout = (onTimeout, onTick, duration) => {
  let intervalId = null;
  let timeoutId = null;
  let startTime = Date.now();
  let isCleared = false;

  const durationSeconds = Math.floor(duration / 1000);

  // Actualizar cada segundo
  intervalId = setInterval(() => {
    if (isCleared) return;

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    const remainingSeconds = Math.ceil(remaining / 1000);

    if (onTick && remainingSeconds > 0) {
      onTick(remainingSeconds);
    }
  }, 1000);

  // Timeout principal
  timeoutId = setTimeout(() => {
    if (!isCleared && onTimeout) {
      onTimeout();
    }
    if (intervalId) {
      clearInterval(intervalId);
    }
  }, duration);

  return {
    clear: () => {
      isCleared = true;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    },

    getRemainingTime: () => {
      if (isCleared) return 0;
      const elapsed = Date.now() - startTime;
      return Math.max(0, duration - elapsed);
    },

    isActive: () => !isCleared,
  };
};

/**
 * Formatea milisegundos a texto legible
 *
 * @param {number} ms - Milisegundos
 * @returns {string} - Texto formateado (ej: "15s", "1m 30s")
 */
export const formatTimeout = (ms) => {
  const seconds = Math.ceil(ms / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
};
