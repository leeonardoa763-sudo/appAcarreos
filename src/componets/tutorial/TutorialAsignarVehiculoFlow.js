// 1. React
import React from "react";

// 2. React Native
import { View, Text, ActivityIndicator, StyleSheet, Modal } from "react-native";

// 4. Config
import { colors } from "../../config/colors";

// 6. Subcomponentes
import TutorialCamaraFake from "./TutorialCamaraFake";
import TutorialAsignarReplica from "./TutorialAsignarReplica";
import TutorialAsignarExito from "./TutorialAsignarExito";

/**
 * TutorialAsignarVehiculoFlow
 *
 * Orquestador del flujo simulado de "Asignar Vehículo". Un único <Modal>
 * que cambia de contenido según flow.phase — nunca se apila un segundo
 * Modal (evita la trampa de Android documentada en componets/CLAUDE.md).
 *
 * Fases "idle" y "resultado" reutilizan TutorialAsignarReplica, que a su
 * vez reutiliza los componentes de presentación REALES de
 * src/componets/modals/asignarVehiculo/ (mismo aspecto exacto que en
 * producción) con datos ficticios.
 *
 * PROPS:
 * - flow: objeto devuelto por useTutorialAsignarFlow()
 */
const TutorialAsignarVehiculoFlow = ({ flow }) => {
  return (
    <Modal
      visible={flow.active}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={flow.cancelar}
    >
      {(flow.phase === "idle" || flow.phase === "resultado") && (
        <TutorialAsignarReplica
          phase={flow.phase}
          onAbrirCamara={flow.handleAbrirCamara}
          onAsignar={flow.handleAsignar}
          onCancelar={flow.cancelar}
        />
      )}

      {flow.phase === "camera" && (
        <TutorialCamaraFake onDetectado={flow.handleQrDetectado} onCancelar={flow.cancelar} />
      )}

      {flow.phase === "asignando" && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Asignando vehículo...</Text>
        </View>
      )}

      {flow.phase === "exito" && <TutorialAsignarExito onContinuar={flow.handleIrAAcarreos} />}
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default TutorialAsignarVehiculoFlow;
