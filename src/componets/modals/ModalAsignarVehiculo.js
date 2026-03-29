// 1. React y hooks
import React, { useCallback, useEffect, useRef } from "react";

// 2. React Native
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 4. Local - Config
import { colors } from "../../config/colors";

// 5. Local - Hooks
import useVehiculoQR from "../../hooks/useVehiculoQR";

import useValeByFolio from "../../hooks/useValeByFolio";

// 6. Local - Componentes
import QRScannerModal from "../common/QRScannerModal";

/**
 * ModalAsignarVehiculo
 *
 * Modal fullscreen para asignar un vehículo a un vale en_proceso mediante QR.
 *
 * FLUJO:
 * idle     → CHECADOR presiona "Escanear" → scanner abre
 * buscando → QR escaneado, consultando BD
 * resultado → card vehículo + lista de vales / mensaje de límite
 * exito    → asignación hecha, botón para abrir el vale en Acarreos
 *
 * PROPS:
 * - visible: boolean
 * - onClose: () => void
 * - onIrAVale: (vale) => void — navega al ValeDetalleModal en AcarreosScreen
 */
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

  // Reset al cerrar
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

  // ── Scanner ──────────────────────────────────────────────────────────────

  const handleQrDetectado = useCallback(
    (qrUid) => {
      buscarVehiculoPorQR(qrUid);
    },
    [buscarVehiculoPorQR],
  );

  const handleAbrirScanner = useCallback(() => {
    onAbrirScanner(handleQrDetectado);
  }, [onAbrirScanner, handleQrDetectado]);
  // ── Asignar y navegar ────────────────────────────────────────────────────

  const handleAsignar = useCallback(
    async (idVale, folio) => {
      const ok = await asignarVehiculo(idVale);
      if (!ok) return;

      // Buscar vale completo para abrir en Acarreos
      const valeCompleto = await buscarValePorFolio(folio);
      if (valeCompleto && isMounted.current) {
        onClose();
        setTimeout(() => onIrAVale(valeCompleto), 300);
      }
    },
    [asignarVehiculo, buscarValePorFolio, onClose, onIrAVale],
  );

  // ── Derivar estado visual ────────────────────────────────────────────────

  const estaOcupado = cargando || asignando || cargandoVale;
  const mostrarResultado = !cargando && vehiculo;

  const headerPaddingTop = Platform.select({
    ios: insets.top + 12,
    android: (StatusBar.currentHeight || 24) + 12,
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={[styles.container, { paddingTop: headerPaddingTop }]}>
          {/* ── Header ── */}
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
            {/* ── Estado idle: sin vehículo escaneado ── */}
            {!vehiculo && !cargando && !error && (
              <EstadoIdle onEscanear={handleAbrirScanner} />
            )}

            {/* ── Cargando ── */}
            {cargando && <EstadoCargando />}

            {/* ── Error sin vehículo ── */}
            {error && !vehiculo && (
              <EstadoError mensaje={error} onReintentar={abrirScanner} />
            )}

            {/* ── Resultado: card de vehículo ── */}
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
    </>
  );
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const EstadoIdle = ({ onEscanear }) => (
  <View style={styles.estadoContainer}>
    <View style={styles.idleIconWrapper}>
      <MaterialCommunityIcons
        name="qrcode-scan"
        size={72}
        color={colors.secondary}
      />
    </View>
    <Text style={styles.estadoTitulo}>Escanea el QR del vehículo</Text>
    <Text style={styles.estadoSubtitulo}>
      Apunta la cámara al código QR pegado en el camión para ver sus vales
      disponibles.
    </Text>
    <TouchableOpacity style={styles.botonEscanear} onPress={onEscanear}>
      <MaterialCommunityIcons name="camera" size={22} color={colors.surface} />
      <Text style={styles.botonEscanearTexto}>Abrir cámara</Text>
    </TouchableOpacity>
  </View>
);

const EstadoCargando = () => (
  <View style={styles.estadoContainer}>
    <ActivityIndicator size="large" color={colors.secondary} />
    <Text style={styles.estadoSubtitulo}>Consultando vehículo...</Text>
  </View>
);

const EstadoError = ({ mensaje, onReintentar }) => (
  <View style={styles.estadoContainer}>
    <MaterialCommunityIcons
      name="alert-circle-outline"
      size={64}
      color={colors.danger}
    />
    <Text style={styles.estadoTitulo}>No se pudo encontrar el vehículo</Text>
    <Text style={[styles.estadoSubtitulo, styles.errorTexto]}>{mensaje}</Text>
    <TouchableOpacity style={styles.botonEscanear} onPress={onReintentar}>
      <MaterialCommunityIcons name="refresh" size={22} color={colors.surface} />
      <Text style={styles.botonEscanearTexto}>Escanear de nuevo</Text>
    </TouchableOpacity>
  </View>
);

const CardVehiculo = ({
  vehiculo,
  valesActivos,
  foliosActivos,
  onReScanear,
}) => {
  const operador =
    vehiculo.operador_sugerido?.nombre_completo ?? "Sin operador asignado";
  const hayOperador = !!vehiculo.operador_sugerido;

  return (
    <View style={styles.cardVehiculo}>
      {/* Encabezado de la card */}
      <View style={styles.cardVehiculoHeader}>
        <View style={styles.cardVehiculoIcono}>
          <MaterialCommunityIcons
            name="dump-truck"
            size={32}
            color={colors.secondary}
          />
        </View>
        <View style={styles.cardVehiculoInfo}>
          <Text style={styles.cardVehiculoPlacas}>{vehiculo.placas}</Text>
          {vehiculo.capacidad_m3 && (
            <Text style={styles.cardVehiculoCapacidad}>
              {vehiculo.capacidad_m3} m³
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onReScanear} style={styles.cardRescanBtn}>
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={20}
            color={colors.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Operador */}
      <View style={styles.cardVehiculoFila}>
        <MaterialCommunityIcons
          name="account-hard-hat"
          size={18}
          color={hayOperador ? colors.accent : colors.textSecondary}
        />
        <Text
          style={[
            styles.cardVehiculoOperador,
            !hayOperador && styles.sinOperador,
          ]}
        >
          {operador}
        </Text>
      </View>

      {/* Contador de activos */}
      <View style={styles.cardVehiculoFila}>
        <MaterialCommunityIcons
          name="clipboard-list"
          size={18}
          color={valesActivos > 0 ? colors.warning : colors.textSecondary}
        />
        <Text style={styles.cardVehiculoActivos}>
          {valesActivos === 0
            ? "Sin vales activos"
            : `${valesActivos} vale${valesActivos > 1 ? "s" : ""} activo${valesActivos > 1 ? "s" : ""}`}
        </Text>
      </View>

      {/* Folios activos */}
      {foliosActivos.length > 0 && (
        <View style={styles.foliosActivosRow}>
          {foliosActivos.map((folio) => (
            <View key={folio} style={styles.folioBadge}>
              <Text style={styles.folioBadgeTexto}>{folio}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const BannerLimite = ({ folios }) => (
  <View style={styles.bannerLimite}>
    <MaterialCommunityIcons name="lock" size={32} color={colors.danger} />
    <Text style={styles.bannerLimiteTitulo}>Límite alcanzado</Text>
    <Text style={styles.bannerLimiteTexto}>
      Este vehículo ya tiene 2 vales activos y no puede recibir más hasta que
      complete uno.
    </Text>
    {folios.length > 0 && (
      <View style={styles.foliosActivosRow}>
        {folios.map((folio) => (
          <View
            key={folio}
            style={[styles.folioBadge, styles.folioBadgePeligro]}
          >
            <Text
              style={[styles.folioBadgeTexto, styles.folioBadgeTextoPeligro]}
            >
              {folio}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

const ListaValesDisponibles = ({ vales, asignando, onSeleccionar }) => {
  if (vales.length === 0) {
    return (
      <View style={styles.sinValesContainer}>
        <MaterialCommunityIcons
          name="clipboard-off-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.sinValesTexto}>
          No hay vales en proceso disponibles para asignar.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listaContainer}>
      <Text style={styles.listaTitulo}>Selecciona un vale para asignar</Text>
      {vales.map((vale) => (
        <ItemVale
          key={vale.id_vale}
          vale={vale}
          asignando={asignando}
          onSeleccionar={onSeleccionar}
        />
      ))}
    </View>
  );
};

const ItemVale = ({ vale, asignando, onSeleccionar }) => {
  const esMaterial = vale.tipo_vale === "material";
  const obra = vale.obras
    ? `${vale.obras.cc ? vale.obras.cc + " - " : ""}${vale.obras.obra}`
    : "Sin obra";

  return (
    <TouchableOpacity
      style={styles.itemVale}
      onPress={() => onSeleccionar(vale.id_vale, vale.folio)}
      disabled={asignando}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.itemValeTipoBar,
          esMaterial ? styles.barMaterial : styles.barRenta,
        ]}
      />
      <View style={styles.itemValeBody}>
        <View style={styles.itemValeTop}>
          <MaterialCommunityIcons
            name={esMaterial ? "package-variant" : "truck-cargo-container"}
            size={20}
            color={esMaterial ? colors.primary : colors.secondary}
          />
          <Text style={styles.itemValeFolio}>{vale.folio}</Text>
          <View
            style={[
              styles.itemValeTipoBadge,
              esMaterial ? styles.badgeMaterial : styles.badgeRenta,
            ]}
          >
            <Text style={styles.itemValeTipoTexto}>
              {esMaterial ? "Material" : "Renta"}
            </Text>
          </View>
        </View>
        <Text style={styles.itemValeObra} numberOfLines={1}>
          {obra}
        </Text>
      </View>
      {asignando ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.surface,
  },
  headerCerrar: {
    padding: 4,
  },

  scrollContent: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
  },

  // Estado idle / cargando / error
  estadoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
    paddingHorizontal: 32,
  },
  idleIconWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 50,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  estadoTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  estadoSubtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  errorTexto: {
    color: colors.danger,
  },
  botonEscanear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginTop: 8,
  },
  botonEscanearTexto: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },

  // Card vehículo
  cardVehiculo: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    gap: 10,
  },
  cardVehiculoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardVehiculoIcono: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
  },
  cardVehiculoInfo: {
    flex: 1,
  },
  cardVehiculoPlacas: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  cardVehiculoCapacidad: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardRescanBtn: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  cardVehiculoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  cardVehiculoOperador: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  sinOperador: {
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  cardVehiculoActivos: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  foliosActivosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  folioBadge: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  folioBadgeTexto: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "600",
  },
  folioBadgePeligro: {
    borderColor: colors.danger,
    backgroundColor: "#FFF0F0",
  },
  folioBadgeTextoPeligro: {
    color: colors.danger,
  },

  // Banner límite
  bannerLimite: {
    backgroundColor: "#FFF0F0",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  bannerLimiteTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.danger,
  },
  bannerLimiteTexto: {
    fontSize: 13,
    color: colors.danger,
    textAlign: "center",
    lineHeight: 18,
  },

  // Lista de vales disponibles
  listaContainer: {
    gap: 10,
  },
  listaTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    paddingHorizontal: 4,
  },
  sinValesContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  sinValesTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },

  // Item de vale
  itemVale: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  itemValeTipoBar: {
    width: 5,
    alignSelf: "stretch",
  },
  barMaterial: {
    backgroundColor: colors.primary,
  },
  barRenta: {
    backgroundColor: colors.secondary,
  },
  itemValeBody: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  itemValeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemValeFolio: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  itemValeTipoBadge: {
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeMaterial: {
    backgroundColor: "#FFF0EA",
  },
  badgeRenta: {
    backgroundColor: "#EAF0FF",
  },
  itemValeTipoTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  itemValeObra: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Peligro/warning
  warning: {
    color: "#E67E22",
  },
  danger: {
    color: colors.danger,
  },
});

export default ModalAsignarVehiculo;
