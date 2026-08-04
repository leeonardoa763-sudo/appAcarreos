import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../config/colors";
import { AYUDA_URLS } from "../../config/ayuda";
import { useAuth } from "../../hooks/useAuth";
import { MODO_PIPA } from "../../utils/pipasAgua";
import abrirAyuda from "../../utils/abrirAyuda";
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

  const handlePipa = () => {
    // Misma pantalla de renta, en modo pipa de agua (ver ValeRentaScreen).
    navigation.replace("ValeRentaScreen", { modo: MODO_PIPA });
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

          {/* Botón para Pipa de Agua */}
          <ValeOptionButton
            iconName="water-pump"
            text="Pipa de Agua"
            onPress={handlePipa}
            color={colors.info}
          />

          {/* Ayuda: la portada del Centro de Ayuda ES el menú de estos mismos
              cuatro tipos, así que el usuario elige ahí lo mismo que iba a
              elegir aquí y cae en su tutorial */}
          <TouchableOpacity
            style={styles.filaAyuda}
            onPress={() => abrirAyuda(AYUDA_URLS.portada)}
          >
            <MaterialCommunityIcons
              name="help-circle-outline"
              size={18}
              color={colors.secondary}
            />
            <Text style={styles.textoAyuda}>¿Cómo se crea un vale?</Text>
          </TouchableOpacity>

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
