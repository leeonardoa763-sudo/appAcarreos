// src/hooks/usePresupuestosAdmin.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";

const calcularNivel = (consumido, presupuestado) => {
  if (!presupuestado || presupuestado === 0) return "ok";
  const pct = (consumido / presupuestado) * 100;
  if (pct >= 100) return "blocked";
  if (pct >= 95) return "danger";
  if (pct >= 75) return "warning";
  return "ok";
};

// catalogMateriales: array del catálogo de materiales (de useCatalogos)
// Se pasa desde la pantalla para evitar un JOIN en la query que puede fallar
// por nombre de constraint.
export const usePresupuestosAdmin = (id_obra, catalogMateriales = []) => {
  const [presupuestosMaterial, setPresupuestosMaterial] = useState([]);
  const [presupuestoRenta, setPresupuestoRenta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!id_obra) {
      setPresupuestosMaterial([]);
      setPresupuestoRenta(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [materialRes, rentaRes] = await Promise.all([
        supabase
          .from("presupuesto_material_obra")
          .select("id_material, m3_presupuestados, m3_consumidos")
          .eq("id_obra", id_obra)
          .eq("activo", true)
          .order("id_material"),
        supabase
          .from("presupuesto_renta_obra")
          .select("monto_presupuestado, monto_consumido")
          .eq("id_obra", id_obra)
          .eq("activo", true)
          .maybeSingle(),
      ]);

      if (materialRes.error) throw materialRes.error;
      if (rentaRes.error) throw rentaRes.error;

      const registros = (materialRes.data || []).map((p) => {
        const mat = catalogMateriales.find((m) => m.id_material === p.id_material);
        return {
          id_material: p.id_material,
          nombre: mat?.material ?? `Material ${p.id_material}`,
          presupuestados: p.m3_presupuestados,
          consumidos: p.m3_consumidos,
          disponible: Math.max(0, p.m3_presupuestados - p.m3_consumidos),
          porcentaje: Math.min(
            100,
            p.m3_presupuestados > 0
              ? (p.m3_consumidos / p.m3_presupuestados) * 100
              : 0
          ),
          nivel: calcularNivel(p.m3_consumidos, p.m3_presupuestados),
        };
      });

      setPresupuestosMaterial(registros);
      setPresupuestoRenta(
        rentaRes.data
          ? {
              presupuestado: rentaRes.data.monto_presupuestado,
              consumido: rentaRes.data.monto_consumido,
              disponible: Math.max(
                0,
                rentaRes.data.monto_presupuestado - rentaRes.data.monto_consumido
              ),
              porcentaje: Math.min(
                100,
                rentaRes.data.monto_presupuestado > 0
                  ? (rentaRes.data.monto_consumido /
                      rentaRes.data.monto_presupuestado) *
                      100
                  : 0
              ),
              nivel: calcularNivel(
                rentaRes.data.monto_consumido,
                rentaRes.data.monto_presupuestado
              ),
            }
          : null
      );
    } catch (err) {
      console.error("[usePresupuestosAdmin] Error al cargar:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id_obra, catalogMateriales]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarMaterial = useCallback(
    async (id_material, m3_presupuestados) => {
      try {
        setGuardando(true);

        const yaExiste = presupuestosMaterial.some(
          (p) => p.id_material === id_material
        );

        if (yaExiste) {
          const { data: filas, error } = await supabase
            .from("presupuesto_material_obra")
            .update({ m3_presupuestados })
            .eq("id_obra", id_obra)
            .eq("id_material", id_material)
            .eq("activo", true)
            .select("id_material");
          if (error) throw error;
          if (!filas || filas.length === 0) {
            throw new Error("El servidor no actualizó el presupuesto. Verifica los permisos RLS de la tabla.");
          }
        } else {
          const { error: insertErr } = await supabase
            .from("presupuesto_material_obra")
            .insert({
              id_obra,
              id_material,
              m3_presupuestados,
              m3_consumidos: 0,
              activo: true,
            });

          if (insertErr) {
            // Si ya existe un registro inactivo (23505 = duplicate key),
            // lo reactivamos y actualizamos el valor.
            if (insertErr.code === "23505") {
              const { error: updateErr } = await supabase
                .from("presupuesto_material_obra")
                .update({ m3_presupuestados, activo: true })
                .eq("id_obra", id_obra)
                .eq("id_material", id_material);
              if (updateErr) throw updateErr;
            } else {
              throw insertErr;
            }
          }
        }

        await cargar();
      } catch (err) {
        console.error("[guardarMaterial]", err);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [id_obra, presupuestosMaterial, cargar]
  );

  const guardarRenta = useCallback(
    async (monto_presupuestado) => {
      try {
        setGuardando(true);

        if (presupuestoRenta) {
          const { data: filas, error } = await supabase
            .from("presupuesto_renta_obra")
            .update({ monto_presupuestado })
            .eq("id_obra", id_obra)
            .eq("activo", true)
            .select("id_obra");
          if (error) throw error;
          if (!filas || filas.length === 0) {
            throw new Error("El servidor no actualizó el presupuesto de renta. Verifica los permisos RLS de la tabla.");
          }
        } else {
          const { error: insertErr } = await supabase
            .from("presupuesto_renta_obra")
            .insert({
              id_obra,
              monto_presupuestado,
              monto_consumido: 0,
              activo: true,
            });

          if (insertErr) {
            if (insertErr.code === "23505") {
              const { error: updateErr } = await supabase
                .from("presupuesto_renta_obra")
                .update({ monto_presupuestado, activo: true })
                .eq("id_obra", id_obra);
              if (updateErr) throw updateErr;
            } else {
              throw insertErr;
            }
          }
        }

        await cargar();
      } catch (err) {
        console.error("[guardarRenta]", err);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [id_obra, presupuestoRenta, cargar]
  );

  return {
    presupuestosMaterial,
    presupuestoRenta,
    loading,
    guardando,
    error,
    cargar,
    guardarMaterial,
    guardarRenta,
  };
};
