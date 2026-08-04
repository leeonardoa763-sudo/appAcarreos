// src/hooks/usePresupuestosAdmin.js
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../config/supabase";

// PostgREST puede devolver una columna numeric como string (o null si la fila
// viene de una version vieja de la tabla). Todo valor que despues se formatea
// con toFixed/toLocaleString pasa por aqui: un null colandose hasta la tarjeta
// tiraba la pantalla completa.
const aNumero = (valor) => {
  const n = typeof valor === "number" ? valor : parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
};

const calcularNivel = (consumido, presupuestado) => {
  if (!presupuestado || presupuestado === 0) return "ok";
  const pct = (consumido / presupuestado) * 100;
  if (pct >= 100) return "blocked";
  if (pct >= 95) return "danger";
  if (pct >= 75) return "warning";
  return "ok";
};

const calcularPorcentaje = (consumido, presupuestado) =>
  presupuestado > 0 ? Math.min(100, (consumido / presupuestado) * 100) : 0;

// catalogMateriales: array del catálogo de materiales (de useCatalogos).
// Se pasa desde la pantalla para evitar un JOIN en la query que puede fallar
// por nombre de constraint. NO entra en las dependencias de `cargar`: el
// catálogo solo sirve para resolver el nombre a mostrar, así que se aplica
// sobre las filas ya cargadas (useMemo). Si entrara en `cargar`, cada refresco
// del catálogo dispararía una recarga completa de presupuestos.
export const usePresupuestosAdmin = (id_obra, catalogMateriales = []) => {
  const [filasMaterial, setFilasMaterial] = useState([]);
  const [filaRenta, setFilaRenta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Guarda contra respuestas fuera de orden (cambiar de obra rapido) y contra
  // setState despues de desmontar la pantalla.
  const peticionRef = useRef(0);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cargar = useCallback(async () => {
    const peticion = ++peticionRef.current;
    const vigente = () => montadoRef.current && peticion === peticionRef.current;

    if (!id_obra) {
      setFilasMaterial([]);
      setFilaRenta(null);
      setError(null);
      setLoading(false);
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

      if (!vigente()) return;

      if (materialRes.error) throw materialRes.error;
      if (rentaRes.error) throw rentaRes.error;

      setFilasMaterial(materialRes.data || []);
      setFilaRenta(rentaRes.data || null);
    } catch (err) {
      if (!vigente()) return;
      console.error("[usePresupuestosAdmin] Error al cargar:", err);
      setError(err?.message ?? "No se pudieron cargar los presupuestos.");
      setFilasMaterial([]);
      setFilaRenta(null);
    } finally {
      if (vigente()) setLoading(false);
    }
  }, [id_obra]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const presupuestosMaterial = useMemo(() => {
    return filasMaterial
      .map((p) => {
        const mat = catalogMateriales.find(
          (m) => m.id_material === p.id_material
        );
        const presupuestados = aNumero(p.m3_presupuestados);
        const consumidos = aNumero(p.m3_consumidos);

        return {
          id_material: p.id_material,
          nombre: mat?.material ?? `Material ${p.id_material}`,
          // Tipo 2 = carpeta asfaltica: mismo presupuesto en m3, pero lo
          // consumen los vales de la planta de asfaltos, no los de material.
          esAsfaltico: mat?.id_tipo_de_material === 2,
          presupuestados,
          consumidos,
          disponible: Math.max(0, presupuestados - consumidos),
          porcentaje: calcularPorcentaje(consumidos, presupuestados),
          nivel: calcularNivel(consumidos, presupuestados),
        };
      })
      // Los asfalticos van agrupados al final; alfabetico dentro de cada grupo.
      .sort((a, b) => {
        if (a.esAsfaltico !== b.esAsfaltico) return a.esAsfaltico ? 1 : -1;
        return a.nombre.localeCompare(b.nombre, "es");
      });
  }, [filasMaterial, catalogMateriales]);

  const presupuestoRenta = useMemo(() => {
    if (!filaRenta) return null;

    const presupuestado = aNumero(filaRenta.monto_presupuestado);
    const consumido = aNumero(filaRenta.monto_consumido);

    return {
      presupuestado,
      consumido,
      disponible: Math.max(0, presupuestado - consumido),
      porcentaje: calcularPorcentaje(consumido, presupuestado),
      nivel: calcularNivel(consumido, presupuestado),
    };
  }, [filaRenta]);

  const guardarMaterial = useCallback(
    async (id_material, m3_presupuestados) => {
      try {
        setGuardando(true);

        const yaExiste = filasMaterial.some(
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
            throw new Error(
              "El servidor no actualizó el presupuesto. Verifica los permisos RLS de la tabla."
            );
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
        if (montadoRef.current) setGuardando(false);
      }
    },
    [id_obra, filasMaterial, cargar]
  );

  const guardarRenta = useCallback(
    async (monto_presupuestado) => {
      try {
        setGuardando(true);

        if (filaRenta) {
          const { data: filas, error } = await supabase
            .from("presupuesto_renta_obra")
            .update({ monto_presupuestado })
            .eq("id_obra", id_obra)
            .eq("activo", true)
            .select("id_obra");
          if (error) throw error;
          if (!filas || filas.length === 0) {
            throw new Error(
              "El servidor no actualizó el presupuesto de renta. Verifica los permisos RLS de la tabla."
            );
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
        if (montadoRef.current) setGuardando(false);
      }
    },
    [id_obra, filaRenta, cargar]
  );

  const eliminarMaterial = useCallback(
    async (id_material) => {
      try {
        setGuardando(true);
        const { error } = await supabase
          .from("presupuesto_material_obra")
          .update({ activo: false })
          .eq("id_obra", id_obra)
          .eq("id_material", id_material)
          .eq("activo", true);
        if (error) throw error;
        await cargar();
      } catch (err) {
        console.error("[eliminarMaterial]", err);
        throw err;
      } finally {
        if (montadoRef.current) setGuardando(false);
      }
    },
    [id_obra, cargar]
  );

  const eliminarRenta = useCallback(async () => {
    try {
      setGuardando(true);
      const { error } = await supabase
        .from("presupuesto_renta_obra")
        .update({ activo: false })
        .eq("id_obra", id_obra)
        .eq("activo", true);
      if (error) throw error;
      await cargar();
    } catch (err) {
      console.error("[eliminarRenta]", err);
      throw err;
    } finally {
      if (montadoRef.current) setGuardando(false);
    }
  }, [id_obra, cargar]);

  return {
    presupuestosMaterial,
    presupuestoRenta,
    loading,
    guardando,
    error,
    cargar,
    guardarMaterial,
    guardarRenta,
    eliminarMaterial,
    eliminarRenta,
  };
};
