/**
 * components/acarreos/rentaHelpers/BancoDescargaModal.js
 *
 * Modal para capturar el nombre del banco de descarga
 * antes de generar un ticket de descarga.
 *
 * Se muestra cada vez que el usuario quiere imprimir un ticket,
 * tanto para el primer viaje como para los siguientes.
 *
 * PROPS:
 * - visible: boolean
 * - onConfirmar: (bancoDescarga: string) => void
 * - onCancelar: () => void
 * - numeroTicket: number — número del ticket que se va a generar
 */

// 1. React
import React, { useState, useEffect } from "react";

// 2. React Native
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local
import { colors } from "../../../config/colors";

const BancoDescargaModal = ({
  visible,
  onConfirmar,
  onCancelar,
  numeroTicket = 1,
  loading = false,
}) => {
  const [banco, setBanco] = useState("");
  const [error, setError] = useState("");

  // Limpiar campo cada vez que se abre el modal
  useEffect(() => {
    if (visible) {
      setBanco("");
      setError("");
    }
  }, [visible]);

  const handleConfirmar = () => {
    const bancoLimpio = banco.trim();

    if (!bancoLimpio) {
      setError("El nombre del banco es obligatorio.");
      return;
    }

    if (bancoLimpio.length < 3) {
      setError("Escribe al menos 3 caracteres.");
      return;
    }

    setError("");
    onConfirmar(bancoLimpio.toUpperCase());
  };

  const handleChangeTexto = (texto) => {
    // Forzar mayusculas en tiempo real
    setBanco(texto.toUpperCase());
    if (error) setError("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancelar}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Icono y título */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="dump-truck"
                size={32}
                color={colors.secondary}
              />
            </View>
            <Text style={styles.titulo}>Ticket de Descarga</Text>
            <Text style={styles.subtitulo}>
              Ticket #{String(numeroTicket).padStart(2, "0")}
            </Text>
          </View>

          {/* Instrucción */}
          <Text style={styles.instruccion}>
            Escribe el nombre del banco donde se descargará el material:
          </Text>

          {/* Input */}
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={banco}
            onChangeText={handleChangeTexto}
            placeholder="Ej. BANCO MUNICIPAL NORTE"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            autoFocus
            maxLength={60}
            editable={!loading}
          />

          {/* Error */}
          {!!error && <Text style={styles.errorTexto}>{error}</Text>}

          {/* Contador de caracteres */}
          <Text style={styles.contador}>{banco.length}/60</Text>

          {/* Botones */}
          <View style={styles.botones}>
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={onCancelar}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnConfirmar, loading && styles.btnDeshabilitado]}
              onPress={handleConfirmar}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="printer-pos"
                    size={18}
                    color={colors.surface}
                  />
                  <Text style={styles.btnConfirmarTexto}>Imprimir</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.secondary}18`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  instruccion: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    backgroundColor: colors.background,
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: "#E74C3C",
  },
  errorTexto: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 6,
    marginLeft: 2,
  },
  contador: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 20,
  },
  botones: {
    flexDirection: "row",
    gap: 12,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelarTexto: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  btnConfirmar: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnDeshabilitado: {
    opacity: 0.6,
  },
  btnConfirmarTexto: {
    fontSize: 15,
    color: colors.surface,
    fontWeight: "600",
  },
});

export default BancoDescargaModal;
