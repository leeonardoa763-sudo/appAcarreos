/**
 * hooks/useFolioGenerator.js
 *
 * Hook para generar folios únicos por obra
 */

import { supabase } from "../config/supabase";

export const useFolioGenerator = () => {
  const generateFolio = async (obraData) => {
    console.log("[useFolioGenerator] ========== INICIO ==========");

    try {
      // Validación de obra
      if (!obraData) {
        console.error("[useFolioGenerator] No hay obraData");
        throw new Error("No hay datos de obra disponibles");
      }

      if (!obraData.empresas) {
        console.error("[useFolioGenerator] obraData sin empresas:", obraData);
        throw new Error("Los datos de obra no tienen empresa asociada");
      }

      const sufijo = obraData.empresas?.sufijo;
      const cc = obraData.cc;
      const idObra = obraData.id_obra;

      console.log("[useFolioGenerator] Datos de obra:", {
        sufijo,
        cc,
        idObra,
      });

      if (!sufijo) {
        console.error("[useFolioGenerator] Sufijo no disponible");
        throw new Error("La empresa no tiene sufijo configurado");
      }

      if (!cc && cc !== 0) {
        console.error("[useFolioGenerator] CC no disponible");
        throw new Error("La obra no tiene CC configurado");
      }

      if (!idObra) {
        console.error("[useFolioGenerator] ID obra no disponible");
        throw new Error("ID de obra no disponible");
      }

      const prefijoFolio = `${sufijo}-${cc}-`;
      console.log("[useFolioGenerator] Prefijo generado:", prefijoFolio);

      // Consultar último folio
      console.log("[useFolioGenerator] Consultando último folio...");

      const { data, error } = await supabase

        .from("vales")
        .select("folio")
        .eq("id_obra", idObra)
        .ilike("folio", `${prefijoFolio}%`)
        .order("folio", { ascending: false })
        .limit(1);

      if (error) {
        console.error("[useFolioGenerator] Error consultando folios:", error);
        throw error;
      }

      let nuevoNumero = 1;

      if (data && data.length > 0) {
        const ultimoFolio = data[0].folio;
        console.log(
          "[useFolioGenerator] Último folio encontrado:",
          ultimoFolio,
        );

        // Extraer el número del folio (última parte después del último guion)
        const partes = ultimoFolio.split("-");
        if (partes.length >= 3) {
          const ultimoNumero = parseInt(partes[partes.length - 1], 10);
          if (!isNaN(ultimoNumero)) {
            nuevoNumero = ultimoNumero + 1;
            console.log(
              "[useFolioGenerator] Último número:",
              ultimoNumero,
              "→ Nuevo número:",
              nuevoNumero,
            );
          }
        }
      } else {
        console.log(
          "[useFolioGenerator] No hay folios previos, iniciando en 00001",
        );
      }

      // Formatear número con 5 dígitos (padding con ceros)
      const numeroFormateado = String(nuevoNumero).padStart(5, "0");
      const folioGenerado = `${prefijoFolio}${numeroFormateado}`;

      console.log("[useFolioGenerator] Folio generado:", folioGenerado);
      console.log("[useFolioGenerator] ========== FIN ==========");

      return folioGenerado;
    } catch (error) {
      console.error("[useFolioGenerator] Error:", error);
      throw error;
    }
  };

  return { generateFolio };
};
