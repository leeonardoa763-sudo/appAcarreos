// 1. React y hooks
import React, { useState, useCallback, useRef } from "react";

// 2. React Native
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  ScrollView,
} from "react-native";

// 3. Third party
import { useNavigation } from "@react-navigation/native";

// 4. Local - Config
import { colors } from "../config/colors";

// 5. Local - Hooks
import { useAuth } from "../hooks/useAuth";
import { useObras } from "../hooks/useObras";
import useQRScanner from "../hooks/useQRScanner";
import useValeByFolio from "../hooks/useValeByFolio";
import useVehiculoQRScanner from "../hooks/useVehiculoQRScanner";
import useVehiculoQRNavegacion from "../hooks/useVehiculoQRNavegacion";

// 6. Local - Componentes
import UserProfile from "../componets/ButtonsGrid/UserProfile";
import ButtonsGrid from "../componets/ButtonsGrid/ButtonsGrid";
import TarifasModal from "../componets/TarifasModal";
import QRScannerModal from "../componets/common/QRScannerModal";
import ModalAgregarOperador from "../componets/modals/ModalAgregarOperador";
import ModalAsignarVehiculo from "../componets/modals/asignarVehiculo/ModalAsignarVehiculo";
import ModalSeleccionarVale from "../componets/modals/ModalSeleccionarVale";
import SeccionOperadoresSindicato from "../componets/operadores/SeccionOperadoresSindicato";

const ValesScreen = () => {
  const navigation = useNavigation();
  const {
    userProfile,
    loading: authLoading,
    userName,
    userRole,
    refreshProfile,
  } = useAuth();

  const {
    obras,
    loading: obrasLoading,
    error: obrasError,
  } = useObras(userProfile?.id_persona);

  const [refreshing, setRefreshing] = useState(false);
  const [tarifasModalVisible, setTarifasModalVisible] = useState(false);
  const [modalOperadorVisible, setModalOperadorVisible] = useState(false);
  const [modalAsignarVisible, setModalAsignarVisible] = useState(false);
  const [modalSeleccionarVisible, setModalSeleccionarVisible] = useState(false);
  const [valesParaSeleccionar, setValesParaSeleccionar] = useState([]);

  const callbackQrRef = useRef(null);

  // ─── Navegación compartida al vale ────────────────────────────────────────

  const navegarAVale = useCallback(
    (vale) => {
      const tabNavigator = navigation.getParent();
      if (tabNavigator) {
        tabNavigator.navigate("Acarreos", { valeEscaneado: vale });
      }
    },
    [navigation],
  );

  // ─── Hook: escanear QR de vale (folio URL) ────────────────────────────────

  const { buscarValePorFolio, loading: loadingVale } = useValeByFolio();

  const handleFolioDetectado = useCallback(
    async (folio) => {
      const vale = await buscarValePorFolio(folio);
      if (!vale) return;
      navegarAVale(vale);
    },
    [buscarValePorFolio, navegarAVale],
  );

  const {
    scannerVisible,
    scanning,
    requestPermissionAndOpen,
    handleBarCodeScanned,
    closeScanner,
  } = useQRScanner({ onFolioDetected: handleFolioDetectado });

  // ─── Hook: escanear QR de vehículo para asignar a vale ───────────────────

  const scannerVehiculo = useVehiculoQRScanner({
    onQrDetectado: useCallback((qrUid) => {
      if (callbackQrRef.current) {
        callbackQrRef.current(qrUid);
        callbackQrRef.current = null;
      }
      setModalAsignarVisible(true);
    }, []),
  });

  const handleAbrirScannerVehiculo = useCallback(
    (onQrDetectado) => {
      callbackQrRef.current = onQrDetectado;
      setModalAsignarVisible(false);
      setTimeout(() => scannerVehiculo.abrirScanner(), 400);
    },
    [scannerVehiculo],
  );

  // ─── Hook: escanear QR de vehículo para ir a su vale ─────────────────────

  const {
    scannerVisible: scannerNavVisible,
    scanning: scanningNav,
    buscando: buscandoVehiculo,
    abrirEscaner: abrirEscanerNav,
    handleBarCodeScanned: handleQRNav,
    cerrarEscaner: cerrarEscanerNav,
  } = useVehiculoQRNavegacion({
    onValeUnico: (vale) => navegarAVale(vale),
    onMultiplesVales: (vales) => {
      setValesParaSeleccionar(vales);
      setModalSeleccionarVisible(true);
    },
  });

  // ─── Handlers de navegación ───────────────────────────────────────────────

  const handleCrearVale = () => navigation.navigate("SeleccionarTipoVale");
  const handleVerArchivados = () => navigation.navigate("Archivados");
  const handleVerTarifas = () => setTarifasModalVisible(true);
  const handleAgregarOperador = () => setModalOperadorVisible(true);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.error("[ValesScreen] Error al refrescar:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const esChecador = userRole === "CHECADOR";
  const esResidente = userRole === "Residente";
  const esAdministrador = userRole === "Administrador";

  const buttonConfigs = [
    !esChecador && {
      onPress: handleCrearVale,
      iconName: "file-document-plus",
      buttonText: "Crear Nuevo Vale",
      subtitle: "Material o Renta",
      backgroundColor: "#C0460F",
      isMain: true,
    },
    !esChecador && {
      onPress: requestPermissionAndOpen,
      iconName: loadingVale ? "loading" : "qrcode-scan",
      buttonText: "Escanear Vale",
      subtitle: "Buscar por código QR",
      backgroundColor: "#2C3E50",
      isMain: true,
      loading: loadingVale,
    },
    {
      onPress: () => setModalAsignarVisible(true),
      iconName: "truck-plus",
      buttonText: "Asignar Vehículo",
      subtitle: "Vincular camión a un vale",
      backgroundColor: "#34495E",
      isMain: true,
    },
    {
      onPress: abrirEscanerNav,
      iconName: buscandoVehiculo ? "loading" : "truck-check",
      buttonText: "Registrar Viaje",
      subtitle: "Escanear QR del operador",
      backgroundColor: "#3D566E",
      isMain: true,
      loading: buscandoVehiculo,
    },
    (esResidente || esAdministrador) && {
      onPress: handleAgregarOperador,
      iconName: "account-hard-hat",
      buttonText: "Añadir Operador",
      subtitle: "Registrar operador y vehículo",
      backgroundColor: "#2E4057",
      isMain: true,
    },
    !esChecador && {
      onPress: handleVerArchivados,
      iconName: "archive",
      buttonText: "Archivados",
      subtitle: "Ver histórico",
      backgroundColor: "#2C3E50",
    },
    !esChecador && {
      onPress: handleVerTarifas,
      iconName: "currency-usd",
      buttonText: "Tarifas",
      subtitle: "Consultar precios",
      backgroundColor: "#34495E",
    },
  ].filter(Boolean);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
          title="Actualizando obras..."
          titleColor={colors.textSecondary}
        />
      }
    >
      <UserProfile
        userName={userName || "Usuario"}
        userRole={userRole || "Cargando..."}
        userObra={userProfile?.obras?.obra || "Sin obra asignada"}
        userEmail={userProfile?.current_email || userProfile?.email}
        obras={obras}
        loading={obrasLoading}
      />

      {obrasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{obrasError}</Text>
        </View>
      )}

      <ButtonsGrid buttons={buttonConfigs} />

      {(esResidente || esAdministrador) && (
        <View style={styles.seccionOperadores}>
          <SeccionOperadoresSindicato />
        </View>
      )}

      {/* Modales */}
      <TarifasModal
        visible={tarifasModalVisible}
        onClose={() => setTarifasModalVisible(false)}
        userObras={obras || []}
      />

      <ModalAsignarVehiculo
        visible={modalAsignarVisible}
        onClose={() => setModalAsignarVisible(false)}
        onIrAVale={navegarAVale}
        onAbrirScanner={handleAbrirScannerVehiculo}
      />

      <ModalAgregarOperador
        visible={modalOperadorVisible}
        onClose={() => setModalOperadorVisible(false)}
        onOperadorAgregado={() => setModalOperadorVisible(false)}
      />

      <ModalSeleccionarVale
        visible={modalSeleccionarVisible}
        vales={valesParaSeleccionar}
        buscando={buscandoVehiculo}
        onSeleccionar={navegarAVale}
        onClose={() => setModalSeleccionarVisible(false)}
      />

      {/* Escáner QR de vales (folio URL) */}
      <QRScannerModal
        visible={scannerVisible}
        scanning={scanning}
        onBarCodeScanned={handleBarCodeScanned}
        onClose={closeScanner}
      />

      {/* Escáner QR de vehículo para asignar */}
      <QRScannerModal
        visible={scannerVehiculo.scannerVisible}
        scanning={scannerVehiculo.scanning}
        onBarCodeScanned={scannerVehiculo.handleBarCodeScanned}
        onClose={scannerVehiculo.cerrarScanner}
      />

      {/* Escáner QR de vehículo para navegar a vale */}
      <QRScannerModal
        visible={scannerNavVisible}
        scanning={scanningNav}
        onBarCodeScanned={handleQRNav}
        onClose={cerrarEscanerNav}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: `${colors.error || "#EF4444"}15`,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.error || "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: colors.error || "#EF4444",
    fontWeight: "500",
  },
  seccionOperadores: {
    marginHorizontal: 15,
    marginTop: 8,
    marginBottom: 24,
  },
});

export default ValesScreen;
