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

  const registrarViaje = useCallback(async () => {
    const esAdministrador = userProfile?.roles?.role === "Administrador";

    if (!esAdministrador && !esDentroJornada(fechaCreacionVale)) {
      Alert.alert(
        "Vale fuera de jornada",
        "Este vale fue creado en una jornada anterior y ya no puede recibir viajes. Usa un vale del dia de hoy.",
        [{ text: "Entendido" }],
      );
      return false;
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
            onPress: async () => {
              try {
                setRegistrando(true);
                const { data, error } = await supabase
                  .from("vale_renta_viajes")
                  .insert({
                    id_vale_renta_detalle: idValeRentaDetalle,
                    numero_viaje: viajes.length + 1,
                    hora_registro: new Date().toISOString(),
                    id_persona_registro: userProfile.id_persona,
                  })
                  .select(
                    `
                    id_viaje,
                    numero_viaje,
                    hora_registro,
                    persona:id_persona_registro (
                      nombre,
                      primer_apellido
                    )
                  `,
                  )
                  .single();

                if (error) throw error;
                setViajes([...viajes, data]);
                resolve(true);
              } catch (error) {
                console.error(
                  "[useViajesRenta] Error registrando viaje:",
                  error,
                );
                Alert.alert(
                  "Error",
                  "No se pudo registrar el viaje. Intenta de nuevo.",
                  [{ text: "OK" }],
                );
                resolve(false);
              } finally {
                setRegistrando(false);
              }
            },
          },
        ],
      );
    });
  }, [viajes, idValeRentaDetalle, userProfile, fechaCreacionVale]);

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
    eliminarUltimoViaje,
    recargarViajes: cargarViajes,
  };
};
