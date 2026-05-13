/**
 * config/featureFlags.js
 *
 * Flags para controlar el comportamiento del flujo de vales de material.
 * Cambiar un valor aquí afecta todo el sistema sin modificar lógica de negocio.
 *
 * FLUJO POR TIPO DE MATERIAL:
 * - Tipo 1 (Pétreos): Siempre flujo normal (copia roja → completar → copia blanca)
 * - Tipo 2 (Carpeta asfáltica): Crea en en_proceso, sin PDF al crear
 * - Tipo 3 (Tepetate): Crea directo en emitido, genera PDF blanco inmediato
 */

/**
 * config/featureFlags.js
 *
 * Valores por DEFECTO de los feature flags.
 * Estos valores se usan como respaldo cuando el perfil del usuario
 * no tiene definido un flag en la columna feature_flags de la tabla persona.
 *
 * IMPORTANTE:
 * No modifiques estos valores para controlar el comportamiento por usuario.
 * Para cambiar flags de un usuario específico, edita directamente en Supabase:
 *
 * UPDATE persona
 * SET feature_flags = feature_flags || '{"tipo3_flujo_dos_pasos": true}'::jsonb
 * WHERE id_persona = X;
 *
 * FLUJO POR TIPO DE MATERIAL:
 * - Tipo 1 (Pétreos): Siempre flujo normal, sin cambios
 * - Tipo 2 (Carpeta asfáltica): Crea en en_proceso, sin PDF al crear
 * - Tipo 3 (Tepetate): Crea directo en emitido, genera PDF blanco inmediato
 */

export const FEATURE_FLAGS_DEFAULTS = {
  /**
   * Tipo 2 - Carpeta Asfáltica
   *
   * true  → Genera PDF rojo al crear (flujo original de dos pasos)
   * false → NO genera PDF al crear, queda en en_proceso para completar después
   */
  TIPO2_GENERAR_PDF_ROJO: false,
};
