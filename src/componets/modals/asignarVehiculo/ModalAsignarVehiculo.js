import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../../config/colors";
import { AYUDA_URLS } from "../../../config/ayuda";
import useVehiculoQR from "../../../hooks/useVehiculoQR";
import useValeByFolio from "../../../hooks/useValeByFolio";
import BotonAyuda from "../../common/BotonAyuda";
import QRScannerModal from "../../common/QRScannerModal";

import styles from "./asignarStyles";
import CardVehiculo from "./CardVehiculo";
import ListaValesDisponibles from "./ListaValesDisponibles";
import {
  EstadoIdle,
  EstadoCargando,
  EstadoError,
  BannerLimite,
} from "./EstadosUI";
import ConfirmarOperadorCard from "./ConfirmarOperadorCard";

const ModalAsignarVehiculo = ({
  visible,
  onClose,
  onIrAVale,
  onAbrirScanner,
}) => {
  const insets = useSafeAreaInsets();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      reset();
      setOperadorConfirmado(null);
      setExpandirCambioOp(false);
    }
  }, [visible]);

  const {
    vehiculo,
    valesActivos,
    valesDisponibles,
    cargando,
    asignando,
    error,
    limiteAlcanzado,
    foliosActivos,
    asignacionActual,
    operadoresSindicato,
    buscarVehiculoPorQR,
    asignarVehiculo,
    reset,
  } = useVehiculoQR();

  const { buscarValePorFolio, loading: cargandoVale } = useValeByFolio();

  const [operadorConfirmado, setOperadorConfirmado] = useState(null);
  const [expandirCambioOp, setExpandirCambioOp] = useState(false);

  // Inicializar operador confirmado cuando se encuentra un vehículo
  useEffect(() => {
    if (!vehiculo) return;
    if (asignacionActual) {
      setOperadorConfirmado({
        id_operador: asignacionActual.id_operador,
        nombre_completo:
          asignacionActual.operadores?.nombre_completo ?? "Desconocido",
      });
    } else if (vehiculo.operador_sugerido) {
      setOperadorConfirmado(vehiculo.operador_sugerido);
    } else {
      setOperadorConfirmado(null);
    }
    setExpandirCambioOp(false);
    // Solo re-ejecutar cuando cambia el vehículo escaneado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculo?.id_vehiculo]);

  const handleQrDetectado = useCallback(
    (qrUid) => {
      buscarVehiculoPorQR(qrUid);
    },
    [buscarVehiculoPorQR],
  );

  const handleAbrirScanner = useCallback(() => {
    onAbrirScanner(handleQrDetectado);
  }, [onAbrirScanner, handleQrDetectado]);

  const handleAsignar = useCallback(
    async (idVale, folio) => {
      const ok = await asignarVehiculo(
        idVale,
        operadorConfirmado?.id_operador ?? null,
      );
      if (!ok) return;

      const valeCompleto = await buscarValePorFolio(folio);
      if (valeCompleto && isMounted.current) {
        onClose();
        setTimeout(() => onIrAVale(valeCompleto), 300);
      }
    },
    [asignarVehiculo, operadorConfirmado, buscarValePorFolio, onClose, onIrAVale],
  );

  const mostrarResultado = !cargando && vehiculo;

  const headerPaddingTop = Platform.select({
    ios: insets.top + 12,
    android: (StatusBar.currentHeight || 24) + 12,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: headerPaddingTop }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons
              name="truck-check"
              size={26}
              color={colors.surface}
            />
            <Text style={styles.headerTitulo}>Asignar Vehículo</Text>
          </View>
          <View style={styles.headerAcciones}>
            {/* Este modal se abre ANTES de escanear, o sea antes de saber de que
                tipo es el vale. Por eso apunta fijo a la guia de material (el
                flujo de asignar es identico en las dos y material es el volumen
                dominante) en vez de resolverlo con urlAyudaVale. */}
            <BotonAyuda
              url={`${AYUDA_URLS.guiaMaterial}#paso-asignar`}
              variante="header"
              size={24}
            />
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerCerrar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.surface}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!vehiculo && !cargando && !error && (
            <EstadoIdle onEscanear={handleAbrirScanner} />
          )}

          {cargando && <EstadoCargando />}

          {error && !vehiculo && (
            <EstadoError mensaje={error} onReintentar={handleAbrirScanner} />
          )}

          {mostrarResultado && (
            <>
              <CardVehiculo
                vehiculo={vehiculo}
                valesActivos={valesActivos}
                foliosActivos={foliosActivos}
                onReScanear={() => {
                  reset();
                  handleAbrirScanner();
                }}
              />

              <ConfirmarOperadorCard
                operadorConfirmado={operadorConfirmado}
                operadores={operadoresSindicato}
                sindicatoNombre={vehiculo?.sindicatos?.sindicato}
                expandido={expandirCambioOp}
                onExpandir={() => setExpandirCambioOp(true)}
                onSeleccionar={(op) => {
                  setOperadorConfirmado(op);
                  setExpandirCambioOp(false);
                }}
              />

              {limiteAlcanzado ? (
                <BannerLimite folios={foliosActivos} />
              ) : (
                <ListaValesDisponibles
                  vales={valesDisponibles}
                  asignando={asignando || cargandoVale}
                  onSeleccionar={handleAsignar}
                />
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ModalAsignarVehiculo;
