import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ValeOptionButton from "./ValeOptionButton";
import styles from "./styles";

// Componente principal - ahora mucho más limpio y organizado
const ValeSelectionModal = () => {
  const navigation = useNavigation();

  // Funciones de navegación
  const handleRenta = () => navigation.navigate("ValeRentaScreen");
  const handleMaterial = () => navigation.navigate("ValeMaterialScreen");
  const handleClose = () => navigation.goBack();

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

          {/* Botón para Renta - reutilizando el componente */}
          <ValeOptionButton
            iconName="truck-cargo-container"
            text="Renta"
            onPress={handleRenta}
            color="black"
          />

          {/* Botón para Material - reutilizando el componente */}
          <ValeOptionButton
            iconName="terrain"
            text="Material"
            onPress={handleMaterial}
            color="black"
          />

          {/* Botón Cancelar (no usa el componente reutilizable porque es diferente) */}
          <TouchableOpacity style={styles.botonCerrar} onPress={handleClose}>
            <Text style={styles.textoCerrar}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ValeSelectionModal;
