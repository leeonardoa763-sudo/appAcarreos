// hooks/useTicketsDescarga.js

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

  // ─── Derivados ────────────────────────────────────────────────────────────

  const esValeRenta = vale?.tipo_vale === "renta";

  const esMaterialDescarga =
    esValeRenta && detalleRenta?.material?.es_material_descarga === true;

  const tieneOperadorYVehiculo = !!(vale?.id_operador && vale?.id_vehiculo);
  const estaEnProceso = vale?.estado === "en_proceso";

  const totalTickets = tickets.length;

  // ─── Lógica de habilitación ───────────────────────────────────────────────

  const calcularPuedeGenerar = useCallback(
    (viajesRegistrados = 0, operadorYVehiculoGuardados = false) => {
      if (!esMaterialDescarga) return false;
      if (!estaEnProceso) return false;

      const tieneAsignacion =
        operadorYVehiculoGuardados || tieneOperadorYVehiculo;
      if (!tieneAsignacion) return false;

      if (totalTickets === 0) return true;

      return viajesRegistrados >= totalTickets;
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
          reimprimir_count,
          material:id_material_ticket (
            id_material,
            material
          ),
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

  const registrarTicket = useCallback(
    async (bancoDescarga, materialTicket) => {
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
            id_material_ticket: materialTicket?.id_material ?? null,
            id_persona_registro: userProfile?.id_persona,
          })
          .select(
            `
            id_ticket,
            folio_ticket,
            numero_ticket,
            banco_descarga,
            fecha_impresion,
            reimprimir_count,
            material:id_material_ticket (
              id_material,
              material
            ),
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

  // ─── Reimprimir ticket ────────────────────────────────────────────────────

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
            material:id_material_ticket (
              id_material,
              material
            ),
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
        "No se pudo registrar la reimpresion. Intenta de nuevo.",
      );
      return null;
    }
  }, []);

  return {
    tickets,
    loading,
    registrando,
    totalTickets,
    esMaterialDescarga,
    calcularPuedeGenerar,
    registrarTicket,
    reimprimirTicket,
    recargarTickets: cargarTickets,
  };
};
