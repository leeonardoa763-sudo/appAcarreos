/**
 * hooks/useFolioGenerator.js
 *
 * Hook para generar folios únicos por obra
 *
 * PROPÓSITO:
 * - Generar folios con formato: SUFIJO-CC-NUMERO
 * - Numeración consecutiva por obra
 * - Validación de duplicados
 *
 * USADO EN:
 * - ValeRentaScreen
 * - ValeMaterialScreen
 *
 * EJEMPLO DE USO:
 * const generateFolio = useFolioGenerator(obraData);
 * const folio = await generateFolio();
 */

import { supabase } from "../config/supabase";

export const useFolioGenerator = (obraData) => {
  const generateFolio = async () => {
    try {
      if (!obraData) {
        throw new Error("No hay datos de obra disponibles");
      }

      const sufijo = obraData.empresas?.sufijo || "XX";
      const cc = obraData.cc || 0;
      const prefijoFolio = `${sufijo}-${cc}-`;

      console.log("Buscando último folio con prefijo:", prefijoFolio);

      const { data, error } = await supabase
        .from("vales")
        .select("folio")
        .eq("id_obra", obraData.id_obra)
        .like("folio", `${prefijoFolio}%`)
        .order("folio", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error consultando folios:", error);
        throw error;
      }

      let siguienteNumero = 1;

      if (data && data.length > 0) {
        const ultimoFolio = data[0].folio;
        console.log("Último folio encontrado:", ultimoFolio);

        const match = ultimoFolio.match(/-(\d{5})$/);

        if (match) {
          const numeroActual = parseInt(match[1], 10);
          siguienteNumero = numeroActual + 1;
          console.log(
            "Número actual:",
            numeroActual,
            "- Siguiente:",
            siguienteNumero
          );
        }
      } else {
        console.log("No hay folios previos, iniciando en 00001");
      }

      const numeroFormateado = siguienteNumero.toString().padStart(5, "0");
      const nuevoFolio = `${prefijoFolio}${numeroFormateado}`;

      console.log("Folio generado:", nuevoFolio);

      const { data: existente } = await supabase
        .from("vales")
        .select("folio")
        .eq("folio", nuevoFolio)
        .maybeSingle();

      if (existente) {
        console.warn("El folio ya existe, incrementando número");
        siguienteNumero++;
        const nuevoFolioRetry = `${prefijoFolio}${siguienteNumero
          .toString()
          .padStart(5, "0")}`;
        console.log("Folio alternativo:", nuevoFolioRetry);
        return nuevoFolioRetry;
      }

      return nuevoFolio;
    } catch (error) {
      console.error("Error generando folio:", error);

      const timestamp = Date.now().toString().slice(-8);
      const fallbackFolio = `TEMP-${timestamp}`;
      console.log("Usando folio temporal:", fallbackFolio);
      return fallbackFolio;
    }
  };

  return generateFolio;
};
