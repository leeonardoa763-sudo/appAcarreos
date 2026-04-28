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
import { calcularCostoValeMaterial } from "../utils/preciosMaterial";

export const useTicketsMaterial = (vale) => {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [eliminandoTicket, setEliminandoTicket] = useState(false);

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

      // Primer ticket: disponible apenas el vale está en proceso, sin requerir operador
      if (totalTickets === 0) return true;

      // Tickets siguientes: necesita operador/vehículo y al menos tantos viajes como tickets
      const tieneAsignacion =
        operadorYVehiculoGuardados || tieneOperadorYVehiculo;
      if (!tieneAsignacion) return false;

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

  // ─── Eliminar último ticket ───────────────────────────────────────────────

  const eliminarUltimoTicket = useCallback(async (idTicket) => {
    try {
      setEliminandoTicket(true);
      const { error } = await supabase
        .from("tickets_material")
        .delete()
        .eq("id_ticket", idTicket);
      if (error) throw error;
      setTickets((prev) => prev.slice(0, -1));
      return true;
    } catch (error) {
      console.error("[useTicketsMaterial] Error eliminando ticket:", error);
      Alert.alert("Error", "No se pudo eliminar el ticket.");
      return false;
    } finally {
      setEliminandoTicket(false);
    }
  }, []);

  // ─── Actualizar banco override en el último viaje ─────────────────────────

  const actualizarBancoViaje = useCallback(
    async (idViaje, bancoOverride) => {
      try {
        const { data: valeData, error: errorVale } = await supabase
          .from("vales")
          .select("id_vehiculo, vale_material_detalles!inner(id_material)")
          .eq("id_vale", vale.id_vale)
          .single();

        if (errorVale || !valeData)
          throw new Error("No se pudo obtener el vale");

        const { data: vehiculoData, error: errorVehiculo } = await supabase
          .from("vehiculos")
          .select("id_sindicato")
          .eq("id_vehiculo", valeData.id_vehiculo)
          .single();

        if (errorVehiculo || !vehiculoData)
          throw new Error("No se pudo obtener el sindicato del vehiculo");

        const { data: materialData, error: errorMaterial } = await supabase
          .from("material")
          .select("id_tipo_de_material")
          .eq("id_material", valeData.vale_material_detalles[0].id_material)
          .single();

        if (errorMaterial || !materialData)
          throw new Error("No se pudo obtener el tipo de material");

        const { data: viajeData, error: errorViaje } = await supabase
          .from("vale_material_viajes")
          .select("volumen_m3")
          .eq("id_viaje", idViaje)
          .single();

        if (errorViaje || !viajeData)
          throw new Error("No se pudo obtener el viaje");

        if (errorViaje || !viajeData)
          throw new Error("No se pudo obtener el viaje");

        const costos = await calcularCostoValeMaterial(
          materialData.id_tipo_de_material,
          vehiculoData.id_sindicato,
          bancoOverride.distancia_km,
          viajeData.volumen_m3,
        );

        const { error: errorUpdate } = await supabase
          .from("vale_material_viajes")
          .update({
            id_banco_override: bancoOverride.id_banco,
            distancia_km_override: bancoOverride.distancia_km,
            precio_m3_override: costos.precioM3,
            costo_viaje_override: costos.costoTotal,
          })
          .eq("id_viaje", idViaje);

        if (errorUpdate) throw errorUpdate;

        return {
          banco: bancoOverride.banco,
          distancia_km: bancoOverride.distancia_km,
          precio_m3: costos.precioM3,
          costo_viaje: costos.costoTotal,
        };
      } catch (error) {
        Alert.alert(
          "Error",
          `No se pudo actualizar el banco del viaje: ${error.message}`,
        );
        return null;
      }
    },
    [vale?.id_vale],
  );

  return {
    tickets,
    loading,
    registrando,
    eliminandoTicket,
    totalTickets,
    calcularPuedeImprimir,
    registrarTicket,
    reimprimirTicket,
    eliminarUltimoTicket,
    actualizarBancoViaje,
    recargarTickets: cargarTickets,
  };
};
