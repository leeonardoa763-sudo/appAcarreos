// 1. React y hooks
import React, { useCallback, useState } from "react";

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

// 5. Local - Utilidades
import {
  MOTIVOS_SIN_FOTO,
  etiquetaMotivo,
} from "../../utils/tiempoEntreViajes";

// 6. Subcomponentes
import ModalMotivo from "./ModalMotivo";

/**
 * EvidenciaCaptura
 *
 * Componente visual para capturar foto y ubicación GPS como evidencia
 * al completar un vale.
 *
 * FUNCIONALIDAD:
 * - Botón para tomar foto
 * - Alternativa explícita: declarar por qué no se toma, con motivo escrito
 * - Preview de foto tomada con opción de retomar
 * - Captura automática de GPS al tomar la foto
 * - Indicador de proximidad a la obra
 * - Estados de loading y error claros
 *
 * La foto dejó de ser obligatoria a propósito: cuando el vale se captura
 * después y fuera de campo, forzarla producía fotos de la nada guardadas como
 * evidencia válida.
 *
 * USADO EN:
 * - ValeDetalleRenta (sección "Completar Vale") — renta y pipas
 * - ValeMaterialAsfalticoScreen (antes de compartir el PDF)
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
  motivoSinFoto = null,
  onOmitirFoto,
  onDeshacerOmision,
}) => {
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);

  // Maneja la acción principal: tomar foto y capturar GPS en paralelo
  const handleCapturarEvidencia = useCallback(async () => {
    await Promise.all([onTomarFoto(folioVale), onCapturarUbicacion()]);
  }, [folioVale, onTomarFoto, onCapturarUbicacion]);

  const handleRetomar = useCallback(async () => {
    await onTomarFoto(folioVale);
  }, [folioVale, onTomarFoto]);

  const handleConfirmarMotivo = useCallback(
    (motivo) => {
      setPidiendoMotivo(false);
      onOmitirFoto?.(motivo);
    },
    [onOmitirFoto],
  );

  const loading = loadingFoto || loadingUbicacion;
  // Solo se ofrece omitir si el padre sabe qué hacer con el motivo.
  const puedeOmitir = typeof onOmitirFoto === "function";

  return (
    <View style={styles.container}>
      {/* Título de sección */}
      <View style={styles.headerRow}>
        <MaterialCommunityIcons
          name="camera-marker"
          size={20}
          color={colors.secondary}
        />
        <Text style={styles.titulo}>Evidencia</Text>
      </View>
      <Text style={styles.subtitulo}>
        Toma una foto donde se vea el equipo rentado y el material movido. Si no
        estas en campo, indica por que no se puede tomar.
      </Text>

      {/* Estado: se declaró que no habrá foto */}
      {motivoSinFoto && !foto && (
        <View style={styles.omitidaContainer}>
          <View style={styles.estadoRow}>
            <MaterialCommunityIcons
              name="camera-off-outline"
              size={16}
              color={colors.warning}
            />
            <Text style={styles.omitidaTitulo}>Sin foto de evidencia</Text>
          </View>
          <Text style={styles.omitidaMotivo}>
            {etiquetaMotivo(MOTIVOS_SIN_FOTO, motivoSinFoto.codigo)}
          </Text>
          {motivoSinFoto.texto ? (
            <Text style={styles.omitidaTexto}>"{motivoSinFoto.texto}"</Text>
          ) : null}
          <TouchableOpacity
            style={styles.botonRetomar}
            onPress={() => {
              onDeshacerOmision?.();
              handleCapturarEvidencia();
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="camera-plus"
              size={14}
              color={colors.secondary}
            />
            <Text style={styles.botonRetomartexto}>Tomar foto</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Estado: sin foto todavía */}
      {!foto && !loading && !motivoSinFoto && (
        <>
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

          {puedeOmitir && (
            <TouchableOpacity
              style={styles.botonSinFoto}
              onPress={() => setPidiendoMotivo(true)}
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
        </>
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
                <Text style={styles.estadoTextoOk}>Foto subida correctamente</Text>
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

          {fotoUrl && ubicacion && (
            <View style={styles.estadoRow}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.estadoTextoOk}>
                Evidencia lista: foto subida y ubicación guardada
              </Text>
            </View>
          )}
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

      <ModalMotivo
        visible={pidiendoMotivo}
        titulo="Completar sin foto"
        mensaje="El vale queda registrado sin evidencia fotografica. Indica por que no se tomo la foto."
        icono="camera-off-outline"
        motivos={MOTIVOS_SIN_FOTO}
        textoConfirmar="Guardar sin foto"
        textoCancelar="Volver"
        onConfirmar={handleConfirmarMotivo}
        onCancelar={() => setPidiendoMotivo(false)}
      />
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
        <Text style={styles.estadoTextoOk}>Ubicación guardada</Text>
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

  // Sin foto, declarado con motivo
  botonSinFoto: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  botonSinFotoTexto: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
  omitidaContainer: {
    backgroundColor: "#FEF5E7",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  omitidaTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.warning,
  },
  omitidaMotivo: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  omitidaTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
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
