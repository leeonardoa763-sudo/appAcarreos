// 1. React y hooks
import { useState, useCallback } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Local - Config
import { supabase } from "../config/supabase";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_VALES_ACTIVOS = 2;

const ERRORES = {
  QR_VACIO: "El código QR escaneado está vacío.",
  VEHICULO_NO_FOUND: "No se encontró ningún vehículo con ese código QR.",
  LIMITE_ALCANZADO: `Este vehículo ya tiene ${MAX_VALES_ACTIVOS} vales activos. No puede recibir más.`,
  SIN_VALES: "No hay vales en proceso disponibles para asignar.",
  ASIGNACION_FALLO: "No se pudo asignar el vehículo al vale. Intenta de nuevo.",
  CARGA_FALLO: "No se pudieron cargar los vales disponibles.",
};

/**
 * useVehiculoQR
 *
 * Cerebro de la funcionalidad de asignación de vehículos por QR.
 *
 * FLUJO:
 * 1. Escanear QR del vehículo → buscarVehiculoPorQR(qr_uid)
 * 2. Verificar cuántos vales activos tiene → vehiculos_vales_activos (vista)
 * 3. Si tiene < MAX → cargar lista de vales en_proceso sin vehículo
 * 4. El usuario selecciona un vale → asignarVehiculo(id_vale)
 * 5. Se escribe id_vehiculo + id_operador (sugerido) en el vale
 *
 * USADO EN:
 * - (próximo) AsignacionVehiculoScreen o modal equivalente
 */
const useVehiculoQR = () => {
  // ─── Estado ───────────────────────────────────────────────────────────────

  const [vehiculo, setVehiculo] = useState(null);
  const [valesActivos, setValesActivos] = useState(0);
  const [valesDisponibles, setValesDisponibles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [error, setError] = useState(null);
  const [foliosActivos, setFoliosActivos] = useState([]);

  // ─── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setVehiculo(null);
    setValesActivos(0);
    setValesDisponibles([]);
    setError(null);
    setCargando(false);
    setAsignando(false);
    setFoliosActivos([]);
  }, []);

  // ─── 1. Buscar vehículo por QR ────────────────────────────────────────────

  /**
   * Recibe el string crudo del QR escaneado (ej. "VH-ABC123D")
   * Consulta vehiculos + vista vehiculos_vales_activos
   * Si pasa la validación de límite, carga los vales disponibles
   */
  const buscarVehiculoPorQR = useCallback(
    async (qrUid) => {
      if (!qrUid?.trim()) {
        setError(ERRORES.QR_VACIO);
        Alert.alert("QR inválido", ERRORES.QR_VACIO);
        return;
      }

      console.log("[useVehiculoQR] Buscando vehículo con qr_uid:", qrUid);

      try {
        setCargando(true);
        setError(null);
        setVehiculo(null);
        setValesActivos(0);
        setValesDisponibles([]);

        // ── Paso A: datos del vehículo + operador sugerido ──────────────────
        const { data: vehiculoData, error: errorVehiculo } = await supabase
          .from("vehiculos")
          .select(
            `
            id_vehiculo,
            placas,
            capacidad_m3,
            qr_uid,
            id_operador_sugerido,
            activo,
            operador_sugerido:operadores!id_operador_sugerido (
                id_operador,
                nombre_completo
            )
            `,
          )
          .eq("qr_uid", qrUid.trim())
          .eq("activo", true)
          .maybeSingle();

        if (errorVehiculo) {
          console.error(
            "[useVehiculoQR] Error al buscar vehículo:",
            errorVehiculo.message,
          );
          throw new Error(
            `Error BD al buscar vehículo: ${errorVehiculo.message}`,
          );
        }

        if (!vehiculoData) {
          console.warn(
            "[useVehiculoQR] Ningún vehículo encontrado para qr_uid:",
            qrUid,
          );
          setError(ERRORES.VEHICULO_NO_FOUND);
          Alert.alert("Vehículo no encontrado", ERRORES.VEHICULO_NO_FOUND);
          return;
        }

        console.log(
          "[useVehiculoQR] Vehículo encontrado:",
          vehiculoData.placas,
          "| operador sugerido:",
          vehiculoData.operador_sugerido?.nombre_completo ?? "sin asignar",
        );

        // ── Paso B: cuántos vales activos tiene desde la vista ───────────────
        const { data: vistaData, error: errorVista } = await supabase
          .from("vehiculos_vales_activos")
          .select("id_vehiculo, vales_activos, folios_activos")
          .eq("id_vehiculo", vehiculoData.id_vehiculo)
          .maybeSingle();

        if (errorVista) {
          console.error(
            "[useVehiculoQR] Error consultando vista:",
            errorVista.message,
          );
          throw new Error(
            `Error BD en vista de activos: ${errorVista.message}`,
          );
        }

        const totalActivos = vistaData?.vales_activos ?? 0;
        console.log("[useVehiculoQR] Vales activos actuales:", totalActivos);
        const folios = vistaData?.folios_activos ?? [];
        setFoliosActivos(Array.isArray(folios) ? folios : []);
        console.log("[useVehiculoQR] Folios activos del vehículo:", folios);

        setVehiculo(vehiculoData);
        setValesActivos(totalActivos);

        // ── Paso C: validar límite ───────────────────────────────────────────
        if (totalActivos >= MAX_VALES_ACTIVOS) {
          console.warn(
            "[useVehiculoQR] Límite de vales activos alcanzado:",
            totalActivos,
          );
          setError(ERRORES.LIMITE_ALCANZADO);
          // No lanzamos Alert aquí — la UI mostrará el estado bloqueado
          return;
        }

        // ── Paso D: cargar vales disponibles ────────────────────────────────
        await _cargarValesDisponibles();
      } catch (err) {
        console.error(
          "[useVehiculoQR] buscarVehiculoPorQR falló:",
          err.message,
        );
        setError(err.message);
        Alert.alert(
          "Error al buscar vehículo",
          "Ocurrió un problema al consultar la base de datos. Intenta de nuevo.",
          [{ text: "OK" }],
        );
      } finally {
        setCargando(false);
      }
    },
    [_cargarValesDisponibles],
  );

  // ─── 2. Cargar vales en_proceso sin vehículo ─────────────────────────────

  /**
   * Trae todos los vales en_proceso que no tienen vehículo asignado.
   * Se filtra por id_obra del usuario activo (RLS lo maneja automáticamente).
   */
  const _cargarValesDisponibles = useCallback(async () => {
    console.log("[useVehiculoQR] Cargando vales disponibles...");

    try {
      const { data, error: errorVales } = await supabase
        .from("vales")
        .select(
          `
          id_vale,
          folio,
          tipo_vale,
          estado,
          id_operador,
          id_vehiculo,
          fecha_creacion,
          obras ( obra, cc )
        `,
        )
        .eq("estado", "en_proceso")
        .is("id_vehiculo", null)
        .order("fecha_creacion", { ascending: false });

      if (errorVales) {
        console.error(
          "[useVehiculoQR] Error cargando vales disponibles:",
          errorVales.message,
        );
        throw new Error(`Error BD al cargar vales: ${errorVales.message}`);
      }

      console.log(
        "[useVehiculoQR] Vales disponibles encontrados:",
        data?.length ?? 0,
      );
      setValesDisponibles(data ?? []);
    } catch (err) {
      console.error(
        "[useVehiculoQR] _cargarValesDisponibles falló:",
        err.message,
      );
      setError(ERRORES.CARGA_FALLO);
      Alert.alert("Error al cargar vales", ERRORES.CARGA_FALLO, [
        { text: "OK" },
      ]);
    }
  }, []);

  // ─── 3. Asignar vehículo a un vale ───────────────────────────────────────

  /**
   * Escribe id_vehiculo e id_operador (sugerido) en el vale seleccionado.
   * Verifica antes de escribir que el límite sigue sin superarse
   * (otro CHECADOR pudo asignar el mismo vehículo entre medias).
   *
   * @param {number} idVale  — vale destino
   * @returns {boolean}      — true si asignó correctamente
   */
  const asignarVehiculo = useCallback(
    async (idVale) => {
      if (!vehiculo) {
        Alert.alert("Error", "No hay vehículo seleccionado. Escanea de nuevo.");
        return false;
      }
      if (!idVale) {
        Alert.alert("Error", "Selecciona un vale antes de asignar.");
        return false;
      }

      console.log(
        "[useVehiculoQR] Iniciando asignación — vale:",
        idVale,
        "| vehículo:",
        vehiculo.placas,
      );

      try {
        setAsignando(true);
        setError(null);

        // ── Re-verificar límite justo antes de escribir ──────────────────────
        const { data: vistaCheck, error: errorCheck } = await supabase
          .from("vehiculos_vales_activos")
          .select("vales_activos")
          .eq("id_vehiculo", vehiculo.id_vehiculo)
          .maybeSingle();

        if (errorCheck) {
          console.error(
            "[useVehiculoQR] Error en re-verificación:",
            errorCheck.message,
          );
          throw new Error(
            `Error BD re-verificando límite: ${errorCheck.message}`,
          );
        }

        const activosActuales = vistaCheck?.vales_activos ?? 0;

        if (activosActuales >= MAX_VALES_ACTIVOS) {
          console.warn(
            "[useVehiculoQR] Límite superado en re-verificación:",
            activosActuales,
          );
          setValesActivos(activosActuales);
          setError(ERRORES.LIMITE_ALCANZADO);
          Alert.alert(
            "No disponible",
            "Este vehículo acaba de recibir otro vale. Ya alcanzó el límite máximo.",
            [{ text: "Entendido" }],
          );
          return false;
        }

        // ── Escribir asignación ──────────────────────────────────────────────
        const payload = {
          id_vehiculo: vehiculo.id_vehiculo,
          id_operador: vehiculo.id_operador_sugerido ?? null,
        };

        console.log("[useVehiculoQR] Payload asignación:", payload);

        const { error: errorUpdate } = await supabase
          .from("vales")
          .update(payload)
          .eq("id_vale", idVale)
          .eq("estado", "en_proceso") // guardia extra: no tocar vales que ya cambiaron
          .is("id_vehiculo", null); // guardia extra: no sobrescribir asignación existente

        if (errorUpdate) {
          console.error(
            "[useVehiculoQR] Error en UPDATE:",
            errorUpdate.message,
          );
          throw new Error(`Error BD al asignar: ${errorUpdate.message}`);
        }

        console.log("[useVehiculoQR] Asignación exitosa — vale:", idVale);

        // Refrescar el conteo de activos en estado local
        setValesActivos(activosActuales + 1);

        // Quitar el vale recién asignado de la lista disponible
        setValesDisponibles((prev) => prev.filter((v) => v.id_vale !== idVale));

        return true;
      } catch (err) {
        console.error("[useVehiculoQR] asignarVehiculo falló:", err.message);
        setError(ERRORES.ASIGNACION_FALLO);
        Alert.alert("Error al asignar", ERRORES.ASIGNACION_FALLO, [
          { text: "OK" },
        ]);
        return false;
      } finally {
        setAsignando(false);
      }
    },
    [vehiculo],
  );

  // ─── API pública ──────────────────────────────────────────────────────────

  return {
    // Estado
    vehiculo,
    valesActivos,
    valesDisponibles,
    cargando,
    asignando,
    error,
    limiteAlcanzado: valesActivos >= MAX_VALES_ACTIVOS,
    foliosActivos,
    // Acciones
    buscarVehiculoPorQR,
    asignarVehiculo,
    reset,
  };
};

export default useVehiculoQR;
