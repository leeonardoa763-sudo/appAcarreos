// src/componets/bancos/modalPartes.js
//
// Piezas compartidas por los cuatro modales de GestionBancosModales.js
// (cascaron, pie de botones, fila informativa, campo numerico y mensaje de
// error) y sus estilos. Viven aparte para mantener cada archivo bajo 600
// lineas.
import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

export const CajaModal = ({ visible, titulo, onCerrar, children, pie }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onCerrar}
  >
    <View style={estilosModal.overlay}>
      <View style={estilosModal.caja}>
        <View style={estilosModal.header}>
          <Text style={estilosModal.titulo}>{titulo}</Text>
          <TouchableOpacity
            onPress={onCerrar}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={estilosModal.cuerpo}
          contentContainerStyle={estilosModal.cuerpoContenido}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        {pie}
      </View>
    </View>
  </Modal>
);

export const PieModal = ({
  onCerrar,
  onGuardar,
  guardando,
  habilitado = true,
}) => (
  <View style={estilosModal.pie}>
    <TouchableOpacity
      style={estilosModal.btnCancelar}
      onPress={onCerrar}
      disabled={guardando}
      activeOpacity={0.7}
    >
      <Text style={estilosModal.btnCancelarTexto}>Cancelar</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        estilosModal.btnGuardar,
        (guardando || !habilitado) && estilosModal.btnDisabled,
      ]}
      onPress={onGuardar}
      disabled={guardando || !habilitado}
      activeOpacity={0.8}
    >
      {guardando ? (
        <ActivityIndicator size="small" color={colors.surface} />
      ) : (
        <Text style={estilosModal.btnGuardarTexto}>Guardar</Text>
      )}
    </TouchableOpacity>
  </View>
);

export const FilaInfo = ({ icono, texto }) => (
  <View style={estilosModal.infoRow}>
    <MaterialCommunityIcons name={icono} size={16} color={colors.secondary} />
    <Text style={estilosModal.infoTexto}>{texto}</Text>
  </View>
);

export const CampoNumero = ({
  label,
  valor,
  onChange,
  placeholder,
  sufijo,
  error,
}) => (
  <>
    <Text style={estilosModal.inputLabel}>{label}</Text>
    <View style={[estilosModal.inputFila, error ? estilosModal.inputError : null]}>
      <TextInput
        style={estilosModal.input}
        value={valor}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.input.placeholder}
      />
      <Text style={estilosModal.inputSufijo}>{sufijo}</Text>
    </View>
  </>
);

export const MensajeError = ({ texto }) =>
  texto ? (
    <View style={estilosModal.errorCaja}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={15}
        color={colors.danger}
      />
      <Text style={estilosModal.errorTexto}>{texto}</Text>
    </View>
  ) : null;

export const estilosModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  caja: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  cuerpo: {
    flexGrow: 0,
  },
  cuerpoContenido: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  espacio: {
    height: 14,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputFila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  inputSufijo: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: 6,
  },
  inputError: {
    borderColor: colors.danger,
  },

  errorCaja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  errorTexto: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    lineHeight: 16,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },

  pie: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  btnCancelarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  btnGuardar: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  btnGuardarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
