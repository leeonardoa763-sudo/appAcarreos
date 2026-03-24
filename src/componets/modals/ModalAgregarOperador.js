// 1. React y hooks
import React, { useState, useEffect, useRef } from "react";

// 2. React Native
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";

// 5. Local - Componentes
import FormInput from "../forms/FormInput";

// ─── Validaciones ─────────────────────────────────────────────────────────────

const validarFormulario = (form) => {
  const errores = {};

  if (!form.nombre.trim()) {
    errores.nombre = "El nombre es obligatorio";
  }
  if (!form.primerApellido.trim()) {
    errores.primerApellido = "El primer apellido es obligatorio";
  }
  if (!form.sindicatoId) {
    errores.sindicatoId = "Selecciona un sindicato";
  }

  const placasLimpias = form.placas.trim().toUpperCase();
  if (!placasLimpias) {
    errores.placas = "Las placas son obligatorias";
  } else if (placasLimpias.length < 6 || placasLimpias.length > 10) {
    errores.placas = "Las placas deben tener entre 6 y 10 caracteres";
  }

  if (!form.capacidad.trim()) {
    errores.capacidad = "La capacidad es obligatoria";
  } else if (
    isNaN(parseFloat(form.capacidad)) ||
    parseFloat(form.capacidad) <= 0
  ) {
    errores.capacidad = "Ingresa una capacidad válida mayor a 0";
  }

  return errores;
};

// ─── Selector de sindicato con modal propio ───────────────────────────────────

const SelectorSindicato = ({
  sindicatos,
  value,
  onSelect,
  error,
  disabled,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const seleccionado = sindicatos.find((s) => s.id_sindicato === value);

  const handleSeleccionar = (item) => {
    onSelect(item.id_sindicato);
    setModalVisible(false);
  };

  return (
    <View style={selectorStyles.wrapper}>
      <Text style={selectorStyles.label}>Sindicato</Text>

      <TouchableOpacity
        style={[
          selectorStyles.boton,
          error && selectorStyles.botonError,
          disabled && selectorStyles.botonDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            selectorStyles.botonTexto,
            !seleccionado && selectorStyles.botonPlaceholder,
          ]}
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

      {error && <Text style={selectorStyles.errorTexto}>{error}</Text>}

      {/* Modal interno del selector */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={selectorStyles.overlay}>
          <View style={selectorStyles.sheet}>
            <View style={selectorStyles.sheetHeader}>
              <Text style={selectorStyles.sheetTitulo}>
                Seleccionar sindicato
              </Text>
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
                    style={[
                      selectorStyles.opcion,
                      estaSeleccionado && selectorStyles.opcionActiva,
                    ]}
                    onPress={() => handleSeleccionar(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        selectorStyles.opcionTexto,
                        estaSeleccionado && selectorStyles.opcionTextoActivo,
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
              ItemSeparatorComponent={() => (
                <View style={selectorStyles.separador} />
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const selectorStyles = StyleSheet.create({
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

// ─── Componente principal ─────────────────────────────────────────────────────

const ModalAgregarOperador = ({ visible, onClose, onOperadorAgregado }) => {
  const isMounted = useRef(true);

  const estadoInicial = {
    nombre: "",
    primerApellido: "",
    segundoApellido: "",
    sindicatoId: null,
    placas: "",
    capacidad: "",
  };

  const [form, setForm] = useState(estadoInicial);
  const [errores, setErrores] = useState({});
  const [sindicatos, setSindicatos] = useState([]);
  const [loadingSindicatos, setLoadingSindicatos] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    cargarSindicatos();
    setForm(estadoInicial);
    setErrores({});
  }, [visible]);

  const cargarSindicatos = async () => {
    try {
      setLoadingSindicatos(true);
      const { data, error } = await supabase
        .from("sindicatos")
        .select("id_sindicato, sindicato")
        .order("sindicato");

      if (error) throw error;
      if (isMounted.current) setSindicatos(data || []);
    } catch (error) {
      console.error("[ModalAgregarOperador] Error cargando sindicatos:", error);
    } finally {
      if (isMounted.current) setLoadingSindicatos(false);
    }
  };

  const handleCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: null }));
    }
  };

  const handleGuardar = async () => {
    const erroresNuevos = validarFormulario(form);
    if (Object.keys(erroresNuevos).length > 0) {
      setErrores(erroresNuevos);
      return;
    }

    try {
      setGuardando(true);

      const { data: operadorNuevo, error: errorOperador } = await supabase
        .from("operadores")
        .insert({
          nombre: form.nombre.trim(),
          primer_apellido: form.primerApellido.trim(),
          segundo_apellido: form.segundoApellido.trim() || null,
          id_sindicato: form.sindicatoId,
          activo: true,
        })
        .select("id_operador, nombre_completo, id_sindicato")
        .single();

      if (errorOperador) throw errorOperador;

      const { data: vehiculoNuevo, error: errorVehiculo } = await supabase
        .from("vehiculos")
        .insert({
          placas: form.placas.trim().toUpperCase(),
          capacidad_m3: parseFloat(form.capacidad),
          id_sindicato: form.sindicatoId,
          activo: true,
        })
        .select("id_vehiculo, placas, capacidad_m3")
        .single();

      if (errorVehiculo) throw errorVehiculo;

      if (!isMounted.current) return;

      Alert.alert(
        "Operador registrado",
        `${operadorNuevo.nombre_completo} y su vehículo (${vehiculoNuevo.placas}) fueron agregados correctamente.`,
        [
          {
            text: "OK",
            onPress: () => onOperadorAgregado?.(operadorNuevo, vehiculoNuevo),
          },
        ],
      );
    } catch (error) {
      console.error("[ModalAgregarOperador] Error al guardar:", error);
      Alert.alert(
        "Error",
        "No se pudo registrar el operador. Por favor intenta de nuevo.",
        [{ text: "OK" }],
      );
    } finally {
      if (isMounted.current) setGuardando(false);
    }
  };

  const sindicatoSeleccionado = sindicatos.find(
    (s) => s.id_sindicato === form.sindicatoId,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.headerTitulo}>Nuevo Operador</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={guardando}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Sección: Datos del operador ── */}
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
                onChangeText={(v) => handleCampo("nombre", v)}
                placeholder="Ej: Juan Carlos"
                autoCapitalize="words"
                error={errores.nombre}
                editable={!guardando}
              />

              <FormInput
                label="Primer apellido"
                value={form.primerApellido}
                onChangeText={(v) => handleCampo("primerApellido", v)}
                placeholder="Ej: García"
                autoCapitalize="words"
                error={errores.primerApellido}
                editable={!guardando}
              />

              <FormInput
                label="Segundo apellido (opcional)"
                value={form.segundoApellido}
                onChangeText={(v) => handleCampo("segundoApellido", v)}
                placeholder="Ej: López"
                autoCapitalize="words"
                editable={!guardando}
              />

              {loadingSindicatos ? (
                <View style={styles.cargandoSindicatos}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.cargandoTexto}>
                    Cargando sindicatos...
                  </Text>
                </View>
              ) : (
                <SelectorSindicato
                  sindicatos={sindicatos}
                  value={form.sindicatoId}
                  onSelect={(id) => handleCampo("sindicatoId", id)}
                  error={errores.sindicatoId}
                  disabled={guardando}
                />
              )}
            </View>

            {/* ── Sección: Datos del vehículo ── */}
            <View style={styles.seccion}>
              <View style={styles.seccionHeader}>
                <MaterialCommunityIcons
                  name="dump-truck"
                  size={18}
                  color={colors.secondary}
                />
                <Text style={styles.seccionTitulo}>Datos del vehículo</Text>
              </View>

              {form.sindicatoId && (
                <View style={styles.sindicatoVisor}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.sindicatoVisorTexto}>
                    Vehículo asignado a: {sindicatoSeleccionado?.sindicato}
                  </Text>
                </View>
              )}

              <FormInput
                label="Placas"
                value={form.placas}
                onChangeText={(v) =>
                  handleCampo(
                    "placas",
                    v.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                  )
                }
                placeholder="Ej: ABC-123"
                autoCapitalize="characters"
                maxLength={10}
                error={errores.placas}
                editable={!guardando}
              />

              <FormInput
                label="Capacidad del camión"
                value={form.capacidad}
                onChangeText={(v) =>
                  handleCampo("capacidad", v.replace(/[^0-9.]/g, ""))
                }
                placeholder="Ej: 7.5"
                keyboardType="decimal-pad"
                suffix="m³"
                error={errores.capacidad}
                editable={!guardando}
              />
            </View>

            {/* ── Nota informativa ── */}
            <View style={styles.nota}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={colors.info}
              />
              <Text style={styles.notaTexto}>
                El operador y su vehículo quedarán disponibles de inmediato para
                crear vales.
              </Text>
            </View>
          </ScrollView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={onClose}
              disabled={guardando}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnGuardar,
                guardando && styles.btnGuardarDisabled,
              ]}
              onPress={handleGuardar}
              disabled={guardando}
              activeOpacity={0.8}
            >
              {guardando ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <MaterialCommunityIcons
                  name="account-plus"
                  size={20}
                  color={colors.surface}
                />
              )}
              <Text style={styles.btnGuardarTexto}>
                {guardando ? "Registrando..." : "Registrar operador"}
              </Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 4,
  },
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
  sindicatoVisor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${colors.accent}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
  },
  sindicatoVisorTexto: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "500",
    flex: 1,
  },
  nota: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: `${colors.info}12`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: `${colors.info}25`,
  },
  notaTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnCancelarTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  btnGuardar: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.secondary,
  },
  btnGuardarDisabled: {
    backgroundColor: colors.disabled,
  },
  btnGuardarTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface,
  },
});

export default ModalAgregarOperador;
