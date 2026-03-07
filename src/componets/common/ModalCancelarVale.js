// src/components/common/ModalCancelarVale.js
//
// Modal para capturar el motivo de cancelación de un vale.
// Se muestra únicamente cuando el usuario es RESIDENTE
// y el vale está en estado "en_proceso".

import React from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const ModalCancelarVale = ({
  visible,
  motivo,
  errorMotivo,
  cancelando,
  onCambioMotivo,
  onConfirmar,
  onCerrar,
  MOTIVO_MIN_CHARS,
}) => {
  const caracteres = motivo.trim().length;
  const faltanCaracteres = Math.max(0, MOTIVO_MIN_CHARS - caracteres);
  const motivoValido = caracteres >= MOTIVO_MIN_CHARS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Icono y título */}
            <View style={styles.header}>
              <View style={styles.iconoContenedor}>
                <MaterialCommunityIcons
                  name="cancel"
                  size={32}
                  color={colors.danger}
                />
              </View>
              <Text style={styles.titulo}>Cancelar Vale</Text>
              <Text style={styles.subtitulo}>
                Esta acción no se puede deshacer
              </Text>
            </View>

            {/* Input de motivo */}
            <View style={styles.inputSeccion}>
              <Text style={styles.label}>
                Motivo de cancelación
                <Text style={styles.labelObligatorio}> *</Text>
              </Text>

              <TextInput
                style={[
                  styles.input,
                  errorMotivo ? styles.inputError : null,
                  motivoValido ? styles.inputValido : null,
                ]}
                value={motivo}
                onChangeText={onCambioMotivo}
                placeholder="Describe el motivo por el cual se cancela este vale..."
                placeholderTextColor={colors.input.placeholder}
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!cancelando}
                textAlignVertical="top"
              />

              {/* Contador y error */}
              <View style={styles.inputFooter}>
                {errorMotivo ? (
                  <Text style={styles.textoError}>{errorMotivo}</Text>
                ) : faltanCaracteres > 0 ? (
                  <Text style={styles.textoFaltan}>
                    Faltan {faltanCaracteres} caracteres
                  </Text>
                ) : (
                  <Text style={styles.textoOk}>Motivo válido</Text>
                )}
                <Text style={styles.contador}>{caracteres}/500</Text>
              </View>
            </View>

            {/* Botones */}
            <View style={styles.botones}>
              <TouchableOpacity
                style={[styles.boton, styles.botonCancelar]}
                onPress={onCerrar}
                disabled={cancelando}
              >
                <Text style={styles.textoBotonCancelar}>Volver</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.boton,
                  styles.botonConfirmar,
                  (!motivoValido || cancelando) && styles.botonDeshabilitado,
                ]}
                onPress={onConfirmar}
                disabled={!motivoValido || cancelando}
              >
                {cancelando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="cancel"
                      size={18}
                      color="#FFFFFF"
                      style={styles.botonIcono}
                    />
                    <Text style={styles.textoBotonConfirmar}>
                      Confirmar cancelación
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ModalCancelarVale;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE0E0",
  },
  iconoContenedor: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFE0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.danger,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  inputSeccion: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  labelObligatorio: {
    color: colors.danger,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.input.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.input.background,
    minHeight: 100,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputValido: {
    borderColor: colors.accent,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  textoError: {
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  textoFaltan: {
    fontSize: 12,
    color: colors.warning,
    flex: 1,
  },
  textoOk: {
    fontSize: 12,
    color: colors.accent,
    flex: 1,
  },
  contador: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  botones: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  boton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  botonCancelar: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  botonConfirmar: {
    backgroundColor: colors.danger,
  },
  botonDeshabilitado: {
    opacity: 0.45,
  },
  textoBotonCancelar: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  textoBotonConfirmar: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  botonIcono: {
    marginRight: 6,
  },
});
