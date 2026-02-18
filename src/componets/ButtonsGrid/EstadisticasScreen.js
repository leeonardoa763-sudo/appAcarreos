import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";

const StatCard = ({ icon, value, label, color, loading }) => (
  <View style={styles.statCard}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    {loading ? (
      <ActivityIndicator size="small" color={color} style={styles.loader} />
    ) : (
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    )}
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StatsCards = ({ obras }) => {
  const [stats, setStats] = useState({
    valesToday: 0,
    valesActivos: 0,
    montoSemanal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (obras && obras.length > 0) {
      fetchStats();
    }
  }, [obras]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const obrasIds = obras.map((o) => o.id);

      // Obtener fecha de hoy (inicio del día)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Obtener inicio de semana (lunes)
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      // Query para vales de hoy
      const { data: valesTodayData, error: todayError } = await supabase
        .from("vales")
        .select("id_vale")
        .in("id_obra", obrasIds)
        .gte("fecha_creacion", today.toISOString())
        .neq("estado", "archivado");

      if (todayError) throw todayError;

      // Query para vales activos (no archivados ni conciliados)
      const { data: valesActivosData, error: activosError } = await supabase
        .from("vales")
        .select("id_vale")
        .in("id_obra", obrasIds)
        .in("estado", ["en_proceso", "emitido", "verificado"]);

      if (activosError) throw activosError;

      // Query para monto semanal (Material)
      const { data: valesMaterialSemana, error: materialError } = await supabase
        .from("vales")
        .select(
          `
          id_vale,
          vale_material_detalles (
            cantidad_pedida_m3,
            precio_material (
              costo_m3
            )
          )
        `,
        )
        .in("id_obra", obrasIds)
        .eq("tipo_vale", "material")
        .gte("fecha_creacion", startOfWeek.toISOString())
        .neq("estado", "archivado");

      if (materialError) throw materialError;

      // Query para monto semanal (Renta)
      const { data: valesRentaSemana, error: rentaError } = await supabase
        .from("vales")
        .select(
          `
          id_vale,
          vale_renta_detalle (
            hora_inicio,
            hora_fin,
            precios_renta (
              costo_hr,
              costo_dia
            )
          )
        `,
        )
        .in("id_obra", obrasIds)
        .eq("tipo_vale", "renta")
        .gte("fecha_creacion", startOfWeek.toISOString())
        .neq("estado", "archivado");

      if (rentaError) throw rentaError;

      // Calcular monto de material
      let montoMaterial = 0;
      if (valesMaterialSemana) {
        valesMaterialSemana.forEach((vale) => {
          if (vale.vale_material_detalles?.[0]) {
            const detalle = vale.vale_material_detalles[0];
            const cantidad = detalle.cantidad_pedida_m3 || 0;
            const precio = detalle.precio_material?.costo_m3 || 0;
            montoMaterial += cantidad * precio;
          }
        });
      }

      // Calcular monto de renta
      let montoRenta = 0;
      if (valesRentaSemana) {
        valesRentaSemana.forEach((vale) => {
          if (vale.vale_renta_detalle?.[0]) {
            const detalle = vale.vale_renta_detalle[0];
            const precio = detalle.precios_renta?.costo_hr || 0;

            if (detalle.hora_inicio && detalle.hora_fin) {
              const inicio = new Date(detalle.hora_inicio);
              const fin = new Date(detalle.hora_fin);
              const horas = (fin - inicio) / (1000 * 60 * 60);
              montoRenta += horas * precio;
            }
          }
        });
      }

      const montoTotal = montoMaterial + montoRenta;

      setStats({
        valesToday: valesTodayData?.length || 0,
        valesActivos: valesActivosData?.length || 0,
        montoSemanal: montoTotal,
      });
    } catch (error) {
      console.error("[StatsCards] Error:", error);
      setStats({
        valesToday: 0,
        valesActivos: 0,
        montoSemanal: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMonto = (monto) => {
    if (monto >= 1000) {
      return `$${(monto / 1000).toFixed(1)}K`;
    }
    return `$${monto.toFixed(0)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="chart-box"
          size={24}
          color={colors.primary}
        />
        <Text style={styles.title}>Resumen Rápido</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="calendar-today"
          value={stats.valesToday}
          label="Hoy"
          color={colors.primary}
          loading={loading}
        />
        <StatCard
          icon="progress-clock"
          value={stats.valesActivos}
          label="Activos"
          color={colors.warning}
          loading={loading}
        />
        <StatCard
          icon="cash-multiple"
          value={formatMonto(stats.montoSemanal)}
          label="Semana"
          color={colors.accent}
          loading={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loader: {
    marginVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});

export default StatsCards;
