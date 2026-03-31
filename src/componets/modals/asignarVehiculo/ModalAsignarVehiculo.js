import React, { useCallback, useEffect, useRef } from "react";
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
import useVehiculoQR from "../../../hooks/useVehiculoQR";
import useValeByFolio from "../../../hooks/useValeByFolio";
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
    if (!visible) reset();
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
    buscarVehiculoPorQR,
    asignarVehiculo,
    reset,
  } = useVehiculoQR();

  const { buscarValePorFolio, loading: cargandoVale } = useValeByFolio();

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
      const ok = await asignarVehiculo(idVale);
      if (!ok) return;

      const valeCompleto = await buscarValePorFolio(folio);
      if (valeCompleto && isMounted.current) {
        onClose();
        setTimeout(() => onIrAVale(valeCompleto), 300);
      }
    },
    [asignarVehiculo, buscarValePorFolio, onClose, onIrAVale],
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
