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

// 6. Local - Componentes
import UserProfile from "../componets/ButtonsGrid/UserProfile";
import ButtonsGrid from "../componets/ButtonsGrid/ButtonsGrid";
import TarifasModal from "../componets/TarifasModal";
import QRScannerModal from "../componets/common/QRScannerModal";
import ModalAgregarOperador from "../componets/modals/ModalAgregarOperador";
import ModalAsignarVehiculo from "../componets/modals/ModalAsignarVehiculo";
import useVehiculoQRScanner from "../hooks/useVehiculoQRScanner";
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

  const callbackQrRef = useRef(null);

  const { buscarValePorFolio, loading: loadingVale } = useValeByFolio();

  const handleFolioDetectado = useCallback(
    async (folio) => {
      const vale = await buscarValePorFolio(folio);
      if (!vale) return;

      const tabNavigator = navigation.getParent();
      if (tabNavigator) {
        tabNavigator.navigate("Acarreos", { valeEscaneado: vale });
      }
    },
    [buscarValePorFolio, navigation],
  );

  const handleIrAVale = useCallback(
    (vale) => {
      const tabNavigator = navigation.getParent();
      if (tabNavigator) {
        tabNavigator.navigate("Acarreos", { valeEscaneado: vale });
      }
    },
    [navigation],
  );

  const {
    scannerVisible,
    scanning,
    requestPermissionAndOpen,
    handleBarCodeScanned,
    closeScanner,
  } = useQRScanner({ onFolioDetected: handleFolioDetectado });

  const handleCrearVale = () => {
    navigation.navigate("SeleccionarTipoVale");
  };

  const handleVerArchivados = () => {
    navigation.navigate("Archivados");
  };

  const handleVerTarifas = () => {
    setTarifasModalVisible(true);
  };

  const handleAgregarOperador = () => {
    setModalOperadorVisible(true);
  };

  const handleAbrirScannerVehiculo = useCallback((onQrDetectado) => {
    callbackQrRef.current = onQrDetectado;
    setModalAsignarVisible(false);
    setTimeout(() => scannerVehiculo.abrirScanner(), 400);
  }, []);
  const scannerVehiculo = useVehiculoQRScanner({
    onQrDetectado: useCallback((qrUid) => {
      if (callbackQrRef.current) {
        callbackQrRef.current(qrUid);
        callbackQrRef.current = null;
      }
      setModalAsignarVisible(true);
    }, []),
  });

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

  const buttonConfigs = [
    // Crear vale: solo si NO es checador
    !esChecador && {
      onPress: handleCrearVale,
      iconName: "file-document-plus",
      buttonText: "Crear Nuevo Vale",
      subtitle: "Material o Renta",
      backgroundColor: "#E8501A",
      isMain: true,
    },
    // Escanear: todos los roles
    {
      onPress: requestPermissionAndOpen,
      iconName: loadingVale ? "loading" : "qrcode-scan",
      buttonText: "Escanear Vale",
      subtitle: "Buscar por código QR",
      backgroundColor: "#1B4F72",
      isMain: true,
      loading: loadingVale,
    },
    // Asignar vehículo: todos los roles
    {
      onPress: () => setModalAsignarVisible(true),
      iconName: "truck-plus",
      buttonText: "Asignar Vehículo",
      subtitle: "Vincular camión a un vale",
      backgroundColor: "#1A6B3C",
      isMain: true,
    },
    // Archivados: solo si NO es checador
    !esChecador && {
      onPress: handleVerArchivados,
      iconName: "archive",
      buttonText: "Archivados",
      subtitle: "Ver histórico",
      backgroundColor: "#2E4057",
    },
    // Tarifas: solo si NO es checador
    !esChecador && {
      onPress: handleVerTarifas,
      iconName: "currency-usd",
      buttonText: "Tarifas",
      subtitle: "Consultar precios",
      backgroundColor: "#145A32",
    },
    // Agregar operador: solo Residente
    esResidente && {
      onPress: handleAgregarOperador,
      iconName: "account-hard-hat",
      buttonText: "Añadir Operador",
      subtitle: "Registrar operador y vehículo",
      backgroundColor: "#1A5276",
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

      <TarifasModal
        visible={tarifasModalVisible}
        onClose={() => setTarifasModalVisible(false)}
        userObras={obras || []}
      />

      <ModalAsignarVehiculo
        visible={modalAsignarVisible}
        onClose={() => setModalAsignarVisible(false)}
        onIrAVale={handleIrAVale}
        onAbrirScanner={handleAbrirScannerVehiculo}
      />

      <QRScannerModal
        visible={scannerVehiculo.scannerVisible}
        scanning={scannerVehiculo.scanning}
        onBarCodeScanned={scannerVehiculo.handleBarCodeScanned}
        onClose={scannerVehiculo.cerrarScanner}
      />

      <ModalAgregarOperador
        visible={modalOperadorVisible}
        onClose={() => setModalOperadorVisible(false)}
        onOperadorAgregado={() => setModalOperadorVisible(false)}
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
});

export default ValesScreen;
