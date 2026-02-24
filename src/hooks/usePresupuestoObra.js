// src/hooks/usePresupuestoObra.js
//
// Hook para consultar el presupuesto disponible de una obra.
// Usado en ValeMaterialScreen y ValeRentaScreen para mostrar
// el indicador de disponibilidad y bloquear la creación si se agota.
//
// USO:
//   const { presupuestoMaterial, presupuestoRenta, materialConsultado, rentaConsultada } =
//     usePresupuestoObra({ id_obra, id_material });

import { useState, useEffect } from "react";
import {
  fetchPresupuestoMaterial,
  fetchPresupuestoRenta,
} from "../services/presupuestoService";

// Calcula el nivel de alerta según el porcentaje consumido
const calcularNivel = (consumido, presupuestado) => {
  if (!presupuestado || presupuestado === 0) return "ok";
  const porcentaje = (consumido / presupuestado) * 100;
  if (porcentaje >= 100) return "blocked";
  if (porcentaje >= 95) return "danger";
  if (porcentaje >= 75) return "warning";
  return "ok";
};

export const usePresupuestoObra = ({ id_obra, id_material = null }) => {
  const [presupuestoMaterial, setPresupuestoMaterial] = useState(null);
  const [presupuestoRenta, setPresupuestoRenta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [materialConsultado, setMaterialConsultado] = useState(false);
  const [rentaConsultada, setRentaConsultada] = useState(false);

  // Consulta presupuesto de MATERIAL cuando cambia obra o material
  useEffect(() => {
    if (!id_obra || !id_material) {
      setPresupuestoMaterial(null);
      setMaterialConsultado(false);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        console.log("[Presupuesto] Consultando material:", {
          id_obra,
          id_material,
        });
        const data = await fetchPresupuestoMaterial(id_obra, id_material);
        console.log("[Presupuesto] Resultado material:", data);

        if (!data) {
          setPresupuestoMaterial({ sinConfigurar: true });
          return;
        }

        const disponible = data.m3_presupuestados - data.m3_consumidos;
        const porcentaje = (data.m3_consumidos / data.m3_presupuestados) * 100;

        setPresupuestoMaterial({
          presupuestados: data.m3_presupuestados,
          consumidos: data.m3_consumidos,
          disponible: Math.max(0, disponible),
          porcentaje: Math.min(100, porcentaje),
          nivel: calcularNivel(data.m3_consumidos, data.m3_presupuestados),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setMaterialConsultado(true);
        console.log("[Presupuesto] materialConsultado = true");
      }
    };

    fetch();
  }, [id_obra, id_material]);

  // Consulta presupuesto de RENTA cuando cambia la obra
  useEffect(() => {
    if (!id_obra) {
      setPresupuestoRenta(null);
      setRentaConsultada(false);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await fetchPresupuestoRenta(id_obra);

        if (!data) {
          setPresupuestoRenta({ sinConfigurar: true });
          return;
        }

        const disponible = data.monto_presupuestado - data.monto_consumido;
        const porcentaje =
          (data.monto_consumido / data.monto_presupuestado) * 100;

        setPresupuestoRenta({
          presupuestado: data.monto_presupuestado,
          consumido: data.monto_consumido,
          disponible: Math.max(0, disponible),
          porcentaje: Math.min(100, porcentaje),
          nivel: calcularNivel(data.monto_consumido, data.monto_presupuestado),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRentaConsultada(true);
      }
    };

    fetch();
  }, [id_obra]);

  return {
    presupuestoMaterial,
    presupuestoRenta,
    loading,
    error,
    materialConsultado,
    rentaConsultada,
  };
};
