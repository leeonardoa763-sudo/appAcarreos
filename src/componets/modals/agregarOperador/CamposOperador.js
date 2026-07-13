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
 * CamposOperador
 *
 * Campos del modo "operador": datos del operador + sindicato, y opcionalmente
 * (switch) un buscador de PLACAS YA EXISTENTES del mismo sindicato para
 * asignárselas de inmediato.
 */
const CamposOperador = ({
  form,
  errores,
  guardando,
  onCampo,
  sindicatos,
  loadingSindicatos,
  asignarPlacas,
  onToggleAsignar,
  vehiculos,
  loadingVehiculos,
  vehiculoAsignadoId,
  onSelectVehiculo,
}) => {
  const [busqueda, setBusqueda] = useState("");

  const vehiculosDelSindicato = form.sindicatoId
    ? vehiculos.filter((v) => v.id_sindicato === form.sindicatoId)
    : [];

  const vehiculosFiltrados = busqueda.trim()
    ? vehiculosDelSindicato.filter((v) =>
        v.placas?.toLowerCase().includes(busqueda.toLowerCase().trim()),
      )
    : vehiculosDelSindicato;

  return (
    <>
      {/* ── Datos del operador ── */}
      <View style={styles.seccion}>
        <View style={styles.seccionHeader}>
          <MaterialCommunityIcons
            name="account-outline"
            size={18}
            color={colors.secondary}
          />
          <Text style={styles.seccionTitulo}>Datos del operador</Text>
        </View>

        <FormInput
          label="Nombre(s)"
          value={form.nombre}
          onChangeText={(v) => onCampo("nombre", v)}
          placeholder="Ej: Juan Carlos"
          autoCapitalize="words"
          error={errores.nombre}
          editable={!guardando}
        />

        <FormInput
          label="Primer apellido"
          value={form.primerApellido}
          onChangeText={(v) => onCampo("primerApellido", v)}
          placeholder="Ej: García"
          autoCapitalize="words"
          error={errores.primerApellido}
          editable={!guardando}
        />

        <FormInput
          label="Segundo apellido (opcional)"
          value={form.segundoApellido}
          onChangeText={(v) => onCampo("segundoApellido", v)}
          placeholder="Ej: López"
          autoCapitalize="words"
          editable={!guardando}
        />

        {loadingSindicatos ? (
          <View style={styles.cargando}>
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
      </View>

      {/* ── Switch: asignar placas ahora ── */}
      <View style={styles.switchFila}>
        <View style={styles.switchTextos}>
          <Text style={styles.switchTitulo}>Asignar placas ahora</Text>
          <Text style={styles.switchSubtitulo}>
            Opcional. Busca una placa ya registrada del mismo sindicato. Puedes
            dejarlo para después.
          </Text>
        </View>
        <Switch
          value={asignarPlacas}
          onValueChange={onToggleAsignar}
          disabled={guardando}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.surface}
        />
      </View>

      {/* ── Buscador de placas existentes (solo si se asigna) ── */}
      {asignarPlacas && (
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <MaterialCommunityIcons
              name="dump-truck"
              size={18}
              color={colors.secondary}
            />
            <Text style={styles.seccionTitulo}>Placa a asignar</Text>
          </View>

          {!form.sindicatoId ? (
            <Text style={styles.aviso}>
              Selecciona primero un sindicato para ver sus placas.
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
                  onChangeText={(v) =>
                    setBusqueda(v.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
                  }
                  placeholder="Buscar placas..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  maxLength={10}
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

              {errores.placas && (
                <Text style={styles.errorTexto}>{errores.placas}</Text>
              )}

              {loadingVehiculos ? (
                <View style={styles.cargando}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.cargandoTexto}>Cargando placas...</Text>
                </View>
              ) : vehiculosFiltrados.length === 0 ? (
                <Text style={styles.aviso}>
                  No hay placas registradas en este sindicato.
                </Text>
              ) : (
                <View style={styles.lista}>
                  {vehiculosFiltrados.map((v) => {
                    const activo = vehiculoAsignadoId === v.id_vehiculo;
                    return (
                      <TouchableOpacity
                        key={v.id_vehiculo}
                        style={[styles.item, activo && styles.itemActivo]}
                        onPress={() => onSelectVehiculo(v.id_vehiculo)}
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
                        <View style={styles.itemTextos}>
                          <View style={styles.itemFila}>
                            <Text
                              style={[
                                styles.itemPlacas,
                                activo && styles.itemPlacasActivo,
                              ]}
                            >
                              {v.placas}
                            </Text>
                            {v.capacidad_m3 != null && (
                              <Text style={styles.itemCap}>
                                {v.capacidad_m3} m³
                              </Text>
                            )}
                          </View>
                          {v.operadorActual && (
                            <Text style={styles.itemSub} numberOfLines={1}>
                              Asignado a: {v.operadorActual}
                            </Text>
                          )}
                        </View>
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

export default CamposOperador;

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
  cargando: {
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
  itemTextos: {
    flex: 1,
    gap: 2,
  },
  itemFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemPlacas: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  itemPlacasActivo: {
    color: colors.accent,
  },
  itemCap: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  itemSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});
