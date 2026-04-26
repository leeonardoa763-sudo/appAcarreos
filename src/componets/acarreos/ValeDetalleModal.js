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

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../config/supabase";
import { VALE_SELECT_COMPLETO } from "../../hooks/queries/valesSelect";

import ValeDetalleMaterial from "./ValeDetalleMaterial";
import ValeDetalleRenta from "./ValeDetalleRenta";

const ValeDetalleModal = ({ visible, vale, onClose, onRefresh }) => {
  const { userProfile } = useAuth();
  const [valeCompleto, setValeCompleto] = useState(null);
  const [loadingVale, setLoadingVale] = useState(false);

  // Determinar tipo de vale
  const tipoVale = useMemo(() => {
    if (!vale) return null;
    return vale.tipo_vale;
  }, [vale?.id_vale, vale?.tipo_vale]);

  const isMaterial = tipoVale === "material";
  const isRenta = tipoVale === "renta";

  // Cargar datos completos al abrir — la lista usa un select ligero
  useEffect(() => {
    if (!visible || !vale?.id_vale) {
      setValeCompleto(null);
      return;
    }
    let activo = true;
    const fetchCompleto = async () => {
      setLoadingVale(true);
      try {
        const { data, error } = await supabase
          .from("vales")
          .select(VALE_SELECT_COMPLETO)
          .eq("id_vale", vale.id_vale)
          .maybeSingle();
        if (error) throw error;
        if (activo) setValeCompleto(data);
      } catch (err) {
        console.error("[ValeDetalleModal] Error fetchCompleto:", err.message);
      } finally {
        if (activo) setLoadingVale(false);
      }
    };
    fetchCompleto();
    return () => { activo = false; };
  }, [visible, vale?.id_vale]);

  // Al refrescar desde el hijo, actualiza el vale completo y notifica a la lista
  const handleRefresh = useCallback(async () => {
    if (vale?.id_vale) {
      const { data } = await supabase
        .from("vales")
        .select(VALE_SELECT_COMPLETO)
        .eq("id_vale", vale.id_vale)
        .maybeSingle();
      if (data) setValeCompleto(data);
    }
    onRefresh?.();
  }, [vale?.id_vale, onRefresh]);

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
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Spinner mientras cargan los datos completos */}
          {loadingVale && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isMaterial ? colors.primary : colors.secondary} />
            </View>
          )}

          {/* Contenido dinámico según tipo */}
          {!loadingVale && valeCompleto && isMaterial && (
            <ValeDetalleMaterial
              vale={valeCompleto}
              onClose={onClose}
              onRefresh={handleRefresh}
              userProfile={userProfile}
            />
          )}

          {!loadingVale && valeCompleto && isRenta && (
            <ValeDetalleRenta
              vale={valeCompleto}
              onClose={onClose}
              onRefresh={handleRefresh}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
