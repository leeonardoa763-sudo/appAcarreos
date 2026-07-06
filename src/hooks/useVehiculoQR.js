// 1. React y hooks
import { useState, useCallback } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Local - Config
import { supabase } from "../config/supabase";
import { esDentroJornada } from "../utils/jornadaLaboral";
import { useAuth } from "./useAuth";

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
const useVehiculoQR = ({ expectedSindicatoId = null } = {}) => {
  const { userRole } = useAuth();
  const esPlantaAsfaltos = userRole === "Planta de Asfaltos";
  const esAdministrador = userRole === "Administrador";

  // ─── Estado ───────────────────────────────────────────────────────────────

  const [vehiculo, setVehiculo] = useState(null);
  const [valesActivos, setValesActivos] = useState(0);
  const [valesDisponibles, setValesDisponibles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [error, setError] = useState(null);
  const [foliosActivos, setFoliosActivos] = useState([]);
  const [asignacionActual, setAsignacionActual] = useState(null);
  const [operadoresSindicato, setOperadoresSindicato] = useState([]);

  // ─── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setVehiculo(null);
    setValesActivos(0);
    setValesDisponibles([]);
    setError(null);
    setCargando(false);
    setAsignando(false);
    setFoliosActivos([]);
    setAsignacionActual(null);
    setOperadoresSindicato([]);
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
           id_sindicato,
            sindicatos:id_sindicato ( sindicato ),
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

        if (
          expectedSindicatoId != null &&
          vehiculoData.id_sindicato !== expectedSindicatoId
        ) {
          setError(
            "El vehículo escaneado no pertenece al sindicato seleccionado.",
          );
          Alert.alert(
            "Sindicato no coincide",
            "Escanea un vehículo del sindicato seleccionado.",
          );
          return;
        }

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

        const folios = vistaData?.folios_activos ?? [];
        setFoliosActivos(Array.isArray(folios) ? folios : []);

        setVehiculo(vehiculoData);
        setValesActivos(totalActivos);

        // ── Paso B.2: asignación activa del operador ─────────────────────────
        const { data: asignacion } = await supabase
          .from("asignacion_operador_vehiculo")
          .select("id_asignacion, id_operador, operadores(nombre_completo)")
          .eq("id_vehiculo", vehiculoData.id_vehiculo)
          .is("fecha_fin", null)
          .maybeSingle();
        setAsignacionActual(asignacion ?? null);

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

        // ── Paso D: cargar vales disponibles y operadores del sindicato ─────
        await Promise.all([
          _cargarValesDisponibles(vehiculoData.id_sindicato),
          _cargarOperadoresSindicato(vehiculoData.id_sindicato),
        ]);
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
    [_cargarValesDisponibles, _cargarOperadoresSindicato, expectedSindicatoId],
  );

  // ─── 2. Cargar vales en_proceso sin vehículo ─────────────────────────────

  /**
   * Trae todos los vales en_proceso que no tienen vehículo asignado.
   * Se filtra por id_obra del usuario activo (RLS lo maneja automáticamente).
   */
  const _cargarValesDisponibles = useCallback(async (idSindicato) => {
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
          empresas:id_empresa ( empresa, sufijo ),
          obras ( obra, cc ),
          vale_material_detalles (
            id_sindicato,
            es_planta_asfaltos,
            banco:id_banco ( id_banco, banco ),
            material:id_material ( id_tipo_de_material, material )
          ),
          vale_renta_detalle (
            id_sindicato,
            material:id_material ( material )
          )
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

      const valesFiltrados = (data ?? []).filter((vale) => {
        if (!esDentroJornada(vale.fecha_creacion)) return false;
        // Exclusión mutua: un perfil de Planta de Asfaltos solo asigna
        // vehiculos a vales de planta; cualquier otro rol (Residente,
        // CHECADOR, etc.) solo ve vales que NO son de planta. Administrador
        // ve todos. Evita que se mezclen vales de obra con los de planta.
        const valeEsPlanta = !!vale.vale_material_detalles?.[0]?.es_planta_asfaltos;
        if (!esAdministrador) {
          if (esPlantaAsfaltos && !valeEsPlanta) return false;
          if (!esPlantaAsfaltos && valeEsPlanta) return false;
        }
        if (vale.tipo_vale === "material") {
          return vale.vale_material_detalles?.[0]?.id_sindicato === idSindicato;
        }
        if (vale.tipo_vale === "renta") {
          return vale.vale_renta_detalle?.[0]?.id_sindicato === idSindicato;
        }
        return false;
      });

      setValesDisponibles(valesFiltrados);
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
  }, [esPlantaAsfaltos, esAdministrador]);
  // ─── 2b. Cargar operadores activos del sindicato ─────────────────────────

  const _cargarOperadoresSindicato = useCallback(async (idSindicato) => {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("id_operador, nombre_completo")
        .eq("id_sindicato", idSindicato)
        .eq("activo", true)
        .order("nombre_completo");
      if (error) throw error;
      setOperadoresSindicato(data ?? []);
    } catch (err) {
      console.error(
        "[useVehiculoQR] _cargarOperadoresSindicato falló:",
        err.message,
      );
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
    async (idVale, idOperadorFinal) => {
      if (!vehiculo) {
        Alert.alert("Error", "No hay vehículo seleccionado. Escanea de nuevo.");
        return false;
      }
      if (!idVale) {
        Alert.alert("Error", "Selecciona un vale antes de asignar.");
        return false;
      }

      try {
        setAsignando(true);
        setError(null);

        // ── Guardia: exclusión mutua planta de asfaltos / resto de roles ──────
        if (!esAdministrador) {
          const { data: detalleCheck } = await supabase
            .from("vale_material_detalles")
            .select("es_planta_asfaltos")
            .eq("id_vale", idVale)
            .maybeSingle();

          const valeEsPlanta = !!detalleCheck?.es_planta_asfaltos;

          if (esPlantaAsfaltos && !valeEsPlanta) {
            Alert.alert(
              "No disponible",
              "Este vale no es de la Planta de Asfaltos. Un perfil de Planta de Asfaltos solo puede asignar vehiculo a vales de planta.",
            );
            return false;
          }

          if (!esPlantaAsfaltos && valeEsPlanta) {
            Alert.alert(
              "No disponible",
              "Este vale es de la Planta de Asfaltos. Solo un perfil de Planta de Asfaltos puede asignar vehiculo aqui.",
            );
            return false;
          }
        }

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

        // ── Registrar rotación si el operador cambió ─────────────────────────
        const idOpEfectivo =
          idOperadorFinal ??
          asignacionActual?.id_operador ??
          vehiculo.id_operador_sugerido ??
          null;

        if (idOpEfectivo) {
          const hoy = new Date();
          const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

          if (asignacionActual && idOpEfectivo !== asignacionActual.id_operador) {
            await supabase
              .from("asignacion_operador_vehiculo")
              .update({ fecha_fin: fechaHoy })
              .eq("id_asignacion", asignacionActual.id_asignacion);

            await supabase
              .from("asignacion_operador_vehiculo")
              .insert({ id_vehiculo: vehiculo.id_vehiculo, id_operador: idOpEfectivo, fecha_inicio: fechaHoy });

            await supabase
              .from("vehiculos")
              .update({ id_operador_sugerido: idOpEfectivo })
              .eq("id_vehiculo", vehiculo.id_vehiculo);
          } else if (!asignacionActual) {
            await supabase
              .from("asignacion_operador_vehiculo")
              .insert({ id_vehiculo: vehiculo.id_vehiculo, id_operador: idOpEfectivo, fecha_inicio: fechaHoy });
          }
        }

        // ── Escribir asignación en el vale ───────────────────────────────────
        const payload = {
          id_vehiculo: vehiculo.id_vehiculo,
          id_operador: idOpEfectivo,
        };

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
    [vehiculo, asignacionActual, esPlantaAsfaltos, esAdministrador],
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
    asignacionActual,
    operadoresSindicato,
    // Acciones
    buscarVehiculoPorQR,
    asignarVehiculo,
    reset,
  };
};

export default useVehiculoQR;
