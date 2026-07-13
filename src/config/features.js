/**
 * config/features.js
 *
 * Flags para activar/desactivar funcionalidades según el entorno
 *
 * BLUETOOTH_ENABLED:
 * - false: Solo PDF (desarrollo en iPhone / Expo Go)
 * - true: Bluetooth activo (build Android con impresora física)
 *
 * IS_WEB:
 * - true cuando la app corre en el bundle web (react-native-web).
 * - Usado para ocultar funciones fuera de alcance en la v1 web:
 *   imprimir ticket, generar/compartir PDF, registrar viaje, completar vale.
 *
 * HIDE_ON_WEB:
 * - Lo que realmente controla si se ocultan esas funciones fuera de alcance.
 * - TEMPORAL: puesto en false a petición del usuario (2026-07-09) para probar
 *   la app completa (sin nada oculto) desde un iPhone y ver qué falla de verdad
 *   en web. Volver a IS_WEB cuando termine la prueba.
 */
import { Platform } from "react-native";

export const BLUETOOTH_ENABLED = true;

export const IS_WEB = Platform.OS === "web";

const MOSTRAR_TODO_EN_WEB = true; // TEMPORAL — ver nota HIDE_ON_WEB arriba

export const HIDE_ON_WEB = IS_WEB && !MOSTRAR_TODO_EN_WEB;
