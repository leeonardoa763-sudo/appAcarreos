import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";

const ConfirmarOperadorCard = ({
  operadorConfirmado,
  operadores,
  sindicatoNombre,
  expandido,
  onExpandir,
  onSeleccionar,
}) => {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = busqueda.trim()
    ? operadores.filter((op) =>
        op.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : operadores;

  return (
    <View style={styles.card}>
      <View style={styles.fila}>
        <View style={styles.icono}>
          <MaterialCommunityIcons
            name="account-hard-hat"
            size={20}
            color={colors.secondary}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>Operador en turno</Text>
          <Text style={styles.nombre}>
            {operadorConfirmado?.nombre_completo ?? "Sin operador asignado"}
          </Text>
          {sindicatoNombre && (
            <Text style={styles.sindicato}>{sindicatoNombre}</Text>
          )}
        </View>
        {!expandido && (
          <TouchableOpacity
            style={styles.btnCambiar}
            onPress={onExpandir}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.btnCambiarTexto}>Cambiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {expandido && (
        <View style={styles.selector}>
          <View style={styles.buscadorWrapper}>
            <MaterialCommunityIcons
              name="magnify"
              size={18}
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
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.lista}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filtrados.length === 0 ? (
              <Text style={styles.vacio}>No se encontraron operadores</Text>
            ) : (
              filtrados.map((op) => {
                const activo =
                  operadorConfirmado?.id_operador === op.id_operador;
                return (
                  <TouchableOpacity
                    key={op.id_operador}
                    style={[styles.itemOp, activo && styles.itemOpActivo]}
                    onPress={() => onSeleccionar(op)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="account-hard-hat"
                      size={18}
                      color={activo ? colors.secondary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.itemOpNombre,
                        activo && styles.itemOpNombreActivo,
                      ]}
                    >
                      {op.nombre_completo}
                    </Text>
                    {activo && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={colors.secondary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icono: {
    backgroundColor: `${colors.secondary}15`,
    borderRadius: 8,
    padding: 8,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nombre: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sindicato: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
  btnCambiar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  btnCambiarTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  selector: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.background,
    paddingTop: 14,
  },
  buscadorWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buscador: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    padding: 0,
  },
  lista: {
    maxHeight: 220,
  },
  vacio: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 16,
  },
  itemOp: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 10,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  itemOpActivo: {
    backgroundColor: `${colors.secondary}10`,
    borderBottomColor: `${colors.secondary}20`,
  },
  itemOpNombre: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  itemOpNombreActivo: {
    fontWeight: "700",
    color: colors.secondary,
  },
});

export default ConfirmarOperadorCard;
