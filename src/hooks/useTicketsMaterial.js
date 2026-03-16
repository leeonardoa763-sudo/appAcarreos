/**
 * hooks/useTicketsMaterial.js
 *
 * Hook para manejar tickets de material.
 * Análogo a useTicketsDescarga pero para vales de MATERIAL.
 *
 * FLUJO:
 * 1. Primer ticket: disponible apenas se asignan operador y vehículo
 * 2. Tickets siguientes: disponibles después de registrar el viaje correspondiente
 *    (tickets[N] requiere viajes[N-1] registrado)
 */

import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";

export const useTicketsMaterial = (vale) => {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);

  const totalTickets = tickets.length;
  const tieneOperadorYVehiculo = !!(vale?.id_operador && vale?.id_vehiculo);
  const estaEnProceso = vale?.estado === "en_proceso";

  // ─── Cargar tickets existentes ────────────────────────────────────────────

  const cargarTickets = useCallback(async () => {
    if (!vale?.id_vale) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets_material")
        .select(
          `
          id_ticket,
          folio_ticket,
          numero_ticket,
          fecha_impresion,
          reimprimir_count,
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
      console.error("[useTicketsMaterial] Error cargando tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [vale?.id_vale]);

  useEffect(() => {
    if (vale?.id_vale) cargarTickets();
    else setLoading(false);
  }, [vale?.id_vale, cargarTickets]);

  // ─── Lógica de habilitación ───────────────────────────────────────────────

  /**
   * Determina si se puede imprimir el siguiente ticket.
   * @param {number} viajesRegistrados - Total de viajes ya registrados
   * @param {boolean} operadorYVehiculoGuardados - Override si se acaban de guardar
   */
  const calcularPuedeImprimir = useCallback(
    (viajesRegistrados = 0, operadorYVehiculoGuardados = false) => {
      if (!estaEnProceso) return false;

      const tieneAsignacion =
        operadorYVehiculoGuardados || tieneOperadorYVehiculo;
      if (!tieneAsignacion) return false;

      // Primer ticket: disponible apenas hay operador y vehículo
      if (totalTickets === 0) return true;

      // Tickets siguientes: necesita al menos tantos viajes como tickets impresos
      return viajesRegistrados >= totalTickets;
    },
    [estaEnProceso, tieneOperadorYVehiculo, totalTickets],
  );

  // ─── Registrar nuevo ticket ───────────────────────────────────────────────

  const registrarTicket = useCallback(async () => {
    if (!vale?.folio || !vale?.id_vale) {
      Alert.alert("Error", "No se encontraron datos del vale.");
      return null;
    }

    try {
      setRegistrando(true);

      const numeroTicket = totalTickets + 1;
      const numeroFormateado = String(numeroTicket).padStart(2, "0");
      const folioTicket = `${vale.folio}-${numeroFormateado}`;

      const { data, error } = await supabase
        .from("tickets_material")
        .insert({
          id_vale: vale.id_vale,
          folio_ticket: folioTicket,
          numero_ticket: numeroTicket,
          id_persona_registro: userProfile?.id_persona,
        })
        .select(
          `
          id_ticket,
          folio_ticket,
          numero_ticket,
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

      setTickets((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error("[useTicketsMaterial] Error registrando ticket:", error);
      Alert.alert("Error", "No se pudo registrar el ticket. Intenta de nuevo.");
      return null;
    } finally {
      setRegistrando(false);
    }
  }, [totalTickets, vale?.folio, vale?.id_vale, userProfile]);

  // ─── Reimprimir ticket ────────────────────────────────────────────────────

  const reimprimirTicket = useCallback(async (ticket) => {
    if (ticket.reimprimir_count >= 1) {
      Alert.alert(
        "Límite alcanzado",
        "Este ticket ya fue reimpreso una vez. No se puede reimprimir de nuevo.",
      );
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("tickets_material")
        .update({ reimprimir_count: 1 })
        .eq("id_ticket", ticket.id_ticket)
        .select(
          `
          id_ticket,
          folio_ticket,
          numero_ticket,
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

      setTickets((prev) =>
        prev.map((t) => (t.id_ticket === data.id_ticket ? data : t)),
      );

      return data;
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo registrar la reimpresión. Intenta de nuevo.",
      );
      return null;
    }
  }, []);

  return {
    tickets,
    loading,
    registrando,
    totalTickets,
    calcularPuedeImprimir,
    registrarTicket,
    reimprimirTicket,
    recargarTickets: cargarTickets,
  };
};
