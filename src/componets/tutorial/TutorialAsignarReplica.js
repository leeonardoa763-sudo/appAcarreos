// 1. React y hooks nativos
import React, { useState, useRef } from "react";

// 2. React Native
import { View, Text, TouchableOpacity, ScrollView, Platform, StatusBar } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 4. Config
import { colors } from "../../config/colors";

// 5. Estilos y componentes REALES del modal de asignación (puros,
// controlados por props, sin I/O propio — reutilizados tal cual)
import asignarStyles from "../modals/asignarVehiculo/asignarStyles";
import CardVehiculo from "../modals/asignarVehiculo/CardVehiculo";
import ListaValesDisponibles from "../modals/asignarVehiculo/ListaValesDisponibles";
import { EstadoIdle } from "../modals/asignarVehiculo/EstadosUI";
import ConfirmarOperadorCard from "../modals/asignarVehiculo/ConfirmarOperadorCard";

// 6. Subcomponentes del tutorial
import TutorialInlineSpotlight from "./TutorialInlineSpotlight";

// 7. Datos ficticios
import {
  TUTORIAL_VEHICULO_FAKE,
  TUTORIAL_VALE_DISPONIBLE_FAKE,
  TUTORIAL_OPERADORES_SINDICATO_FAKE,
} from "../../config/tutorialFakeData";

/**
 * TutorialAsignarReplica
 *
 * Replica EXACTA de ModalAsignarVehiculo.js (mismo header, mismos
 * estilos de asignarStyles.js, mismos componentes reales de presentación:
 * EstadoIdle, CardVehiculo, ConfirmarOperadorCard, ListaValesDisponibles),
 * pero con datos ficticios en memoria en vez de useVehiculoQR (que hace
 * I/O real a Supabase). Se monta DENTRO del <Modal> único de
 * TutorialAsignarVehiculoFlow.js — este componente no abre su propio Modal.
 *
 * PROPS:
 * - phase: "idle" | "resultado"
 * - onAbrirCamara, onAsignar, onCancelar
 */
const TutorialAsignarReplica = ({ phase, onAbrirCamara, onAsignar, onCancelar }) => {
  const insets = useSafeAreaInsets();
  const idleRef = useRef(null);
  const listaRef = useRef(null);

  const [operadorConfirmado, setOperadorConfirmado] = useState(
    TUTORIAL_VEHICULO_FAKE.operador_sugerido,
  );
  const [expandirCambioOp, setExpandirCambioOp] = useState(false);

  const headerPaddingTop = Platform.select({
    ios: insets.top + 12,
    android: (StatusBar.currentHeight || 24) + 12,
  });

  return (
    <View style={[asignarStyles.container, { paddingTop: headerPaddingTop }]}>
      <View style={asignarStyles.header}>
        <View style={asignarStyles.headerLeft}>
          <MaterialCommunityIcons name="truck-check" size={26} color={colors.surface} />
          <Text style={asignarStyles.headerTitulo}>Asignar Vehículo</Text>
        </View>
        <TouchableOpacity
          onPress={onCancelar}
          style={asignarStyles.headerCerrar}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={asignarStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {phase === "idle" && (
            <View ref={idleRef} collapsable={false}>
              <EstadoIdle onEscanear={onAbrirCamara} />
            </View>
          )}

          {phase === "resultado" && (
            <>
              <CardVehiculo
                vehiculo={TUTORIAL_VEHICULO_FAKE}
                valesActivos={0}
                foliosActivos={[]}
                onReScanear={onAbrirCamara}
              />

              <ConfirmarOperadorCard
                operadorConfirmado={operadorConfirmado}
                operadores={TUTORIAL_OPERADORES_SINDICATO_FAKE}
                sindicatoNombre={TUTORIAL_VEHICULO_FAKE.sindicatos.sindicato}
                expandido={expandirCambioOp}
                onExpandir={() => setExpandirCambioOp(true)}
                onSeleccionar={(op) => {
                  setOperadorConfirmado(op);
                  setExpandirCambioOp(false);
                }}
              />

              <View ref={listaRef} collapsable={false}>
                <ListaValesDisponibles
                  vales={[TUTORIAL_VALE_DISPONIBLE_FAKE]}
                  asignando={false}
                  onSeleccionar={onAsignar}
                />
              </View>
            </>
          )}
        </ScrollView>

        <TutorialInlineSpotlight
          active={phase === "idle"}
          targetRef={idleRef}
          label="Toca para escanear"
        />
        <TutorialInlineSpotlight
          active={phase === "resultado"}
          targetRef={listaRef}
          label="Toca el vale para asignarlo"
        />
      </View>
    </View>
  );
};

export default TutorialAsignarReplica;
