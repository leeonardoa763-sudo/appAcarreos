/**
 * components/acarreos/ValeDetalleModal.js (REFACTORIZADO)
 *
 * Modal wrapper que decide qué componente mostrar según tipo de vale
 *
 * OPTIMIZACIONES:
 * - Eliminado early return que violaba reglas de hooks
 * - Separada lógica de Material y Renta en componentes dedicados
 * - Eliminados console.logs innecesarios
 * - Componente ligero de solo 80 líneas
 *
 * PROPÓSITO:
 * - Proveer estructura de modal (overlay, header, cierre)
 * - Decidir entre ValeDetalleMaterial o ValeDetalleRenta
 * - Manejar cleanup de estados al cerrar
 *
 * USADO EN:
 * - AcarreosScreen
 */

import React, { useEffect, useMemo } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { useAuth } from "../../hooks/useAuth";

import ValeDetalleMaterial from "./ValeDetalleMaterial";
import ValeDetalleRenta from "./ValeDetalleRenta";
import ImprimirTicketButton from "./ImprimirTicketButton";

const ValeDetalleModal = ({ visible, vale, onClose, onRefresh }) => {
  const { userProfile } = useAuth();
  // Determinar tipo de vale
  const tipoVale = useMemo(() => {
    if (!vale) return null;
    return vale.tipo_vale;
  }, [vale?.id_vale, vale?.tipo_vale]);

  const isMaterial = tipoVale === "material";
  const isRenta = tipoVale === "renta";

  // Cleanup al cerrar
  useEffect(() => {
    if (!visible) {
      // Reset se maneja dentro de cada componente hijo
    }
  }, [visible]);

  // Early return DESPUÉS de todos los hooks
  if (!vale || !tipoVale) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              isMaterial && styles.modalHeaderMaterial,
              isRenta && styles.modalHeaderRenta,
            ]}
          >
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name={isMaterial ? "package-variant" : "truck-cargo-container"}
                size={28}
                color="#FFFFFF"
              />
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle}>
                  Vale de {isMaterial ? "Material" : "Renta"}
                </Text>
                <Text style={styles.modalFolio}>{vale.folio}</Text>
                <ImprimirTicketButton
                  valeId={vale.id_vale}
                  valeData={vale}
                  impresiones={vale.impresiones_ticket}
                  estado={vale.estado}
                  onImpreso={onRefresh}
                />
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Contenido dinámico según tipo */}
          {isMaterial && (
            <ValeDetalleMaterial
              vale={vale}
              onClose={onClose}
              onRefresh={onRefresh}
              userProfile={userProfile}
            />
          )}

          {isRenta && (
            <ValeDetalleRenta
              vale={vale}
              onClose={onClose}
              onRefresh={onRefresh}
              userProfile={userProfile}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ValeDetalleModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end", // ← Regresar a flex-end
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%", // ← CAMBIAR de maxHeight a height
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeaderMaterial: {
    backgroundColor: colors.primary,
  },
  modalHeaderRenta: {
    backgroundColor: colors.secondary,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalFolio: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
});
