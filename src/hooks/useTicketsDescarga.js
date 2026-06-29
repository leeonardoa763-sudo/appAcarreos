/**
 * hooks/useTicketsDescarga.js
 *
 * Hook para gestionar tickets de descarga en vales de RENTA
 * únicamente para materiales con es_material_descarga = true
 * (Basura, Demolición, Escombro, Desperdicio, etc.)
 *
 * FLUJO:
 * 1. Verificar si es vale de renta Y material tiene es_material_descarga = true
 * 2. Primer ticket: disponible si operador y vehículo están asignados
 * 3. Tickets siguientes: se habilitan cuando hay más viajes registrados
 *    que tickets ya impresos (viajesRegistrados >= totalTickets)
 *
 * FOLIO FORMATO: {folio_original}-{numero} ej: PB-TR-00005-01
 *
 * USADO EN:
 * - ValeDetalleRenta (sección de tickets de descarga)
 */

// 1. React
import { useState, useEffect, useCallback } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Local
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";

export const useTicketsDescarga = ({ vale, detalleRenta }) => {
  const { userProfile } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [eliminandoTicket, setEliminandoTicket] = useState(false);

  // ─── Derivados ────────────────────────────────────────────────────────────

  // Solo aplica para vales de renta
  const esValeRenta = vale?.tipo_vale === "renta";

  // El material viene de vale_renta_detalle[0].material.es_material_descarga
  const esMaterialDescarga =
    esValeRenta && detalleRenta?.material?.es_material_descarga === true;

  // Condiciones base del vale

  const tieneOperadorYVehiculo = !!(vale?.id_operador && vale?.id_vehiculo);
  const estaEnProceso = vale?.estado === "en_proceso";

  // Total de tickets ya impresos
  const totalTickets = tickets.length;

  // ─── Lógica de habilitación ───────────────────────────────────────────────

  /**
   * Determina si se puede generar un nuevo ticket de descarga.
   * Recibe los viajes actuales desde ValeDetalleRenta (ya los tiene useViajesRenta).
   *
   * Primer ticket (totalTickets === 0):
   *   - Vale en_proceso + operador y vehículo asignados
   *
   * Tickets siguientes:
   *   - Necesita al menos tantos viajes como tickets ya impresos
   */
  const calcularPuedeGenerar = useCallback(
    (viajesRegistrados = 0, operadorYVehiculoGuardados = false) => {
      if (!esMaterialDescarga) return false;
      if (!estaEnProceso) return false;

      // Usar override si se pasó, o el valor del vale
      const tieneAsignacion =
        operadorYVehiculoGuardados || tieneOperadorYVehiculo;
      if (!tieneAsignacion) {
        return false;
      }

      if (totalTickets === 0) {
        return true;
      }

      const puedeGenerar = viajesRegistrados >= totalTickets;

      return puedeGenerar;
    },
    [esMaterialDescarga, estaEnProceso, tieneOperadorYVehiculo, totalTickets],
  );

  // ─── Cargar tickets existentes ────────────────────────────────────────────

  const cargarTickets = useCallback(async () => {
    if (!vale?.id_vale) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("tickets_descarga")
        .select(
          `
          id_ticket,
          folio_ticket,
          numero_ticket,
          banco_descarga,
          fecha_impresion,
          id_material_ticket,
          persona:id_persona_registro (
            nombre,
            primer_apellido
          )
        `,
        )
        .eq("id_vale", vale.id_vale)
        .order("numero_ticket", { ascending: true });

      if (error) throw error;

      setTickets(data ?? []);
    } catch (error) {
      console.error("[useTicketsDescarga] Error cargando tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [vale?.id_vale]);

  useEffect(() => {
    if (esMaterialDescarga && vale?.id_vale) {
      cargarTickets();
    } else {
      setLoading(false);
    }
  }, [esMaterialDescarga, vale?.id_vale]);

  // ─── Registrar nuevo ticket ───────────────────────────────────────────────

  /**
   * Registra el ticket en BD y devuelve los datos completos para imprimir
   * @param {string} bancoDescarga - Nombre del banco donde se descargará
   * @param {object} materialSeleccionado - Material seleccionado { id_material, material }
   * @returns {object|null} - Datos del ticket creado o null si falla
   */
  const registrarTicket = useCallback(
    async (bancoDescarga, materialSeleccionado) => {
      if (!bancoDescarga?.trim()) {
        Alert.alert(
          "Campo requerido",
          "Escribe el nombre del banco de descarga.",
        );
        return null;
      }

      try {
        setRegistrando(true);

        const numeroTicket = totalTickets + 1;
        const numeroFormateado = String(numeroTicket).padStart(2, "0");
        const folioTicket = `${vale.folio}-${numeroFormateado}`;

        const { data, error } = await supabase
          .from("tickets_descarga")
          .insert({
            id_vale: vale.id_vale,
            folio_ticket: folioTicket,
            numero_ticket: numeroTicket,
            banco_descarga: bancoDescarga.toUpperCase().trim(),
            id_persona_registro: userProfile?.id_persona,
            id_material_ticket: materialSeleccionado?.id_material ?? null,
          })
          .select(
            `
            id_ticket,
            folio_ticket,
            numero_ticket,
            banco_descarga,
            fecha_impresion,
            id_material_ticket,
            persona:id_persona_registro (
              nombre,
              primer_apellido
            )
          `,
          )
          .single();

        if (error) throw error;

        // Adjuntar objeto material para que el ticket impreso lo use sin depender del join
        const ticketConMaterial = materialSeleccionado
          ? { ...data, material: { material: materialSeleccionado.material } }
          : data;

        // Actualizar lista local sin recargar BD
        setTickets((prev) => [...prev, ticketConMaterial]);

        return ticketConMaterial;
      } catch (error) {
        console.error("[useTicketsDescarga] Error registrando ticket:", error);
        Alert.alert(
          "Error",
          "No se pudo registrar el ticket. Intenta de nuevo.",
        );
        return null;
      } finally {
        setRegistrando(false);
      }
    },
    [totalTickets, vale?.folio, vale?.id_vale, userProfile],
  );

  const reimprimirTicket = useCallback(async (ticket) => {
    if (ticket.reimprimir_count >= 1) {
      Alert.alert(
        "Limite alcanzado",
        "Este ticket ya fue reimpreso una vez. No se puede reimprimir de nuevo.",
      );
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("tickets_descarga")
        .update({ reimprimir_count: 1 })
        .eq("id_ticket", ticket.id_ticket)
        .select(
          `
            id_ticket,
            folio_ticket,
            numero_ticket,
            banco_descarga,
            fecha_impresion,
            reimprimir_count,
            persona:id_persona_registro (
              nombre,
              primer_apellido
            )
          `,
        )
        .single();

      if (error) throw error;

      // Actualizar lista local
      setTickets((prev) =>
        prev.map((t) => (t.id_ticket === data.id_ticket ? data : t)),
      );

      return data;
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo registrar la reimpresion. Intenta de nuevo.",
      );
      return null;
    }
  }, []);

  const eliminarUltimoTicket = useCallback(async (idTicket) => {
    try {
      setEliminandoTicket(true);
      const { data: deleted, error } = await supabase
        .from("tickets_descarga")
        .delete()
        .eq("id_ticket", idTicket)
        .select("id_ticket");
      if (error) throw error;
      if (!deleted || deleted.length === 0) {
        throw new Error("RLS: fila no eliminada");
      }

      setTickets((prev) => prev.slice(0, -1));
      return true;
    } catch (error) {
      console.error("[useTicketsDescarga] Error eliminando ticket:", error);
      Alert.alert("Error", "No se pudo eliminar el ticket. Verifica permisos.");
      return false;
    } finally {
      setEliminandoTicket(false);
    }
  }, []);

  return {
    // Estado
    tickets,
    loading,
    registrando,
    eliminandoTicket,
    totalTickets,

    // Flags
    esMaterialDescarga,

    // Función que recibe los viajes actuales para calcular si puede generar
    calcularPuedeGenerar,

    // Acciones
    registrarTicket,
    reimprimirTicket,
    eliminarUltimoTicket,
    recargarTickets: cargarTickets,
  };
};
