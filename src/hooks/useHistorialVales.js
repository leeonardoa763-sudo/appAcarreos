/**
 * hooks/useHistorialVales.js
 *
 * Orquesta la pantalla HistorialValesScreen: corre los filtros y decide que
 * hacer con el resultado (verlo en la app o exportarlo a CSV).
 *
 * Los dos caminos usan la misma consulta (fetchViajesHistorial), asi que la
 * lista y el CSV nunca pueden mostrar conjuntos distintos.
 *
 * USADO EN:
 * - HistorialValesScreen
 */

import { useState, useCallback } from "react";

import crossAlert from "../utils/crossAlert";
import {
  fetchViajesHistorial,
  foliosDesdeFilas,
  MAX_VALES,
} from "./exportHelpers/historialQueries";
import {
  transformHistorialData,
  HISTORIAL_HEADERS,
  nombreArchivoHistorial,
} from "./exportHelpers/historialConverter";
import { convertToCSV } from "./exportHelpers/csvConverter";
import { saveAndShareCSV } from "./exportHelpers/fileSystemUtils";

export const useHistorialVales = (obras = [], userRole) => {
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [folios, setFolios] = useState([]);

  // Declarado antes de los useCallback que lo usan: el build web aplica TDZ
  // estricta y truena si se referencia una const declarada mas abajo.
  const construirFiltros = useCallback(
    (filtros) => ({
      ...filtros,
      obrasIds: filtros.obraId
        ? [filtros.obraId]
        : obras.map((obra) => obra.id).filter(Boolean),
      userRole,
    }),
    [obras, userRole],
  );

  const avisarTruncado = useCallback(() => {
    crossAlert(
      "Resultado incompleto",
      `Se alcanzo el limite de ${MAX_VALES} vales. Acota el periodo o filtra por obra para ver el resto.`,
    );
  }, []);

  /**
   * Carga los folios para verlos en la app.
   * @returns {Promise<boolean>} true si hubo resultados
   */
  const cargarLista = useCallback(
    async (filtros) => {
      try {
        setCargando(true);
        const parametros = construirFiltros(filtros);

        if (parametros.obrasIds.length === 0) {
          crossAlert("Sin obras", "No tienes obras asignadas.");
          return false;
        }

        const { filas, truncado } = await fetchViajesHistorial(parametros);

        if (filas.length === 0) {
          setFolios([]);
          crossAlert(
            "Sin resultados",
            "Ningun vale con viajes registrados coincide con los filtros. Prueba a ampliar el periodo o quitar filtros.",
          );
          return false;
        }

        setFolios(foliosDesdeFilas(filas));
        if (truncado) avisarTruncado();
        return true;
      } catch (error) {
        console.error("[useHistorialVales] Error cargando lista:", error);
        crossAlert(
          "Error",
          `No se pudo cargar el historial.\n\nDetalle: ${error.message}`,
        );
        return false;
      } finally {
        setCargando(false);
      }
    },
    [construirFiltros, avisarTruncado],
  );

  /**
   * Genera el CSV y abre el menu de compartir (nativo) o lo descarga (web).
   * @returns {Promise<boolean>} true si se genero el archivo
   */
  const exportarCSV = useCallback(
    async (filtros) => {
      try {
        setExportando(true);
        const parametros = construirFiltros(filtros);

        if (parametros.obrasIds.length === 0) {
          crossAlert("Sin obras", "No tienes obras asignadas.");
          return false;
        }

        const { filas, totalVales, truncado } =
          await fetchViajesHistorial(parametros);

        if (filas.length === 0) {
          crossAlert(
            "Sin datos que exportar",
            "Ningun vale con viajes registrados coincide con los filtros. Prueba a ampliar el periodo o quitar filtros.",
          );
          return false;
        }

        const csv = convertToCSV(
          transformHistorialData(filas),
          HISTORIAL_HEADERS,
        );
        const nombre = nombreArchivoHistorial(
          parametros.fechaDesde,
          parametros.fechaHasta,
        );

        await saveAndShareCSV(csv, nombre);

        if (truncado) {
          avisarTruncado();
        } else {
          crossAlert(
            "Exportacion lista",
            `Se exportaron ${filas.length} viajes de ${totalVales} vales.\n\nArchivo: ${nombre}`,
          );
        }
        return true;
      } catch (error) {
        console.error("[useHistorialVales] Error exportando:", error);
        crossAlert(
          "Error",
          `No se pudo generar el archivo.\n\nDetalle: ${error.message}`,
        );
        return false;
      } finally {
        setExportando(false);
      }
    },
    [construirFiltros, avisarTruncado],
  );

  const limpiarLista = useCallback(() => setFolios([]), []);

  return { cargando, exportando, folios, cargarLista, exportarCSV, limpiarLista };
};
