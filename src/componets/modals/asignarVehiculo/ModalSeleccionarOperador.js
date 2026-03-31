import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../config/colors";

const ModalSeleccionarOperador = ({
  visible,
  operadores,
  sindicatoNombre,
  asignando,
  onSeleccionar,
  onCancelar,
}) => {
  const [busqueda, setBusqueda] = useState("");
  const insets = useSafeAreaInsets();

  const operadoresFiltrados = busqueda.trim()
    ? operadores.filter((op) =>
        op.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : operadores;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancelar}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={22}
                color={colors.textPrimary}
              />
              <View>
                <Text style={styles.titulo}>Asignar Operador</Text>
                {sindicatoNombre && (
                  <Text style={styles.sindicatoChip}>{sindicatoNombre}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={onCancelar}
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
            Este vehículo no tiene operador asignado. El operador seleccionado
            quedará guardado para futuros escaneos.
          </Text>

          {/* Buscador */}
          <View style={styles.buscadorWrapper}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.buscador}
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar operador..."
              placeholderTextColor={colors.textSecondary}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista */}
          <ScrollView
            style={styles.lista}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {operadoresFiltrados.length === 0 ? (
              <View style={styles.vacio}>
                <MaterialCommunityIcons
                  name="account-off-outline"
                  size={40}
                  color={colors.textSecondary}
                />
                <Text style={styles.vacioTexto}>
                  No se encontraron operadores
                </Text>
              </View>
            ) : (
              operadoresFiltrados.map((op) => (
                <TouchableOpacity
                  key={op.id_operador}
                  style={styles.itemOperador}
                  onPress={() => onSeleccionar(op)}
                  disabled={asignando}
                  activeOpacity={0.75}
                >
                  <View style={styles.itemIcono}>
                    <MaterialCommunityIcons
                      name="account-hard-hat"
                      size={20}
                      color={colors.secondary}
                    />
                  </View>
                  <Text style={styles.itemNombre}>{op.nombre_completo}</Text>
                  {asignando ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    maxHeight: "75%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sindicatoChip: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "600",
    marginTop: 2,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  buscadorWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buscador: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  lista: {
    maxHeight: 320,
  },
  itemOperador: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  itemIcono: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 6,
  },
  itemNombre: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  vacio: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  vacioTexto: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default ModalSeleccionarOperador;
