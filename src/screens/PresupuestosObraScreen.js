// src/screens/PresupuestosObraScreen.js
import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { useAuth } from "../hooks/useAuth";
import { useObras } from "../hooks/useObras";
import { useCatalogos } from "../hooks/useCatalogos";
import { usePresupuestosAdmin } from "../hooks/usePresupuestosAdmin";
import crossAlert from "../utils/crossAlert";
import CustomModalPicker from "../componets/forms/CustomModalPicker";
import {
  CardPresupuestoMaterial,
  CardPresupuestoRenta,
  formatM3,
} from "../componets/presupuestos/PresupuestoCards";
import {
  ModalEditarMaterial,
  ModalEditarRenta,
  ModalNuevoMaterial,
} from "../componets/presupuestos/PresupuestoModales";

// Constante a nivel de modulo: un array literal inline crearia un
// `refrescarCatalogos` nuevo en cada render de la pantalla.
const CATALOGOS_REQUERIDOS = ["materiales"];

export default function PresupuestosObraScreen() {
  const { userProfile } = useAuth();
  const { obras, loading: obrasLoading } = useObras(
    userProfile?.id_persona,
    true
  );
  const { materiales, refrescarCatalogos } = useCatalogos(CATALOGOS_REQUERIDOS);

  // Esta pantalla crea presupuestos para materiales que pueden acabar de
  // crearse (incluso manualmente en Supabase) — siempre pide el catálogo
  // fresco al abrir, sin depender de la caché de useCatalogos.
  useEffect(() => {
    refrescarCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [modal, setModal] = useState(null);
  const [refrescando, setRefrescando] = useState(false);
  // modal: { tipo: 'material'|'renta'|'nuevo_material', datos: {} }

  const {
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
  } = usePresupuestosAdmin(obraSeleccionada?.id, materiales);

  const obrasItems = useMemo(
    () =>
      obras.map((o) => ({
        id: o.id,
        label: o.cc ? `${o.nombre} (${o.cc})` : o.nombre,
      })),
    [obras]
  );

  const handleSeleccionarObra = useCallback(
    (idObra) => {
      const obra = obras.find((o) => o.id === idObra);
      if (obra) {
        setObraSeleccionada(obra);
        setModal(null);
      }
    },
    [obras]
  );

  const handleRefrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await Promise.all([refrescarCatalogos(), cargar()]);
    } finally {
      setRefrescando(false);
    }
  }, [refrescarCatalogos, cargar]);

  const abrirEditarMaterial = useCallback((item) => {
    setModal({
      tipo: "material",
      datos: {
        id_material: item.id_material,
        nombre: item.nombre,
        esAsfaltico: item.esAsfaltico,
        valorActual:
          item.presupuestados != null ? String(item.presupuestados) : "",
      },
    });
  }, []);

  const abrirNuevoMaterial = useCallback(() => {
    setModal({ tipo: "nuevo_material", datos: {} });
  }, []);

  const abrirEditarRenta = useCallback(() => {
    setModal({
      tipo: "renta",
      datos: {
        valorActual: presupuestoRenta
          ? String(presupuestoRenta.presupuestado)
          : "",
      },
    });
  }, [presupuestoRenta]);

  const cerrarModal = useCallback(() => setModal(null), []);

  const handleEliminarMaterial = useCallback(
    (item) => {
      crossAlert(
        "Eliminar presupuesto",
        `Se eliminara el presupuesto de "${item.nombre}". Esta accion se puede deshacer volviendo a configurarlo.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              try {
                await eliminarMaterial(item.id_material);
              } catch {
                Alert.alert("Error", "No se pudo eliminar el presupuesto.");
              }
            },
          },
        ]
      );
    },
    [eliminarMaterial]
  );

  const handleEliminarRenta = useCallback(() => {
    crossAlert(
      "Eliminar presupuesto de renta",
      "Se eliminara el presupuesto de renta de equipo. Esta accion se puede deshacer volviendo a configurarlo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarRenta();
            } catch {
              Alert.alert(
                "Error",
                "No se pudo eliminar el presupuesto de renta."
              );
            }
          },
        },
      ]
    );
  }, [eliminarRenta]);

  const handleGuardarMaterial = useCallback(
    async (id_material, m3Texto) => {
      const m3 = parseFloat(String(m3Texto).replace(/,/g, ""));
      if (!id_material || !Number.isFinite(m3) || m3 <= 0) {
        Alert.alert("Valor invalido", "Ingresa un numero mayor a 0.");
        return;
      }
      try {
        await guardarMaterial(id_material, m3);
        cerrarModal();
      } catch {
        Alert.alert("Error", "No se pudo guardar el presupuesto.");
      }
    },
    [guardarMaterial, cerrarModal]
  );

  const handleGuardarRenta = useCallback(
    async (montoTexto) => {
      const monto = parseFloat(String(montoTexto).replace(/,/g, ""));
      if (!Number.isFinite(monto) || monto <= 0) {
        Alert.alert("Valor invalido", "Ingresa un monto mayor a 0.");
        return;
      }
      try {
        await guardarRenta(monto);
        cerrarModal();
      } catch {
        Alert.alert("Error", "No se pudo guardar el presupuesto de renta.");
      }
    },
    [guardarRenta, cerrarModal]
  );

  const materialesSinPresupuesto = useMemo(
    () =>
      materiales.filter(
        (m) => !presupuestosMaterial.some((p) => p.id_material === m.id_material)
      ),
    [materiales, presupuestosMaterial]
  );

  const resumen = useMemo(() => {
    const presupuestado = presupuestosMaterial.reduce(
      (acc, p) => acc + p.presupuestados,
      0
    );
    const disponible = presupuestosMaterial.reduce(
      (acc, p) => acc + p.disponible,
      0
    );
    const enAlerta = presupuestosMaterial.filter(
      (p) => p.nivel === "danger" || p.nivel === "blocked"
    ).length;

    return { presupuestado, disponible, enAlerta };
  }, [presupuestosMaterial]);

  // ─── Contenido segun estado ────────────────────────────────────────────────
  const renderContenido = () => {
    if (!obraSeleccionada) {
      return (
        <View style={estilos.centrado}>
          <MaterialCommunityIcons
            name="office-building-outline"
            size={52}
            color={colors.border}
          />
          <Text style={estilos.placeholderTitulo}>Selecciona una obra</Text>
          <Text style={estilos.placeholderTexto}>
            Elige una obra arriba para ver y configurar sus presupuestos de
            material y renta.
          </Text>
        </View>
      );
    }

    // Durante el pull-to-refresh no se cambia a la pantalla de carga: el
    // RefreshControl ya da feedback y el listado se queda visible.
    if (loading && !refrescando) {
      return (
        <View style={estilos.centrado}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={estilos.placeholderTexto}>Cargando presupuestos...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={estilos.centrado}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={44}
            color={colors.danger}
          />
          <Text style={estilos.placeholderTitulo}>
            No se pudieron cargar los presupuestos
          </Text>
          <Text style={estilos.placeholderTexto}>{error}</Text>
          <TouchableOpacity
            style={estilos.btnReintentar}
            onPress={cargar}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={16}
              color={colors.surface}
            />
            <Text style={estilos.btnReintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={handleRefrescar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Resumen de la obra */}
        {presupuestosMaterial.length > 0 && (
          <View style={estilos.resumen}>
            <ResumenItem
              icono="clipboard-text-outline"
              label="Presupuestado"
              valor={formatM3(resumen.presupuestado)}
              color={colors.secondary}
            />
            <View style={estilos.resumenSeparador} />
            <ResumenItem
              icono="cube-scan"
              label="Disponible"
              valor={formatM3(resumen.disponible)}
              color={colors.accent}
            />
            <View style={estilos.resumenSeparador} />
            <ResumenItem
              icono="alert-outline"
              label="En alerta"
              valor={String(resumen.enAlerta)}
              color={resumen.enAlerta > 0 ? colors.danger : colors.textSecondary}
            />
          </View>
        )}

        {/* Sección Materiales */}
        <View style={estilos.seccionEncabezado}>
          <Text style={estilos.seccionTitulo}>
            Materiales
            {presupuestosMaterial.length > 0
              ? ` (${presupuestosMaterial.length})`
              : ""}
          </Text>
          <TouchableOpacity
            style={estilos.botonAgregarSmall}
            onPress={abrirNuevoMaterial}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="plus"
              size={16}
              color={colors.surface}
            />
            <Text style={estilos.botonAgregarSmallTexto}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {presupuestosMaterial.length === 0 ? (
          <View style={estilos.cardVacio}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={30}
              color={colors.textSecondary}
            />
            <Text style={estilos.cardVacioTexto}>
              Sin presupuestos de material configurados
            </Text>
            <TouchableOpacity
              style={estilos.botonAgregarGrande}
              onPress={abrirNuevoMaterial}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="plus"
                size={16}
                color={colors.surface}
              />
              <Text style={estilos.botonAgregarGrandeTexto}>
                Agregar material
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          presupuestosMaterial.map((item) => (
            <CardPresupuestoMaterial
              key={item.id_material}
              item={item}
              onEditar={abrirEditarMaterial}
              onEliminar={handleEliminarMaterial}
            />
          ))
        )}

        {/* Sección Renta */}
        <View style={[estilos.seccionEncabezado, { marginTop: 22 }]}>
          <Text style={estilos.seccionTitulo}>Renta</Text>
        </View>
        <CardPresupuestoRenta
          renta={presupuestoRenta}
          onEditar={abrirEditarRenta}
          onEliminar={handleEliminarRenta}
        />
      </ScrollView>
    );
  };

  return (
    <View style={estilos.contenedor}>
      {/* Selector de obra */}
      <View style={estilos.selectorWrapper}>
        <CustomModalPicker
          label="Obra"
          value={obraSeleccionada?.id ?? null}
          onValueChange={handleSeleccionarObra}
          items={obrasItems}
          placeholder="Selecciona una obra..."
          loading={obrasLoading}
        />
      </View>

      {renderContenido()}

      <ModalEditarMaterial
        visible={modal?.tipo === "material"}
        datos={modal?.datos}
        guardando={guardando}
        onGuardar={handleGuardarMaterial}
        onCerrar={cerrarModal}
      />

      <ModalEditarRenta
        visible={modal?.tipo === "renta"}
        datos={modal?.datos}
        guardando={guardando}
        onGuardar={handleGuardarRenta}
        onCerrar={cerrarModal}
      />

      <ModalNuevoMaterial
        visible={modal?.tipo === "nuevo_material"}
        materiales={materialesSinPresupuesto}
        guardando={guardando}
        onGuardar={handleGuardarMaterial}
        onCerrar={cerrarModal}
      />
    </View>
  );
}

// ─── Tarjeta de resumen ───────────────────────────────────────────────────────
const ResumenItem = ({ icono, label, valor, color }) => (
  <View style={estilos.resumenItem}>
    <MaterialCommunityIcons name={icono} size={18} color={color} />
    <Text style={[estilos.resumenValor, { color }]} numberOfLines={1}>
      {valor}
    </Text>
    <Text style={estilos.resumenLabel}>{label}</Text>
  </View>
);

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectorWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  scroll: { flex: 1 },
  scrollContenido: {
    padding: 14,
    paddingBottom: 40,
  },

  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 36,
  },
  placeholderTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  placeholderTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  btnReintentar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  btnReintentarTexto: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },

  resumen: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    marginBottom: 18,
  },
  resumenItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 4,
  },
  resumenValor: {
    fontSize: 13,
    fontWeight: "700",
  },
  resumenLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resumenSeparador: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },

  seccionEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  botonAgregarSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  botonAgregarSmallTexto: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "600",
  },

  cardVacio: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 10,
  },
  cardVacioTexto: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  botonAgregarGrande: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 4,
  },
  botonAgregarGrandeTexto: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "600",
  },
});
