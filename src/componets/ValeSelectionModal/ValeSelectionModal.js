import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../config/colors";
import { useAuth } from "../../hooks/useAuth";
import ValeOptionButton from "./ValeOptionButton";
import styles from "./styles";

const ValeSelectionModal = () => {
  const navigation = useNavigation();
  const { userRole } = useAuth();

  // Los vales de carpeta asfáltica solo los emite la planta. El Residente
  // no los crea — el material asfáltico le llega ya despachado.
  const puedeCrearAsfaltico =
    userRole === "Planta de Asfaltos" || userRole === "Administrador";

  const handleRenta = () => {
    // CAMBIO: replace en lugar de navigate
    navigation.replace("ValeRentaScreen");
  };

  const handleMaterial = () => {
    // CAMBIO: replace en lugar de navigate
    navigation.replace("ValeMaterialScreen");
  };

  const handleMaterialAsfaltico = () => {
    navigation.replace("ValeMaterialAsfalticoScreen");
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.titulo}>Seleccionar Tipo de Vale</Text>

          {/* Botón para Material */}
          <ValeOptionButton
            iconName="cube-outline"
            text="Material"
            onPress={handleMaterial}
            color={colors.primary}
          />

          {/* Botón para Asfálticos - solo Planta de Asfaltos y Administrador */}
          {puedeCrearAsfaltico && (
            <ValeOptionButton
              iconName="road-variant"
              text="Asfálticos"
              onPress={handleMaterialAsfaltico}
              color={colors.accent}
            />
          )}

          {/* Botón para Renta */}
          <ValeOptionButton
            iconName="truck-cargo-container"
            text="Renta"
            onPress={handleRenta}
            color={colors.secondary}
          />

          {/* Botón Cancelar */}
          <TouchableOpacity style={styles.botonCerrar} onPress={handleClose}>
            <Text style={styles.textoCerrar}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ValeSelectionModal;
