// 1. React y hooks
import React, { useState, useRef, useCallback } from "react";

// 2. React Native
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";

/**
 * ModalBuscarVehiculoPlacas
 *
 * Modal para buscar un vehículo manualmente por número de placas,
 * como alternativa al escaneo QR cuando el camión no tiene sticker.
 *
 * Props:
 *   visible               — controla visibilidad
 *   onClose               — callback al cerrar sin seleccionar
 *   onVehiculoSeleccionado — callback con el objeto vehiculo al confirmar
 *   expectedSindicatoId   — id del sindicato activo para validar coincidencia
 */
const ModalBuscarVehiculoPlacas = ({
  visible,
  onClose,
  onVehiculoSeleccionado,
  expectedSindicatoId,
}) => {
  const [placas, setPlacas] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const limpiarEstado = () => {
    setPlacas("");
    setError(null);
    setVehiculoEncontrado(null);
    setBuscando(false);
  };

  const handleCerrar = () => {
    limpiarEstado();
    onClose();
  };

  const buscarPorPlacas = useCallback(async () => {
    const texto = placas.trim().toUpperCase();
    if (!texto) return;

    setBuscando(true);
    setError(null);
    setVehiculoEncontrado(null);

    try {
      const { data, error: errorBD } = await supabase
        .from("vehiculos")
        .select(
          `
          id_vehiculo,
          placas,
          capacidad_m3,
          qr_uid,
          id_sindicato,
          sindicatos:id_sindicato ( sindicato ),
          id_operador_sugerido,
          activo,
          operador_sugerido:operadores!id_operador_sugerido (
            id_operador,
            nombre_completo
          )
        `,
        )
        .ilike("placas", texto)
        .eq("activo", true)
        .maybeSingle();

      if (errorBD) throw errorBD;

      if (!data) {
        setError("No se encontró ningún vehículo activo con esas placas.");
        return;
      }

      if (expectedSindicatoId && data.id_sindicato !== expectedSindicatoId) {
        setError(
          `Este vehículo pertenece a otro sindicato (${data.sindicatos?.sindicato ?? "desconocido"}). Verifica el sindicato seleccionado.`,
        );
        return;
      }

      setVehiculoEncontrado(data);
    } catch {
      setError("Error al buscar vehículo. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  }, [placas, expectedSindicatoId]);

  const handleConfirmar = () => {
    if (!vehiculoEncontrado) return;
    onVehiculoSeleccionado(vehiculoEncontrado);
    handleCerrar();
  };

  const handleCambioPlacas = (valor) => {
    const limpio = valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setPlacas(limpio);
    if (error) setError(null);
    if (vehiculoEncontrado) setVehiculoEncontrado(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCerrar}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="truck-check"
              size={20}
              color={colors.secondary}
            />
            <Text style={styles.titulo}>Buscar vehículo por placas</Text>
            <TouchableOpacity
              onPress={handleCerrar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitulo}>
            Ingresa las placas del vehículo para buscarlo en el sistema.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={placas}
              onChangeText={handleCambioPlacas}
              placeholder="Ej: ABC1234"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              maxLength={10}
              returnKeyType="search"
              onSubmitEditing={buscarPorPlacas}
              editable={!buscando}
              autoFocus
            />
            <TouchableOpacity
              style={[
                styles.botonBuscar,
                (!placas.trim() || buscando) && styles.botonBuscarDisabled,
              ]}
              onPress={buscarPorPlacas}
              disabled={!placas.trim() || buscando}
            >
              {buscando ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <MaterialCommunityIcons
                  name="magnify"
                  size={22}
                  color={colors.surface}
                />
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={15}
                color="#E74C3C"
              />
              <Text style={styles.errorTexto}>{error}</Text>
            </View>
          )}

          {vehiculoEncontrado && (
            <View style={styles.resultadoCard}>
              <View style={styles.resultadoFilaPrincipal}>
                <MaterialCommunityIcons
                  name="truck"
                  size={18}
                  color={colors.secondary}
                />
                <Text style={styles.resultadoPlacas}>
                  {vehiculoEncontrado.placas}
                </Text>
                {vehiculoEncontrado.capacidad_m3 != null && (
                  <View style={styles.capacidadBadge}>
                    <Text style={styles.capacidadTexto}>
                      {vehiculoEncontrado.capacidad_m3} m3
                    </Text>
                  </View>
                )}
              </View>

              {vehiculoEncontrado.sindicatos?.sindicato && (
                <Text style={styles.resultadoSub}>
                  {vehiculoEncontrado.sindicatos.sindicato}
                </Text>
              )}

              {vehiculoEncontrado.operador_sugerido?.nombre_completo && (
                <View style={styles.resultadoFilaOperador}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.resultadoOperador}>
                    {vehiculoEncontrado.operador_sugerido.nombre_completo}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.botonConfirmar}
                onPress={handleConfirmar}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={colors.surface}
                />
                <Text style={styles.botonConfirmarTexto}>
                  Usar este vehículo
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ModalBuscarVehiculoPlacas;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titulo: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  botonBuscar: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  botonBuscarDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.4,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FDECEA",
    padding: 10,
    borderRadius: 8,
  },
  errorTexto: {
    fontSize: 13,
    color: "#E74C3C",
    flex: 1,
    lineHeight: 18,
  },
  resultadoCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#C8ECD8",
  },
  resultadoFilaPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultadoPlacas: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  capacidadBadge: {
    backgroundColor: "#E8ECF0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  capacidadTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  resultadoSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 26,
  },
  resultadoFilaOperador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 2,
  },
  resultadoOperador: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  botonConfirmar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  botonConfirmarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface,
  },
});
