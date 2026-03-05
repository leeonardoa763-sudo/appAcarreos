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
        console.log(
          "[useTicketsDescarga] No aplica: falta operador o vehículo",
        );
        return false;
      }

      if (totalTickets === 0) {
        console.log("[useTicketsDescarga] Primer ticket disponible");
        return true;
      }

      const puedeGenerar = viajesRegistrados >= totalTickets;
      console.log("[useTicketsDescarga] Evaluando ticket siguiente:", {
        totalTickets,
        viajesRegistrados,
        puedeGenerar,
      });
      return puedeGenerar;
    },
    [esMaterialDescarga, estaEnProceso, tieneOperadorYVehiculo, totalTickets],
  );

  // ─── Cargar tickets existentes ────────────────────────────────────────────

  const cargarTickets = useCallback(async () => {
    if (!vale?.id_vale) return;

    try {
      setLoading(true);
      console.log(
        "[useTicketsDescarga] Cargando tickets para vale:",
        vale.id_vale,
        vale.folio,
      );

      const { data, error } = await supabase
        .from("tickets_descarga")
        .select(
          `
          id_ticket,
          folio_ticket,
          numero_ticket,
          banco_descarga,
          fecha_impresion,
          persona:id_persona_registro (
            nombre,
            primer_apellido
          )
        `,
        )
        .eq("id_vale", vale.id_vale)
        .order("numero_ticket", { ascending: true });

      if (error) throw error;

      console.log(
        "[useTicketsDescarga] Tickets encontrados:",
        data?.length ?? 0,
        data,
      );
      setTickets(data ?? []);
    } catch (error) {
      console.error("[useTicketsDescarga] Error cargando tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [vale?.id_vale]);

  useEffect(() => {
    console.log("[useTicketsDescarga] useEffect ejecutado");
    console.log("[useTicketsDescarga] vale?.tipo_vale:", vale?.tipo_vale);
    console.log("[useTicketsDescarga] vale?.id_vale:", vale?.id_vale);
    console.log(
      "[useTicketsDescarga] detalleRenta:",
      detalleRenta ? "presente" : "null/undefined",
    );
    console.log(
      "[useTicketsDescarga] detalleRenta?.material:",
      JSON.stringify(detalleRenta?.material),
    );
    console.log(
      "[useTicketsDescarga] es_material_descarga (raw):",
      detalleRenta?.material?.es_material_descarga,
    );
    console.log("[useTicketsDescarga] esValeRenta:", esValeRenta);
    console.log("[useTicketsDescarga] esMaterialDescarga:", esMaterialDescarga);

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
   * @returns {object|null} - Datos del ticket creado o null si falla
   */
  const registrarTicket = useCallback(
    async (bancoDescarga) => {
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

        console.log("[useTicketsDescarga] Registrando nuevo ticket:", {
          id_vale: vale.id_vale,
          folio_original: vale.folio,
          folio_ticket: folioTicket,
          numero_ticket: numeroTicket,
          banco_descarga: bancoDescarga.toUpperCase().trim(),
          id_persona_registro: userProfile?.id_persona,
        });

        const { data, error } = await supabase
          .from("tickets_descarga")
          .insert({
            id_vale: vale.id_vale,
            folio_ticket: folioTicket,
            numero_ticket: numeroTicket,
            banco_descarga: bancoDescarga.toUpperCase().trim(),
            id_persona_registro: userProfile?.id_persona,
          })
          .select(
            `
            id_ticket,
            folio_ticket,
            numero_ticket,
            banco_descarga,
            fecha_impresion,
            persona:id_persona_registro (
              nombre,
              primer_apellido
            )
          `,
          )
          .single();

        if (error) throw error;

        console.log(
          "[useTicketsDescarga] Ticket registrado exitosamente:",
          data,
        );

        // Actualizar lista local sin recargar BD
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

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    // Estado
    tickets,
    loading,
    registrando,
    totalTickets,

    // Flags
    esMaterialDescarga,

    // Función que recibe los viajes actuales para calcular si puede generar
    calcularPuedeGenerar,

    // Acciones
    registrarTicket,
    recargarTickets: cargarTickets,
  };
};
