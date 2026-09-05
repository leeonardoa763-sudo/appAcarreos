/**
 * hooks/useBancosDescargaRenta.js
 *
 * Sugerencias de banco de descarga ya usados en una obra, para el paso
 * "banco" de ModalRegistrarViaje (renta normal, no pipas). Lee la vista
 * bancos_descarga_renta_obra (ver migración 20260905) — no es un catálogo
 * cerrado, solo evita que el mismo banco se escriba de formas distintas
 * ("SOLEDAD" / "CALLE SOLEDAD") cuando ya se usó antes en esa obra.
 *
 * USADO EN:
 * - ModalRegistrarViaje
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";

export const useBancosDescargaRenta = (idObra) => {
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarBancos = useCallback(async () => {
    if (!idObra) {
      setBancos([]);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bancos_descarga_renta_obra")
        .select("banco_descarga, usos")
        .eq("id_obra", idObra)
        .order("usos", { ascending: false });

      if (error) throw error;
      setBancos((data || []).map((fila) => fila.banco_descarga));
    } catch (error) {
      console.error("[useBancosDescargaRenta] Error cargando bancos:", error);
      setBancos([]);
    } finally {
      setLoading(false);
    }
  }, [idObra]);

  useEffect(() => {
    cargarBancos();
  }, [cargarBancos]);

  return { bancos, loading, recargarBancos: cargarBancos };
};
