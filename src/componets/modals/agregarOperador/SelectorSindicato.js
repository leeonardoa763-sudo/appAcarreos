import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";

const SelectorSindicato = ({ sindicatos, value, onSelect, error, disabled }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const seleccionado = sindicatos.find((s) => s.id_sindicato === value);

  const handleSeleccionar = (item) => {
    onSelect(item.id_sindicato);
    setModalVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Sindicato</Text>

      <TouchableOpacity
        style={[
          styles.boton,
          error && styles.botonError,
          disabled && styles.botonDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.botonTexto, !seleccionado && styles.botonPlaceholder]}
          numberOfLines={1}
        >
          {seleccionado ? seleccionado.sindicato : "Seleccionar sindicato..."}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorTexto}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitulo}>Seleccionar sindicato</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={sindicatos}
              keyExtractor={(item) => item.id_sindicato.toString()}
              renderItem={({ item }) => {
                const estaSeleccionado = item.id_sindicato === value;
                return (
                  <TouchableOpacity
                    style={[styles.opcion, estaSeleccionado && styles.opcionActiva]}
                    onPress={() => handleSeleccionar(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.opcionTexto,
                        estaSeleccionado && styles.opcionTextoActivo,
                      ]}
                    >
                      {item.sindicato}
                    </Text>
                    {estaSeleccionado && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={colors.accent}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separador} />}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  botonError: {
    borderColor: colors.danger,
  },
  botonDisabled: {
    opacity: 0.5,
  },
  botonTexto: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  botonPlaceholder: {
    color: colors.textSecondary,
  },
  errorTexto: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: Platform.OS === "ios" ? 50 : 80,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  opcionActiva: {
    backgroundColor: `${colors.accent}10`,
  },
  opcionTexto: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  opcionTextoActivo: {
    color: colors.accent,
    fontWeight: "600",
  },
  separador: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
});

export default SelectorSindicato;
