// 1. React y hooks nativos
import React, { useState, useRef } from "react";

// 2. React Native
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../config/colors";

// 6. Subcomponentes
import TutorialTicketPreview from "./TutorialTicketPreview";
import TutorialInlineSpotlight from "./TutorialInlineSpotlight";

/**
 * TutorialValeDetalleModal
 *
 * Detalle simplificado del vale ficticio, mostrado en AcarreosScreen tras
 * la simulación de "Asignar Vehículo". A diferencia de ValeDetalleModal.js
 * real, NUNCA hace supabase.from(...) — el vale ya llega completo en
 * memoria vía prop.
 *
 * Un único <Modal> con fase interna "detalle" | "ticket" (evita apilar un
 * segundo Modal en Android).
 *
 * PROPS:
 * - visible, vale, onClose, onFinalizarTutorial
 */
const TutorialValeDetalleModal = ({ visible, vale, onClose, onFinalizarTutorial }) => {
  const [fase, setFase] = useState("detalle");
  const imprimirRef = useRef(null);

  if (!vale) return null;
  const detalle = vale.vale_material_detalles[0];

  const handleFinalizarTicket = () => {
    onFinalizarTutorial?.();
    onClose?.();
  };

  const handleClose = () => {
    setFase("detalle");
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {fase === "detalle" ? (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{vale.folio}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.badge}>
                <MaterialCommunityIcons name="progress-clock" size={16} color={colors.surface} />
                <Text style={styles.badgeText}>En proceso</Text>
              </View>

              <View style={styles.card}>
                <Fila label="Obra" valor={vale.obras.obra} />
                <Fila label="Material" valor={detalle.material.material} />
                <Fila label="Banco" valor={detalle.bancos.banco} />
                <Fila label="Distancia" valor={`${detalle.distancia_km} km`} />
                <Fila label="Cantidad pedida" valor={`${detalle.cantidad_pedida_m3} m³`} />
                <Fila label="Operador" valor={vale.operadores.nombre_completo} />
                <Fila label="Vehículo" valor={vale.vehiculos.placas} />
              </View>

              <TouchableOpacity
                ref={imprimirRef}
                style={styles.imprimirButton}
                onPress={() => setFase("ticket")}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="printer-pos" size={22} color={colors.surface} />
                <Text style={styles.imprimirButtonText}>Imprimir Primer Ticket</Text>
              </TouchableOpacity>
            </ScrollView>

            <TutorialInlineSpotlight
              active={fase === "detalle"}
              targetRef={imprimirRef}
              label="Toca para imprimir"
            />
          </View>
        </View>
      ) : (
        <TutorialTicketPreview vale={vale} onFinalizar={handleFinalizarTicket} />
      )}
    </Modal>
  );
};

const Fila = ({ label, valor }) => (
  <View style={styles.fila}>
    <Text style={styles.filaLabel}>{label}</Text>
    <Text style={styles.filaValor}>{valor}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: colors.valeStates.enProceso,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  filaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  filaValor: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  imprimirButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
  },
  imprimirButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TutorialValeDetalleModal;
