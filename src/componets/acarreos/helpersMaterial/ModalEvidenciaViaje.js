// 1. React
import React, { useEffect, useState } from "react";

// 2. React Native
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  StyleSheet,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../../config/colors";

// 5. Hooks y utilidades
import useEvidenciaVale from "../../../hooks/useEvidenciaVale";
import { MOTIVOS_SIN_FOTO } from "../../../utils/tiempoEntreViajes";

// 6. Subcomponentes
import { FormularioMotivo } from "../../vale/ModalMotivo";

/**
 * ModalEvidenciaViaje
 *
 * Modal que aparece automáticamente tras registrar un viaje.
 * Pide la foto del camión, o el motivo por el que no se toma.
 * También se puede abrir manualmente desde el botón fallback en ViajeItem.
 *
 * La foto dejó de ser obligatoria a proposito: cuando el vale se captura
 * despues y fuera de campo, forzarla producia fotos de la nada guardadas como
 * evidencia valida. Declarar que no hay foto, con un motivo, es mas honesto y
 * auditable. El paso de motivo se renderiza DENTRO de este mismo <Modal>
 * (estado `paso`) porque Android no apila dos modales de forma confiable.
 *
 * PROPS:
 * - visible: boolean
 * - viaje: { id_viaje, numero_viaje }
 * - folioVale: string
 * - obraData: object — datos de la obra (para calcular distancia GPS)
 * - onFotoGuardada: async (idViaje, fotoUrl, ubicacion, distanciaObra, motivoSinFoto) => void
 */
const ModalEvidenciaViaje = ({
  visible,
  viaje,
  folioVale,
  obraData,
  onFotoGuardada,
}) => {
  const [paso, setPaso] = useState("foto");
  const [guardandoMotivo, setGuardandoMotivo] = useState(false);
  const {
    foto,
    fotoUrl,
    ubicacion,
    distanciaObra,
    dentroDelRadio,
    obraTieneCoordenadas,
    radioConfigurado,
    loadingFoto,
    loadingUbicacion,
    errorFoto,
    tomarFoto,
    capturarUbicacion,
    resetEvidencia,
  } = useEvidenciaVale(obraData);

  useEffect(() => {
    if (visible) {
      setPaso("foto");
      setGuardandoMotivo(false);
      capturarUbicacion();
    } else {
      resetEvidencia();
    }
  }, [visible]);

  const handleTomarFoto = async () => {
    await tomarFoto(folioVale, "viajes");
  };

  const handleConfirmar = async () => {
    await onFotoGuardada(
      viaje.id_viaje,
      fotoUrl,
      ubicacion,
      distanciaObra,
    );
  };

  const handleConfirmarSinFoto = async (motivo) => {
    setGuardandoMotivo(true);
    try {
      // Sin foto no se guarda la ubicacion: el GPS de una captura tardia
      // apunta a donde esta el usuario ahora, no a donde ocurrio el viaje.
      await onFotoGuardada(viaje.id_viaje, null, null, null, motivo);
    } finally {
      setGuardandoMotivo(false);
    }
  };

  // El unico camino de salida sin resolver nada es el boton atras de Android.
  // Se avisa en vez de dejar el viaje sin foto ni motivo en silencio.
  const handleIntentarCerrar = () => {
    if (paso === "motivo") {
      setPaso("foto");
      return;
    }
    if (!fotoUrl) {
      Alert.alert(
        "Evidencia pendiente",
        "Toma la foto del camion o indica por que no se puede tomar.",
        [{ text: "Entendido" }],
      );
      return;
    }
    Alert.alert(
      "Foto sin confirmar",
      "Tomaste la foto pero no la guardaste. Confirmala para registrarla.",
      [{ text: "Entendido" }],
    );
  };

  const cargando = loadingFoto || loadingUbicacion;

  if (paso === "motivo") {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleIntentarCerrar}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <FormularioMotivo
              titulo={`Viaje ${viaje?.numero_viaje} sin foto`}
              mensaje="El viaje queda registrado sin evidencia fotografica. Indica por que no se tomo la foto."
              icono="camera-off-outline"
              motivos={MOTIVOS_SIN_FOTO}
              textoConfirmar="Guardar sin foto"
              textoCancelar="Volver"
              confirmando={guardandoMotivo}
              onConfirmar={handleConfirmarSinFoto}
              onCancelar={() => setPaso("foto")}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleIntentarCerrar}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="camera-outline"
              size={22}
              color={colors.secondary}
            />
            <Text style={styles.titulo}>
              Foto del Viaje {viaje?.numero_viaje}
            </Text>
          </View>

          <Text style={styles.subtitulo}>
            Toma una foto del camion para registrar la evidencia del viaje. Si
            no estas en campo, indica por que no se puede tomar.
          </Text>

          {/* Zona de foto */}
          {!foto ? (
            <TouchableOpacity
              style={[styles.botonCamara, cargando && styles.botonDeshabilitado]}
              onPress={handleTomarFoto}
              disabled={cargando}
              activeOpacity={0.8}
            >
              {cargando ? (
                <ActivityIndicator size="large" color={colors.surface} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={40}
                    color={colors.surface}
                  />
                  <Text style={styles.botonCamaraTexto}>
                    Tomar foto del camion
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.previewContainer}>
              <Image source={{ uri: foto }} style={styles.preview} />

              {loadingFoto && (
                <View style={styles.previewOverlay}>
                  <ActivityIndicator size="large" color={colors.surface} />
                  <Text style={styles.previewOverlayTexto}>Subiendo foto...</Text>
                </View>
              )}

              {!loadingFoto && fotoUrl && (
                <View style={styles.previewCheckBadge}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={colors.accent}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.botonReintentar}
                onPress={handleTomarFoto}
                disabled={cargando}
              >
                <MaterialCommunityIcons
                  name="camera-retake"
                  size={16}
                  color={colors.secondary}
                />
                <Text style={styles.botonReintentarTexto}>Tomar otra vez</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error foto */}
          {errorFoto ? (
            <Text style={styles.errorTexto}>{errorFoto}</Text>
          ) : null}

          {/* Estado GPS */}
          {obraTieneCoordenadas && (
            <View style={styles.gpsRow}>
              <MaterialCommunityIcons
                name={
                  loadingUbicacion
                    ? "crosshairs-gps"
                    : ubicacion
                      ? dentroDelRadio
                        ? "map-marker-check"
                        : "map-marker-alert"
                      : "map-marker-off"
                }
                size={16}
                color={
                  loadingUbicacion
                    ? colors.textSecondary
                    : ubicacion
                      ? dentroDelRadio
                        ? colors.accent
                        : colors.primary
                      : colors.textSecondary
                }
              />
              <Text style={styles.gpsTexto}>
                {loadingUbicacion
                  ? "Obteniendo ubicacion..."
                  : ubicacion
                    ? distanciaObra != null
                      ? dentroDelRadio
                        ? `Dentro del radio (${distanciaObra} m)`
                        : `Fuera del radio (${distanciaObra} m, radio: ${radioConfigurado} m)`
                      : "Ubicacion capturada"
                    : "Sin ubicacion"}
              </Text>
            </View>
          )}

          {/* Botón confirmar */}
          <TouchableOpacity
            style={[
              styles.botonConfirmar,
              (!fotoUrl || loadingFoto) && styles.botonDeshabilitado,
            ]}
            onPress={handleConfirmar}
            disabled={!fotoUrl || loadingFoto}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={!fotoUrl || loadingFoto ? colors.textSecondary : colors.surface}
            />
            <Text
              style={[
                styles.botonConfirmarTexto,
                (!fotoUrl || loadingFoto) && styles.botonConfirmarTextoDeshabilitado,
              ]}
            >
              Confirmar foto
            </Text>
          </TouchableOpacity>

          {/* Salida explicita y auditada, en vez de la foto a la nada */}
          {!fotoUrl && (
            <TouchableOpacity
              style={styles.botonSinFoto}
              onPress={() => setPaso("motivo")}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="camera-off-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.botonSinFotoTexto}>No tomar foto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  botonCamara: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 32,
    alignItems: "center",
    gap: 10,
  },
  botonCamaraTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
  botonDeshabilitado: {
    backgroundColor: "#C8CDD6",
  },
  previewContainer: {
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 14,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewOverlayTexto: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "600",
  },
  previewCheckBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  botonReintentar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
    marginTop: 4,
  },
  botonReintentarTexto: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: "500",
  },
  errorTexto: {
    fontSize: 12,
    color: "#D32F2F",
    textAlign: "center",
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gpsTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  botonConfirmar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  botonConfirmarTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface,
  },
  botonConfirmarTextoDeshabilitado: {
    color: colors.textSecondary,
  },
  botonSinFoto: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  botonSinFotoTexto: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});

export default ModalEvidenciaViaje;
