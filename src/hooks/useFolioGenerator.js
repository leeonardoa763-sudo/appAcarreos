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
 */

import { supabase } from "../config/supabase";

export const useFolioGenerator = (obraData) => {
  const generateFolio = async () => {
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

      // Consultar último folio - MÉTODO MEJORADO
      console.log("[useFolioGenerator] Consultando último folio...");

      let data, error;

      try {
        // Obtener TODOS los folios de la obra y filtrar en JavaScript
        const response = await supabase
          .from("vales")
          .select("folio")
          .eq("id_obra", idObra)
          .order("folio", { ascending: false });

        error = response.error;

        if (error) {
          console.error("[useFolioGenerator] Error en query:", error);
          console.error(
            "[useFolioGenerator] Error detalles:",
            JSON.stringify(error, null, 2)
          );
          throw error;
        }

        // Filtrar folios que empiecen con nuestro prefijo
        const foliosFiltrados = (response.data || []).filter((v) =>
          v.folio.startsWith(prefijoFolio)
        );

        console.log(
          "[useFolioGenerator] Folios totales en obra:",
          response.data?.length || 0
        );
        console.log(
          "[useFolioGenerator] Folios con prefijo:",
          foliosFiltrados.length
        );

        // Usar solo el primero (ya está ordenado descendente)
        data = foliosFiltrados.length > 0 ? [foliosFiltrados[0]] : [];
      } catch (queryError) {
        console.error("[useFolioGenerator] Catch en query:", queryError);
        throw new Error(`Error en consulta: ${queryError.message}`);
      }

      console.log(
        "[useFolioGenerator] Query exitosa, resultados:",
        data?.length || 0
      );

      let siguienteNumero = 1;

      if (data && data.length > 0) {
        const ultimoFolio = data[0].folio;
        console.log(
          "[useFolioGenerator] Último folio encontrado:",
          ultimoFolio
        );

        // Extraer número del folio (formato: SUFIJO-CC-00001)
        const match = ultimoFolio.match(/-(\d{5})$/);

        if (match) {
          const numeroActual = parseInt(match[1], 10);
          siguienteNumero = numeroActual + 1;
          console.log("[useFolioGenerator] Número extraído:", numeroActual);
          console.log("[useFolioGenerator] Siguiente número:", siguienteNumero);
        } else {
          console.warn(
            "[useFolioGenerator] No se pudo extraer número del folio:",
            ultimoFolio
          );
          console.log("[useFolioGenerator] Iniciando en 00001");
        }
      } else {
        console.log(
          "[useFolioGenerator] No hay folios previos, iniciando en 00001"
        );
      }

      // Formatear nuevo folio
      const numeroFormateado = siguienteNumero.toString().padStart(5, "0");
      const nuevoFolio = `${prefijoFolio}${numeroFormateado}`;

      console.log("[useFolioGenerator] Folio propuesto:", nuevoFolio);

      // Verificar que no exista (doble verificación de seguridad)
      console.log("[useFolioGenerator] Verificando unicidad del folio...");

      const { data: existente, error: errorVerif } = await supabase
        .from("vales")
        .select("folio")
        .eq("folio", nuevoFolio)
        .maybeSingle();

      if (errorVerif) {
        console.error(
          "[useFolioGenerator] Error verificando folio:",
          errorVerif
        );
        throw new Error(`Error verificando unicidad: ${errorVerif.message}`);
      }

      if (existente) {
        console.warn(
          "[useFolioGenerator] Folio duplicado detectado, incrementando..."
        );
        siguienteNumero++;
        const nuevoFolioRetry = `${prefijoFolio}${siguienteNumero
          .toString()
          .padStart(5, "0")}`;
        console.log("[useFolioGenerator] Folio alternativo:", nuevoFolioRetry);
        return nuevoFolioRetry;
      }

      console.log("[useFolioGenerator] ✅ Folio único confirmado:", nuevoFolio);
      console.log("[useFolioGenerator] ========== FIN ==========");

      return nuevoFolio;
    } catch (error) {
      console.error("[useFolioGenerator] ❌ ERROR FATAL:", error);
      console.error("[useFolioGenerator] Error tipo:", error.constructor.name);
      console.error("[useFolioGenerator] Error mensaje:", error.message);
      console.error("[useFolioGenerator] Error stack:", error.stack);

      // Lanzar el error para que se maneje arriba
      throw error;
    }
  };

  return generateFolio;
};
