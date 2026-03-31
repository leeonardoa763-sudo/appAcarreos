import React, { useState, forwardRef, useImperativeHandle } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const MAX_VALES = 10;
const MIN_VALES = 1;

const SelectorCantidadVales = forwardRef(
  ({ cantidad, onCantidadChange, onConfirmar }, ref) => {
    const [modalVisible, setModalVisible] = useState(false);

    // El padre llama a selectorRef.current.pedirConfirmacion()
    // en lugar de ejecutar handleCrearVale directamente
    useImperativeHandle(ref, () => ({
      pedirConfirmacion: () => setModalVisible(true),
    }));

    const handleDecrementar = () => {
      if (cantidad > MIN_VALES) onCantidadChange(cantidad - 1);
    };

    const handleIncrementar = () => {
      if (cantidad < MAX_VALES) onCantidadChange(cantidad + 1);
    };

    const handleConfirmar = () => {
      setModalVisible(false);
      onConfirmar();
    };

    return (
      <>
        {/* Selector +/- */}
        <View style={styles.contenedor}>
          <View style={styles.encabezado}>
            <MaterialCommunityIcons
              name="content-copy"
              size={18}
              color={colors.secondary}
            />
            <Text style={styles.titulo}>Cantidad de vales a crear</Text>
          </View>

          <Text style={styles.descripcion}>
            Se generaran {cantidad} vale{cantidad > 1 ? "s" : ""} identicos con
            folios consecutivos
          </Text>

          <View style={styles.controles}>
            <TouchableOpacity
              style={[
                styles.boton,
                cantidad <= MIN_VALES && styles.botonDeshabilitado,
              ]}
              onPress={handleDecrementar}
              disabled={cantidad <= MIN_VALES}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="minus"
                size={22}
                color={
                  cantidad <= MIN_VALES
                    ? colors.textSecondary
                    : colors.secondary
                }
              />
            </TouchableOpacity>

            <View style={styles.cantidadContainer}>
              <Text style={styles.cantidadTexto}>{cantidad}</Text>
              <Text style={styles.cantidadLabel}>
                {cantidad === 1 ? "vale" : "vales"}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.boton,
                cantidad >= MAX_VALES && styles.botonDeshabilitado,
              ]}
              onPress={handleIncrementar}
              disabled={cantidad >= MAX_VALES}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="plus"
                size={22}
                color={
                  cantidad >= MAX_VALES
                    ? colors.textSecondary
                    : colors.secondary
                }
              />
            </TouchableOpacity>
          </View>

          {cantidad >= MAX_VALES && (
            <Text style={styles.limiteTexto}>
              Maximo {MAX_VALES} vales por lote
            </Text>
          )}
        </View>

        {/* Modal de confirmacion */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContenido}>
              <View style={styles.iconoWarning}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={40}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.modalTitulo}>
                Crear {cantidad} vale{cantidad > 1 ? "s" : ""}
              </Text>

              <Text style={styles.modalMensaje}>
                Se crearan{" "}
                <Text style={styles.modalMensajeNegrita}>
                  {cantidad} vale{cantidad > 1 ? "s" : ""}
                </Text>{" "}
                con folios consecutivos sin operador ni vehiculo asignado.
              </Text>

              <View style={styles.advertenciaBox}>
                <MaterialCommunityIcons
                  name="lock-alert"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.advertenciaTexto}>
                  Esta accion no se puede deshacer
                </Text>
              </View>

              <View style={styles.modalBotones}>
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonConfirmar}
                  onPress={handleConfirmar}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color={colors.surface}
                  />
                  <Text style={styles.botonConfirmarTexto}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  },
);

export { MAX_VALES };
export default SelectorCantidadVales;

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.secondary + "40",
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  titulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  descripcion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  controles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  boton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  botonDeshabilitado: {
    borderColor: colors.textSecondary + "50",
    backgroundColor: colors.background,
  },
  cantidadContainer: {
    alignItems: "center",
    minWidth: 60,
  },
  cantidadTexto: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.secondary,
    lineHeight: 36,
  },
  cantidadLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  limiteTexto: {
    fontSize: 11,
    color: colors.primary,
    textAlign: "center",
    marginTop: 10,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  modalContenido: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  iconoWarning: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  modalMensaje: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
  },
  modalMensajeNegrita: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  advertenciaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary + "12",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    width: "100%",
  },
  advertenciaTexto: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  modalBotones: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  botonCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
  },
  botonCancelarTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  botonConfirmar: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  botonConfirmarTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
});
