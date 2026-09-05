/**
 * hooks/useViajesRenta.js
 *
 * Registra y carga los viajes de un vale de renta (incluye pipas de agua).
 *
 * NO tiene tiempo minimo entre viajes, a proposito: un viaje de renta no es un
 * ciclo de acarreo obra-banco-obra, asi que no hay una duracion fisica minima
 * que exigir. Esa regla vive solo en useViajesMaterial (ver
 * utils/tiempoEntreViajes.js).
 *
 * Lo que SI sigue aplicando: la jornada laboral (abajo) y los minimos de 8 h /
 * 4 h para renta por dia y medio dia (validateTiempoMinimoRenta, aplicado al
 * completar el vale en ValeDetalleRenta).
 */

import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";
import { esDentroJornada } from "../utils/jornadaLaboral";

export const useViajesRenta = (
  idValeRentaDetalle,
  fechaCreacionVale = null,
) => {
  const { userProfile } = useAuth();
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [eliminandoViaje, setEliminandoViaje] = useState(false);

  const cargarViajes = useCallback(async () => {
    if (!idValeRentaDetalle) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vale_renta_viajes")
        .select(
          `
          id_viaje,
          numero_viaje,
          hora_registro,
          carga_porcentaje,
          banco_descarga,
          ticket_impreso,
          material:id_material (
            id_material,
            material
          ),
          persona:id_persona_registro (
            nombre,
            primer_apellido
          )
        `,
        )
        .eq("id_vale_renta_detalle", idValeRentaDetalle)
        .order("numero_viaje", { ascending: true });

      if (error) throw error;
      setViajes(data || []);
    } catch (error) {
      console.error("[useViajesRenta] Error cargando viajes:", error);
    } finally {
      setLoading(false);
    }
  }, [idValeRentaDetalle]);

  const insertarViaje = useCallback(
    async (extra = {}) => {
      try {
        setRegistrando(true);
        const { data, error } = await supabase
          .from("vale_renta_viajes")
          .insert({
            id_vale_renta_detalle: idValeRentaDetalle,
            numero_viaje: viajes.length + 1,
            hora_registro: new Date().toISOString(),
            id_persona_registro: userProfile.id_persona,
            ...extra,
          })
          .select(
            `
            id_viaje,
            numero_viaje,
            hora_registro,
            carga_porcentaje,
            banco_descarga,
            ticket_impreso,
            material:id_material (
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
        setViajes((prev) => [...prev, data]);
        return data;
      } catch (error) {
        console.error("[useViajesRenta] Error registrando viaje:", error);
        Alert.alert(
          "Error",
          "No se pudo registrar el viaje. Intenta de nuevo.",
          [{ text: "OK" }],
        );
        return null;
      } finally {
        setRegistrando(false);
      }
    },
    [viajes, idValeRentaDetalle, userProfile],
  );

  /**
   * Registra un viaje. Dos flujos:
   * - Renta normal: idMaterial ya viene confirmado por el modal de categoria/
   *   subcategoria/carga (ModalRegistrarViaje) — ese modal ES la confirmacion,
   *   asi que se inserta directo sin el Alert.alert de "¿Deseas continuar?".
   * - Pipas de agua: se llama sin argumentos, material fijo desde la creacion
   *   del vale — se conserva el Alert.alert de confirmacion tal cual existia.
   */
  const registrarViaje = useCallback(
    async (idMaterial = null, cargaPorcentaje = null, bancoDescarga = null) => {
      const esAdministrador = userProfile?.roles?.role === "Administrador";

      if (!esAdministrador && !esDentroJornada(fechaCreacionVale)) {
        Alert.alert(
          "Vale fuera de jornada",
          "Este vale fue creado en una jornada anterior y ya no puede recibir viajes. Usa un vale del dia de hoy.",
          [{ text: "Entendido" }],
        );
        return false;
      }

      if (idMaterial) {
        return insertarViaje({
          id_material: idMaterial,
          carga_porcentaje: cargaPorcentaje,
          banco_descarga: bancoDescarga,
        });
      }

      return new Promise((resolve) => {
        Alert.alert(
          "Registrar Viaje",
          `Se registrara el viaje ${viajes.length + 1}. Esta accion no se puede revertir. ¿Deseas continuar?`,
          [
            { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Confirmar",
              style: "default",
              onPress: async () => resolve(await insertarViaje()),
            },
          ],
        );
      });
    },
    [viajes, insertarViaje, userProfile, fechaCreacionVale],
  );

  /**
   * Marca el ticket de un viaje como impreso (o como resuelto "sin
   * impresora", que la app trata igual que impreso). Es el candado que
   * bloquea "Registrar Viaje N+1" hasta que el ticket del viaje N se marque.
   */
  const marcarTicketImpreso = useCallback(async (idViaje) => {
    try {
      const { error } = await supabase
        .from("vale_renta_viajes")
        .update({ ticket_impreso: true })
        .eq("id_viaje", idViaje);
      if (error) throw error;
      setViajes((prev) =>
        prev.map((v) =>
          v.id_viaje === idViaje ? { ...v, ticket_impreso: true } : v,
        ),
      );
      return true;
    } catch (error) {
      console.error("[useViajesRenta] Error marcando ticket impreso:", error);
      return false;
    }
  }, []);

  const eliminarUltimoViaje = useCallback(
    async (idViaje) => {
      try {
        setEliminandoViaje(true);
        const { data: deleted, error } = await supabase
          .from("vale_renta_viajes")
          .delete()
          .eq("id_viaje", idViaje)
          .select("id_viaje");
        if (error) throw error;
        if (!deleted || deleted.length === 0) {
          throw new Error("RLS: fila no eliminada");
        }

        setViajes((prev) => prev.slice(0, -1));
        return true;
      } catch (error) {
        console.error("[useViajesRenta] Error eliminando viaje:", error);
        Alert.alert("Error", "No se pudo eliminar el viaje. Verifica permisos.");
        return false;
      } finally {
        setEliminandoViaje(false);
      }
    },
    [],
  );

  useEffect(() => {
    cargarViajes();
  }, [cargarViajes]);

  return {
    viajes,
    loading,
    registrando,
    eliminandoViaje,
    totalViajes: viajes.length,
    registrarViaje,
    marcarTicketImpreso,
    eliminarUltimoViaje,
    recargarViajes: cargarViajes,
  };
};
