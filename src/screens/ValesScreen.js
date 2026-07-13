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
import { HIDE_ON_WEB } from "../config/features";
import { getTourForRole, TUTORIAL_HELP_BUTTON_ENABLED } from "../config/tutorialSteps";

// 5. Local - Hooks
import { useAuth } from "../hooks/useAuth";
import { useObras } from "../hooks/useObras";
import useQRScanner from "../hooks/useQRScanner";
import useValeByFolio from "../hooks/useValeByFolio";
import useVehiculoQRScanner from "../hooks/useVehiculoQRScanner";
import useVehiculoQRNavegacion from "../hooks/useVehiculoQRNavegacion";
import { useSpotlightTutorial } from "../hooks/useSpotlightTutorial";
import { useTutorialSeen } from "../hooks/useTutorialSeen";
import { useTutorialAsignarFlow } from "../hooks/useTutorialAsignarFlow";

// 6. Local - Componentes
import UserProfile from "../componets/ButtonsGrid/UserProfile";
import ButtonsGrid from "../componets/ButtonsGrid/ButtonsGrid";
import TarifasModal from "../componets/TarifasModal";
import QRScannerModal from "../componets/common/QRScannerModal";
import ModalAgregarOperador from "../componets/modals/ModalAgregarOperador";
import ModalAsignarPlacas from "../componets/modals/ModalAsignarPlacas";
import ModalAsignarVehiculo from "../componets/modals/asignarVehiculo/ModalAsignarVehiculo";
import ModalSeleccionarVale from "../componets/modals/ModalSeleccionarVale";
import SeccionOperadoresSindicato from "../componets/operadores/SeccionOperadoresSindicato";
import TutorialHelpButton from "../componets/common/TutorialHelpButton";
import TutorialSpotlightOverlay from "../componets/tutorial/TutorialSpotlightOverlay";
import TutorialAsignarVehiculoFlow from "../componets/tutorial/TutorialAsignarVehiculoFlow";

// 7. Local - Datos ficticios del tutorial
import { TUTORIAL_VALE_FAKE } from "../config/tutorialFakeData";

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
  const [modalAsignarPlacasVisible, setModalAsignarPlacasVisible] = useState(false);
  const [operadoresRefreshKey, setOperadoresRefreshKey] = useState(0);
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
  const handleAsignarPlacas = () => setModalAsignarPlacasVisible(true);

  // ─── Tutorial guiado (checador) ───────────────────────────────────────────
  // Se calcula aquí (antes del early return de authLoading) porque
  // useSpotlightTutorial/useTutorialSeen son hooks y deben llamarse siempre
  // en el mismo orden, sin importar el estado de carga.

  const esChecador = userRole === "CHECADOR";
  const tourSteps = esChecador ? getTourForRole("CHECADOR") : [];
  const tutorial = useSpotlightTutorial(tourSteps);
  const tutorialSeen = useTutorialSeen(esChecador ? "CHECADOR" : null);

  // "Armado": tras cerrar el spotlight del paso interactivo, el botón real
  // "Asignar Vehículo" queda temporalmente conectado al flujo simulado en
  // vez de abrir el modal real. Ver src/config/tutorialSteps.js (interactive: true).
  const [tutorialArmed, setTutorialArmed] = useState(false);

  const navegarATutorialVale = useCallback(() => {
    const tabNavigator = navigation.getParent();
    if (tabNavigator) {
      tabNavigator.navigate("Acarreos", {
        tutorialValeFicticio: TUTORIAL_VALE_FAKE,
        tutorialTs: Date.now(),
      });
    }
  }, [navigation]);

  const tutorialFlow = useTutorialAsignarFlow({ onFinalizarIrAVale: navegarATutorialVale });

  const handleStartFakeAsignarFlow = useCallback(() => {
    setTutorialArmed(false);
    tutorialFlow.start();
  }, [tutorialFlow]);

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

  const esResidente = userRole === "Residente";
  const esAdministrador = userRole === "Administrador";
  const esPlantaAsfaltos = userRole === "Planta de Asfaltos";
  // Planta de Asfaltos tiene los mismos accesos operativos que Residente
  // (operadores, eliminar viajes). Ver navegacion/gates por rol.
  const puedeGestionarOperadores =
    esResidente || esAdministrador || esPlantaAsfaltos;

  const buttonConfigs = [
    !esChecador && {
      onPress: handleCrearVale,
      iconName: "file-document-plus",
      buttonText: "Crear Nuevo Vale",
      subtitle: "Material o Renta",
      backgroundColor: "#C0460F",
      isMain: true,
    },
    !esChecador && !HIDE_ON_WEB && {
      onPress: requestPermissionAndOpen,
      iconName: loadingVale ? "loading" : "qrcode-scan",
      buttonText: "Escanear Vale",
      subtitle: "Buscar por código QR",
      backgroundColor: "#2C3E50",
      isMain: true,
      loading: loadingVale,
    },
    !HIDE_ON_WEB && {
      onPress: tutorialArmed
        ? handleStartFakeAsignarFlow
        : () => setModalAsignarVisible(true),
      iconName: "truck-plus",
      buttonText: "Asignar Vehículo",
      subtitle: "Vincular camión a un vale",
      backgroundColor: "#34495E",
      isMain: true,
      tutorialId: "asignar-vehiculo",
    },
    !HIDE_ON_WEB && {
      onPress: abrirEscanerNav,
      iconName: buscandoVehiculo ? "loading" : "truck-check",
      buttonText: "Registrar Viaje",
      subtitle: "Escanear QR del operador",
      backgroundColor: "#3D566E",
      isMain: true,
      loading: buscandoVehiculo,
      tutorialId: "registrar-viaje",
    },
    puedeGestionarOperadores && {
      onPress: handleAgregarOperador,
      iconName: "account-hard-hat",
      buttonText: "Añadir Operador",
      subtitle: "Operador o placa nueva",
      backgroundColor: "#2E4057",
      isMain: true,
    },
    puedeGestionarOperadores && {
      onPress: handleAsignarPlacas,
      iconName: "card-account-details-outline",
      buttonText: "Asignar Placas",
      subtitle: "A un operador ya registrado",
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
    <View style={styles.root}>
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

        <ButtonsGrid buttons={buttonConfigs} registerRef={tutorial.registerTarget} />

        {puedeGestionarOperadores && (
          <View style={styles.seccionOperadores}>
            <SeccionOperadoresSindicato refreshSignal={operadoresRefreshKey} />
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
          onOperadorAgregado={() => {
            setModalOperadorVisible(false);
            setOperadoresRefreshKey((k) => k + 1);
          }}
        />

        <ModalAsignarPlacas
          visible={modalAsignarPlacasVisible}
          onClose={() => setModalAsignarPlacasVisible(false)}
          onAsignado={() => setOperadoresRefreshKey((k) => k + 1)}
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

      {esChecador && tourSteps.length > 0 && (
        <>
          {TUTORIAL_HELP_BUTTON_ENABLED &&
            !tutorial.visible &&
            !tutorialArmed &&
            !tutorialFlow.active && (
              <TutorialHelpButton onPress={tutorial.start} showLabel={!tutorialSeen.seen} />
            )}
          <TutorialSpotlightOverlay
            visible={tutorial.visible}
            rect={tutorial.currentRect}
            step={tutorial.currentStep}
            stepIndex={tutorial.stepIndex}
            totalSteps={tutorial.totalSteps}
            hideNextButton={!!tutorial.currentStep?.interactive}
            onArm={() => {
              tutorial.close();
              setTutorialArmed(true);
            }}
            onNext={() => {
              if (tutorial.isLastStep) tutorialSeen.markSeen();
              tutorial.next();
            }}
            onSkip={() => {
              tutorialSeen.markSeen();
              tutorial.close();
            }}
          />
          <TutorialAsignarVehiculoFlow flow={tutorialFlow} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
