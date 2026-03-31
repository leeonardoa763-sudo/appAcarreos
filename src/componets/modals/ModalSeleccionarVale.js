// 1. React y hooks
import React, { useCallback } from "react";

// 2. React Native
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../config/colors";

/**
 * ModalSeleccionarVale
 *
 * Aparece cuando un vehículo tiene 2+ vales en_proceso activos.
 * Muestra tarjetas con info suficiente para que el usuario
 * identifique el vale correcto sin equivocarse.
 *
 * PROPS:
 * - visible: boolean
 * - vales: array — vales en_proceso del vehículo escaneado
 * - buscando: boolean — mientras se consulta BD tras escaneo
 * - onSeleccionar: function(vale) — usuario elige un vale
 * - onClose: function
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTipoConfig = (tipoVale) => {
  if (tipoVale === "material") {
    return {
      color: colors.primary,
      icono: "package-variant",
      etiqueta: "MATERIAL",
      fondo: "#FFF3EE",
      borde: "#FFCBB3",
    };
  }
  return {
    color: colors.secondary,
    icono: "truck-cargo-container",
    etiqueta: "RENTA",
    fondo: "#EEF4FF",
    borde: "#B3CCFF",
  };
};

const getNombreMaterial = (vale) => {
  if (vale.tipo_vale === "material") {
    return (
      vale.vale_material_detalles?.[0]?.material?.material || "Sin material"
    );
  }
  return vale.vale_renta_detalle?.[0]?.material?.material || "Sin material";
};

// ─── Subcomponente: tarjeta de vale ───────────────────────────────────────────

const TarjetaVale = ({ vale, onSeleccionar }) => {
  const config = getTipoConfig(vale.tipo_vale);
  const nombreMaterial = getNombreMaterial(vale);
  const nombreOperador = vale.operadores?.nombre_completo || "Sin operador";
  const placas = vale.vehiculos?.placas || "";

  return (
    <TouchableOpacity
      style={[
        styles.tarjeta,
        { borderColor: config.borde, backgroundColor: config.fondo },
      ]}
      onPress={() => onSeleccionar(vale)}
      activeOpacity={0.75}
    >
      {/* Badge de tipo */}
      <View style={[styles.tipoBadge, { backgroundColor: config.color }]}>
        <MaterialCommunityIcons name={config.icono} size={14} color="#FFFFFF" />
        <Text style={styles.tipoBadgeTexto}>{config.etiqueta}</Text>
      </View>

      {/* Folio */}
      <Text style={[styles.folio, { color: config.color }]}>{vale.folio}</Text>

      {/* Material — destacado visualmente */}
      <View style={styles.materialRow}>
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={16}
          color={config.color}
        />
        <Text style={styles.materialTexto} numberOfLines={2}>
          {nombreMaterial}
        </Text>
      </View>

      {/* Operador */}
      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="account-hard-hat"
          size={14}
          color={colors.textSecondary}
        />
        <Text style={styles.infoTexto} numberOfLines={1}>
          {nombreOperador}
        </Text>
      </View>

      {/* Placas */}
      {placas ? (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="card-text"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.infoTexto}>{placas}</Text>
        </View>
      ) : null}

      {/* Flecha de acción */}
      <View style={styles.accionRow}>
        <Text style={[styles.accionTexto, { color: config.color }]}>
          Ir a este vale
        </Text>
        <MaterialCommunityIcons
          name="arrow-right-circle"
          size={20}
          color={config.color}
        />
      </View>
    </TouchableOpacity>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const ModalSeleccionarVale = ({
  visible,
  vales = [],
  buscando,
  onSeleccionar,
  onClose,
}) => {
  const handleSeleccionar = useCallback(
    (vale) => {
      onClose();
      // Delay para dejar cerrar el modal antes de navegar
      setTimeout(() => {
        onSeleccionar(vale);
      }, 350);
    },
    [onClose, onSeleccionar],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.contenedor}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIzquierda}>
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={22}
                color={colors.secondary}
              />
              <Text style={styles.headerTitulo}>Seleccionar Vale</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.botonCerrar}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.separador} />

          {/* Estado: buscando */}
          {buscando ? (
            <View style={styles.cargandoContainer}>
              <ActivityIndicator size="large" color={colors.secondary} />
              <Text style={styles.cargandoTexto}>
                Buscando vales activos...
              </Text>
            </View>
          ) : (
            <>
              {/* Subtítulo informativo */}
              <View style={styles.avisoContainer}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color={colors.secondary}
                />
                <Text style={styles.avisoTexto}>
                  Este vehículo tiene {vales.length} vales activos. Selecciona
                  el correcto.
                </Text>
              </View>

              {/* Lista de vales */}
              <ScrollView
                style={styles.lista}
                contentContainerStyle={styles.listaContent}
                showsVerticalScrollIndicator={false}
              >
                {vales.map((vale) => (
                  <TarjetaVale
                    key={vale.id_vale}
                    vale={vale}
                    onSeleccionar={handleSeleccionar}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ModalSeleccionarVale;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.60)",
    justifyContent: "flex-end",
  },
  contenedor: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 32,
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerIzquierda: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  botonCerrar: {
    padding: 4,
  },
  separador: {
    height: 1,
    backgroundColor: colors.border || "#E5E7EB",
    marginHorizontal: 20,
  },

  // ─── Aviso ────────────────────────────────────────────────────────────────
  avisoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
  },
  avisoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // ─── Lista ────────────────────────────────────────────────────────────────
  lista: {
    marginTop: 8,
  },
  listaContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },

  // ─── Tarjeta ──────────────────────────────────────────────────────────────
  tarjeta: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
  },
  tipoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 2,
  },
  tipoBadgeTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  folio: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  materialTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  accionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 8,
  },
  accionTexto: {
    fontSize: 13,
    fontWeight: "600",
  },

  // ─── Cargando ─────────────────────────────────────────────────────────────
  cargandoContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 14,
  },
  cargandoTexto: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
