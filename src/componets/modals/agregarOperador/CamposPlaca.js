// 1. React
import React, { useState } from "react";

// 2. React Native
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../../config/colors";

// 5. Subcomponentes
import FormInput from "../../forms/FormInput";
import SelectorSindicato from "./SelectorSindicato";

/**
 * CamposPlaca
 *
 * Campos del modo "placa": datos del vehículo + sindicato, y opcionalmente
 * (switch) seleccionar un operador YA existente del mismo sindicato para
 * asignárselo de inmediato.
 */
const CamposPlaca = ({
  form,
  errores,
  guardando,
  onCampo,
  sindicatos,
  loadingSindicatos,
  asignarOperador,
  onToggleAsignar,
  operadores,
  loadingOperadores,
  operadorAsignadoId,
  onSelectOperador,
}) => {
  const [busqueda, setBusqueda] = useState("");

  const operadoresDelSindicato = form.sindicatoId
    ? operadores.filter((op) => op.id_sindicato === form.sindicatoId)
    : [];

  const operadoresFiltrados = busqueda.trim()
    ? operadoresDelSindicato.filter((op) =>
        op.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : operadoresDelSindicato;

  return (
    <>
      {/* ── Datos del vehículo ── */}
      <View style={styles.seccion}>
        <View style={styles.seccionHeader}>
          <MaterialCommunityIcons
            name="dump-truck"
            size={18}
            color={colors.secondary}
          />
          <Text style={styles.seccionTitulo}>Datos del vehículo</Text>
        </View>

        {loadingSindicatos ? (
          <View style={styles.cargandoSindicatos}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.cargandoTexto}>Cargando sindicatos...</Text>
          </View>
        ) : (
          <SelectorSindicato
            sindicatos={sindicatos}
            value={form.sindicatoId}
            onSelect={(id) => onCampo("sindicatoId", id)}
            error={errores.sindicatoId}
            disabled={guardando}
          />
        )}

        <FormInput
          label="Placas"
          value={form.placas}
          onChangeText={(v) => onCampo("placas", v.replace(/[^A-Z0-9-]/g, ""))}
          placeholder="Ej: ABC-123"
          autoCapitalize="characters"
          maxLength={10}
          error={errores.placas}
          editable={!guardando}
        />

        <FormInput
          label="Capacidad del camión"
          value={form.capacidad}
          onChangeText={(v) => onCampo("capacidad", v.replace(/[^0-9.]/g, ""))}
          placeholder="Ej: 7.5"
          keyboardType="decimal-pad"
          suffix="m³"
          error={errores.capacidad}
          editable={!guardando}
        />
      </View>

      {/* ── Switch: asignar operador ahora ── */}
      <View style={styles.switchFila}>
        <View style={styles.switchTextos}>
          <Text style={styles.switchTitulo}>Asignar operador ahora</Text>
          <Text style={styles.switchSubtitulo}>
            Opcional. Puedes registrar solo la placa y asignarle un operador
            después.
          </Text>
        </View>
        <Switch
          value={asignarOperador}
          onValueChange={onToggleAsignar}
          disabled={guardando}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.surface}
        />
      </View>

      {/* ── Selector de operador (solo si se asigna) ── */}
      {asignarOperador && (
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <MaterialCommunityIcons
              name="account-outline"
              size={18}
              color={colors.secondary}
            />
            <Text style={styles.seccionTitulo}>Operador a asignar</Text>
          </View>

          {!form.sindicatoId ? (
            <Text style={styles.aviso}>
              Selecciona primero un sindicato para ver sus operadores.
            </Text>
          ) : (
            <>
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
                  autoCapitalize="words"
                  editable={!guardando}
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

              {errores.operador && (
                <Text style={styles.errorTexto}>{errores.operador}</Text>
              )}

              {loadingOperadores ? (
                <View style={styles.cargandoSindicatos}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.cargandoTexto}>Cargando operadores...</Text>
                </View>
              ) : operadoresFiltrados.length === 0 ? (
                <Text style={styles.aviso}>
                  No hay operadores en este sindicato.
                </Text>
              ) : (
                <View style={styles.lista}>
                  {operadoresFiltrados.map((op) => {
                    const activo = operadorAsignadoId === op.id_operador;
                    return (
                      <TouchableOpacity
                        key={op.id_operador}
                        style={[styles.item, activo && styles.itemActivo]}
                        onPress={() => onSelectOperador(op.id_operador)}
                        disabled={guardando}
                        activeOpacity={0.75}
                      >
                        <MaterialCommunityIcons
                          name={
                            activo
                              ? "check-circle"
                              : "checkbox-blank-circle-outline"
                          }
                          size={20}
                          color={activo ? colors.accent : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.itemNombre,
                            activo && styles.itemNombreActivo,
                          ]}
                          numberOfLines={1}
                        >
                          {op.nombre_completo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </>
  );
};

export default CamposPlaca;

const styles = StyleSheet.create({
  seccion: {
    marginBottom: 20,
    gap: 2,
  },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cargandoSindicatos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 10,
    marginBottom: 8,
  },
  cargandoTexto: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  switchFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  switchTextos: {
    flex: 1,
    gap: 2,
  },
  switchTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  switchSubtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  aviso: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  buscadorWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
    marginBottom: 8,
  },
  buscador: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  errorTexto: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: 6,
  },
  lista: {
    gap: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemActivo: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}12`,
  },
  itemNombre: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  itemNombreActivo: {
    fontWeight: "700",
    color: colors.accent,
  },
});
