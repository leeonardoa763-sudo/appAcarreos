// 1. React y hooks
import React, { useCallback } from "react";

// 2. React Native
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../config/colors";

/**
 * EvidenciaCaptura
 *
 * Componente visual para capturar foto y ubicación GPS como evidencia
 * al completar un vale de renta.
 *
 * FUNCIONALIDAD:
 * - Botón para tomar foto (obligatorio)
 * - Preview de foto tomada con opción de retomar
 * - Captura automática de GPS al tomar la foto
 * - Indicador de proximidad a la obra
 * - Estados de loading y error claros
 *
 * USADO EN:
 * - ValeDetalleRenta (sección "Completar Vale")
 */
const EvidenciaCaptura = ({
  folioVale,
  foto,
  fotoUrl,
  ubicacion,
  distanciaObra,
  dentroDelRadio,
  obraTieneCoordenadas,
  loadingFoto,
  loadingUbicacion,
  errorFoto,
  errorUbicacion,
  onTomarFoto,
  onCapturarUbicacion,
  radioConfigurado,
}) => {
  // Maneja la acción principal: tomar foto y capturar GPS en paralelo
  const handleCapturarEvidencia = useCallback(async () => {
    await Promise.all([onTomarFoto(folioVale), onCapturarUbicacion()]);
  }, [folioVale, onTomarFoto, onCapturarUbicacion]);

  const handleRetomar = useCallback(async () => {
    await onTomarFoto(folioVale);
  }, [folioVale, onTomarFoto]);

  const loading = loadingFoto || loadingUbicacion;

  return (
    <View style={styles.container}>
      {/* Título de sección */}
      <View style={styles.headerRow}>
        <MaterialCommunityIcons
          name="camera-marker"
          size={20}
          color={colors.secondary}
        />
        <Text style={styles.titulo}>Evidencia obligatoria</Text>
      </View>
      <Text style={styles.subtitulo}>
        Toma una foto donde se vea el equipo rentado y el material movido.
      </Text>

      {/* Estado: sin foto todavía */}
      {!foto && !loading && (
        <TouchableOpacity
          style={styles.botonCamara}
          onPress={handleCapturarEvidencia}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="camera-plus"
            size={40}
            color={colors.primary}
          />
          <Text style={styles.botonCamaraTexto}>Tomar foto de evidencia</Text>
          <Text style={styles.botonCamaraSubtexto}>
            Asegúrate de que se vea el camión y el material
          </Text>
        </TouchableOpacity>
      )}

      {/* Estado: cargando */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTexto}>
            {loadingFoto && !loadingUbicacion
              ? "Guardando foto..."
              : loadingUbicacion && !loadingFoto
                ? "Obteniendo ubicación..."
                : "Capturando evidencia..."}
          </Text>
        </View>
      )}

      {/* Estado: foto tomada */}
      {foto && !loading && (
        <View style={styles.previewContainer}>
          {/* Preview de la foto */}
          <Image source={{ uri: foto }} style={styles.preview} />

          {/* Indicador foto guardada */}
          <View style={styles.fotoEstado}>
            {fotoUrl ? (
              <View style={styles.estadoRow}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.estadoTextoOk}>Foto guardada</Text>
              </View>
            ) : (
              <View style={styles.estadoRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.estadoTextoPendiente}>
                  Guardando foto...
                </Text>
              </View>
            )}

            {/* Botón retomar */}
            <TouchableOpacity
              style={styles.botonRetomar}
              onPress={handleRetomar}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="camera-retake"
                size={14}
                color={colors.secondary}
              />
              <Text style={styles.botonRetomartexto}>Retomar</Text>
            </TouchableOpacity>
          </View>

          {/* Indicador de GPS */}
          <View style={styles.gpsContainer}>
            {ubicacion ? (
              <UbicacionIndicador
                distanciaObra={distanciaObra}
                dentroDelRadio={dentroDelRadio}
                obraTieneCoordenadas={obraTieneCoordenadas}
                ubicacion={ubicacion}
                radioConfigurado={radioConfigurado}
              />
            ) : errorUbicacion ? (
              <View style={styles.estadoRow}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.estadoTextoPendiente}>
                  Ubicación no disponible
                </Text>
              </View>
            ) : (
              <View style={styles.estadoRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.estadoTextoPendiente}>
                  Obteniendo ubicación...
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Error de foto */}
      {errorFoto && !loading && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={16}
            color={colors.error || "#E74C3C"}
          />
          <Text style={styles.errorTexto}>{errorFoto}</Text>
        </View>
      )}
    </View>
  );
};

// Sub-componente: indicador de proximidad a la obra
const UbicacionIndicador = ({
  distanciaObra,
  dentroDelRadio,
  obraTieneCoordenadas,
  radioConfigurado,
}) => {
  if (!obraTieneCoordenadas) {
    return (
      <View style={styles.estadoRow}>
        <MaterialCommunityIcons
          name="map-marker-check"
          size={16}
          color={colors.accent}
        />
        <Text style={styles.estadoTextoOk}>Ubicación registrada</Text>
      </View>
    );
  }

  if (dentroDelRadio) {
    return (
      <View style={styles.estadoRow}>
        <MaterialCommunityIcons
          name="map-marker-check"
          size={16}
          color={colors.accent}
        />
        <Text style={styles.estadoTextoOk}>
          En obra — {distanciaObra}m del sitio
        </Text>
      </View>
    );
  }

  // Fuera del radio — bloquea con mensaje claro
  return (
    <View style={styles.estadoRow}>
      <MaterialCommunityIcons
        name="map-marker-outline"
        size={16}
        color={colors.textSecondary}
      />
      <Text style={styles.estadoTextoPendiente}>
        Ubicación registrada — {distanciaObra}m del sitio
      </Text>
    </View>
  );
};

export default EvidenciaCaptura;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E8ECF0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },

  // Botón cámara inicial
  botonCamara: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
  },
  botonCamaraTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  botonCamaraSubtexto: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Loading
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 12,
  },
  loadingTexto: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Preview foto
  previewContainer: {
    gap: 10,
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: "#E8ECF0",
  },
  fotoEstado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // GPS / proximidad
  gpsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E8ECF0",
  },
  proximidadContainer: {
    gap: 4,
  },

  // Botón retomar
  botonRetomar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  botonRetomartexto: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "500",
  },

  // Estados
  estadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  estadoTextoOk: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "500",
  },
  estadoTextoPendiente: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  estadoTextoError: {
    fontSize: 12,
    color: "#E74C3C",
    flex: 1,
  },
  estadoTextoAdvertencia: {
    fontSize: 13,
    color: "#F39C12",
    fontWeight: "500",
  },
  advertenciaSubtexto: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 22,
  },

  // Error foto
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 10,
    backgroundColor: "#FDECEA",
    borderRadius: 8,
  },
  errorTexto: {
    fontSize: 12,
    color: "#E74C3C",
    flex: 1,
  },
  fueraRadioContainer: {
    gap: 6,
  },
  fueraRadioTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E74C3C",
  },
  fueraRadioMensaje: {
    fontSize: 12,
    color: "#E74C3C",
    lineHeight: 17,
    marginLeft: 24,
  },
});
