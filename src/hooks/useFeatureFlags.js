/**
 * hooks/useFeatureFlags.js
 *
 * Hook para leer los feature flags del perfil del usuario.
 * Los flags se leen desde userProfile.feature_flags (columna JSONB en tabla persona).
 * Si un flag no existe en el perfil, se usa el valor por defecto de featureFlags.js.
 *
 * PROPÓSITO:
 * - Centralizar la lectura de flags por usuario
 * - Combinar flags de Supabase con defaults locales como respaldo
 * - Evitar que la app se rompa si un flag no está definido en BD
 *
 * USO:
 * const { flags } = useFeatureFlags();
 * if (flags.TIPO3_FLUJO_DOS_PASOS) { ... }
 *
 * PARA CAMBIAR FLAGS:
 * Editar directamente en Supabase dashboard con SQL:
 * UPDATE persona
 * SET feature_flags = feature_flags || '{"tipo3_flujo_dos_pasos": true}'::jsonb
 * WHERE id_persona = X;
 */

import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { FEATURE_FLAGS_DEFAULTS } from "../config/featureFlags";

export const useFeatureFlags = () => {
  const { userProfile } = useAuth();

  const flags = useMemo(() => {
    // Leer flags desde el perfil del usuario en Supabase
    const flagsFromDB = userProfile?.feature_flags || {};

    // Combinar: DB tiene prioridad, defaults como respaldo
    return {
      TIPO2_GENERAR_PDF_ROJO:
        flagsFromDB.tipo2_generar_pdf_rojo ??
        FEATURE_FLAGS_DEFAULTS.TIPO2_GENERAR_PDF_ROJO,
    };
  }, [userProfile?.feature_flags]);

  return { flags };
};
