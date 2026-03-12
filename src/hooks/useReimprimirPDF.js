// 1. React
import { useState, useEffect, useCallback } from "react";

// 2. Third party
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIJO_CLAVE = "reimpresion_pdf_";

/**
 * Hook para controlar la reimpresión única de PDF por vale.
 *
 * Persiste en AsyncStorage con clave: reimpresion_pdf_{id_vale}
 * Una vez marcado como reimprimido, el botón queda deshabilitado
 * incluso si se cierra y reabre el modal.
 *
 * @param {string|number} idVale - ID del vale
 * @returns {{ yaReimprimio: boolean, loading: boolean, marcarReimprimido: Function }}
 */
export const useReimprimirPDF = (idVale) => {
  const [yaReimprimio, setYaReimprimio] = useState(false);
  const [loading, setLoading] = useState(true);

  const clave = idVale ? `${PREFIJO_CLAVE}${idVale}` : null;

  // Verificar si ya se reimprimió al montar o cuando cambia el vale
  useEffect(() => {
    if (!clave) {
      setLoading(false);
      return;
    }

    const verificar = async () => {
      try {
        const valor = await AsyncStorage.getItem(clave);
        setYaReimprimio(valor === "true");
      } catch (error) {
        // Si falla la lectura, permitir la reimpresión por seguridad
        setYaReimprimio(false);
      } finally {
        setLoading(false);
      }
    };

    verificar();
  }, [clave]);

  // Marcar como reimprimido en AsyncStorage
  const marcarReimprimido = useCallback(async () => {
    if (!clave) return;

    try {
      await AsyncStorage.setItem(clave, "true");
      setYaReimprimio(true);
    } catch (error) {
      // Aunque falle el guardado, deshabilitar en memoria para esta sesión
      setYaReimprimio(true);
    }
  }, [clave]);

  return { yaReimprimio, loading, marcarReimprimido };
};
