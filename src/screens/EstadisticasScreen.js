// src/screens/EstadisticasScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { statsColors } from "../config/statsColors";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";
import { useObras } from "../hooks/useObras";
import EstadisticasMaterialTab from "../componets/stats/EstadisticasMaterialTab";
import EstadisticasRentaTab from "../componets/stats/EstadisticasRentaTab";

// import EstadisticasRentaTab from "../componets/stats/EstadisticasRentaTab";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERIODOS = [
  { id: "hoy", label: "Hoy", icono: "calendar-today" },
  { id: "ayer", label: "Ayer", icono: "calendar-arrow-left" },
  { id: "semana", label: "Semana", icono: "calendar-week" },
  { id: "mes", label: "Mes", icono: "calendar-month" },
  { id: "trimestre", label: "Trimestre", icono: "calendar-range" },
  { id: "semestre", label: "Semestre", icono: "calendar-multiple" },
  { id: "año", label: "Año", icono: "calendar" },
];

const TABS = [
  { id: "material", label: "Material", icono: "package-variant" },
  { id: "renta", label: "Renta", icono: "truck-cargo-container" },
  { id: "pipas", label: "Pipas", icono: "water-pump" },
];

// ─── Componente principal ─────────────────────────────────────────────────────

const EstadisticasScreen = () => {
  // ── Estados centrales ──────────────────────────────────────────────────────
  const [periodo, setPeriodo] = useState("mes");
  const [tabActiva, setTabActiva] = useState("material");
  const [obraId, setObraId] = useState(null); // null = todas las obras
  const [modalObrasVisible, setModalObrasVisible] = useState(false);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { userProfile } = useAuth();
  const { obras, loading: loadingObras } = useObras(userProfile?.id_persona);

  const residenteId = userProfile?.id_persona ?? null;
  const obrasIds = obras.map((o) => o.id).filter(Boolean);

  // Refrescar matviews de estadísticas al montar (fire and forget)
  useEffect(() => {
    supabase.rpc("refrescar_stats").then(({ error }) => {
      if (error) console.warn("[EstadisticasScreen] refrescar_stats:", error.message);
    });
  }, []);

  // Preseleccionar primera obra cuando cargan
  useEffect(() => {
    if (obras.length > 0 && obraId === null) {
      setObraId(obras[0].id);
    }
  }, [obras]);

  // Nombre de la obra seleccionada para mostrar en el boton
  const obraSeleccionadaLabel = obraId
    ? (obras.find((o) => o.id === obraId)?.nombre ?? "Obra")
    : "Cargando...";

  // Cuenta si hay filtro de obra activo (para badge)
  const hayFiltroObra = obraId !== null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSeleccionarObra = (id) => {
    setObraId(id);
    setModalObrasVisible(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Header fijo ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MaterialCommunityIcons
            name="chart-line"
            size={26}
            color={colors.primary}
          />
          <Text style={styles.headerTitulo}>Estadísticas</Text>
        </View>

        {/* Selector de periodo */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodoScroll}
        >
          {/* Boton de filtro de obra */}
          <TouchableOpacity
            style={[styles.obraBtn, hayFiltroObra && styles.obraBtnActivo]}
            onPress={() => setModalObrasVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="office-building-outline"
              size={15}
              color={hayFiltroObra ? colors.surface : colors.textSecondary}
            />
            <Text
              style={[
                styles.periodoBtnText,
                hayFiltroObra && styles.periodoBtnTextActivo,
              ]}
              numberOfLines={1}
            >
              {obraSeleccionadaLabel}
            </Text>
          </TouchableOpacity>

          {PERIODOS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.periodoBtn,
                periodo === p.id && styles.periodoBtnActivo,
              ]}
              onPress={() => setPeriodo(p.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={p.icono}
                size={15}
                color={periodo === p.id ? colors.surface : colors.textSecondary}
              />
              <Text
                style={[
                  styles.periodoBtnText,
                  periodo === p.id && styles.periodoBtnTextActivo,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab switch Material / Renta */}
        <View style={styles.tabSwitch}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabBtn,
                tabActiva === tab.id && styles.tabBtnActivo,
              ]}
              onPress={() => setTabActiva(tab.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={tab.icono}
                size={17}
                color={
                  tabActiva === tab.id ? colors.surface : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabBtnText,
                  tabActiva === tab.id && styles.tabBtnTextActivo,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Contenido del tab ────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tabActiva === "material" && (
          <EstadisticasMaterialTab
            periodo={periodo}
            residenteId={residenteId}
            obraId={obraId}
            obrasIds={obrasIds}
          />
        )}

        {tabActiva === "renta" && (
          <EstadisticasRentaTab
            periodo={periodo}
            residenteId={residenteId}
            obraId={obraId}
          />
        )}

        {tabActiva === "pipas" && (
          <EstadisticasRentaTab
            periodo={periodo}
            residenteId={residenteId}
            obraId={obraId}
            esPipa
          />
        )}
      </ScrollView>

      {/* ── Modal de selección de obra ───────────────────────────────────── */}
      <ModalObras
        visible={modalObrasVisible}
        obras={obras}
        loading={loadingObras}
        obraIdActual={obraId}
        onSeleccionar={handleSeleccionarObra}
        onClose={() => setModalObrasVisible(false)}
      />
    </View>
  );
};

// ─── Subcomponente: Modal de obras ────────────────────────────────────────────

const ModalObras = ({
  visible,
  obras,
  loading,
  obraIdActual,
  onSeleccionar,
  onClose,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        {/* Header modal */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitulo}>Seleccionar obra</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.modalLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Lista de obras */}
            {obras.map((obra) => (
              <TouchableOpacity
                key={obra.id}
                style={[
                  styles.obraItem,
                  obraIdActual === obra.id && styles.obraItemActivo,
                ]}
                onPress={() => onSeleccionar(obra.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={
                    obraIdActual === obra.id
                      ? "radiobox-marked"
                      : "radiobox-blank"
                  }
                  size={22}
                  color={
                    obraIdActual === obra.id
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <View style={styles.obraItemTextos}>
                  <Text
                    style={[
                      styles.obraItemNombre,
                      obraIdActual === obra.id && styles.obraItemNombreActivo,
                    ]}
                  >
                    {obra.nombre}
                  </Text>
                  <Text style={styles.obraItemDetalle}>CC: {obra.cc}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {obras.length === 0 && (
              <View style={styles.modalVacio}>
                <Text style={styles.modalVacioText}>
                  No tienes obras asignadas
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  </Modal>
);

export default EstadisticasScreen;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: statsColors.backgrounds.screen,
  },

  // Header fijo
  header: {
    backgroundColor: colors.surface,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  // Barra de periodos
  periodoScroll: {
    gap: 8,
    paddingRight: 4,
  },
  periodoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodoBtnActivo: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  periodoBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  periodoBtnTextActivo: {
    color: colors.surface,
    fontWeight: "600",
  },

  // Boton de obra (mismo estilo que periodo pero con X para limpiar)
  obraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 160,
  },
  obraBtnActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // Tab switch
  tabSwitch: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabBtnActivo: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  tabBtnTextActivo: {
    color: colors.surface,
    fontWeight: "600",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Proximamente (placeholder renta)
  proximamente: {
    paddingVertical: 80,
    alignItems: "center",
    gap: 12,
  },
  proximamenteText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  proximamenteSubtitle: {
    fontSize: 13,
    color: colors.border,
  },

  // Modal obras
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalLoading: {
    paddingVertical: 32,
    alignItems: "center",
  },
  modalVacio: {
    paddingVertical: 24,
    alignItems: "center",
  },
  modalVacioText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Items de obra en modal
  obraItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  obraItemActivo: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  obraItemTextos: {
    flex: 1,
    gap: 2,
  },
  obraItemNombre: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  obraItemNombreActivo: {
    color: colors.primary,
    fontWeight: "600",
  },
  obraItemDetalle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
