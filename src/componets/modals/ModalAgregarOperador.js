import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";
import FormInput from "../forms/FormInput";
import SelectorSindicato from "./agregarOperador/SelectorSindicato";
import PantallaResultadoOperador from "./agregarOperador/PantallaResultadoOperador";
import { validarFormulario, generarQrUid } from "./agregarOperador/validacion";

const ESTADO_INICIAL = {
  nombre: "",
  primerApellido: "",
  segundoApellido: "",
  sindicatoId: null,
  placas: "",
  capacidad: "",
};

const ModalAgregarOperador = ({ visible, onClose, onOperadorAgregado }) => {
  const isMounted = useRef(true);
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState(ESTADO_INICIAL);
  const [errores, setErrores] = useState({});
  const [sindicatos, setSindicatos] = useState([]);
  const [loadingSindicatos, setLoadingSindicatos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    cargarSindicatos();
    setForm(ESTADO_INICIAL);
    setErrores({});
    setResultado(null);
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

      // ── 1. Verificar si la placa ya existe ANTES de crear nada ──────────────
      const placas = form.placas.trim().toUpperCase();

      const { data: vehiculoExistente } = await supabase
        .from("vehiculos")
        .select("id_vehiculo, placas")
        .eq("placas", placas)
        .maybeSingle();

      if (vehiculoExistente) {
        setErrores((prev) => ({
          ...prev,
          placas: `La placa "${placas}" ya está registrada en el sistema`,
        }));
        return;
      }

      // ── 2. Verificar si el operador ya existe por nombre ────────────────────
      const nombreCompleto = [
        form.nombre.trim(),
        form.primerApellido.trim(),
        form.segundoApellido.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const { data: operadorExistente } = await supabase
        .from("operadores")
        .select("id_operador, nombre_completo, id_sindicato")
        .ilike("nombre_completo", nombreCompleto)
        .maybeSingle();

      let operadorFinal;
      let operadorEsNuevo = false;

      if (operadorExistente) {
        operadorFinal = operadorExistente;
      } else {
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
        operadorFinal = operadorNuevo;
        operadorEsNuevo = true;
      }

      // ── 3. Crear el vehículo ────────────────────────────────────────────────
      const qrUid = generarQrUid(placas);

      const { data: vehiculoNuevo, error: errorVehiculo } = await supabase
        .from("vehiculos")
        .insert({
          placas,
          capacidad_m3: parseFloat(form.capacidad),
          id_sindicato: form.sindicatoId,
          id_operador_sugerido: operadorFinal.id_operador,
          qr_uid: qrUid,
          activo: true,
        })
        .select("id_vehiculo, placas, capacidad_m3, qr_uid")
        .single();

      if (errorVehiculo) throw errorVehiculo;

      // ── 4. Crear asignación inicial en el historial de rotaciones ───────────
      const hoy = new Date();
      const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

      const { error: errorAsignacion } = await supabase
        .from("asignacion_operador_vehiculo")
        .insert({
          id_vehiculo: vehiculoNuevo.id_vehiculo,
          id_operador: operadorFinal.id_operador,
          fecha_inicio: fechaHoy,
        });

      if (errorAsignacion) {
        console.error(
          "[ModalAgregarOperador] Error al crear asignación inicial:",
          errorAsignacion.message,
        );
      }

      if (!isMounted.current) return;

      const mensaje = operadorEsNuevo
        ? `${operadorFinal.nombre_completo} y su vehículo (${vehiculoNuevo.placas}) fueron agregados correctamente.`
        : `La placa "${vehiculoNuevo.placas}" fue agregada. El operador "${operadorFinal.nombre_completo}" ya existía y no fue duplicado.`;

      setResultado({
        operador: operadorFinal,
        vehiculo: vehiculoNuevo,
        mensaje,
      });
    } catch (error) {
      console.error("[ModalAgregarOperador] Error al guardar:", error);
      Alert.alert(
        "Error",
        "No se pudo registrar el operador. Por favor intenta de nuevo.",
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
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.headerTitulo}>
                {resultado ? "Operador Registrado" : "Nuevo Operador"}
              </Text>
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

          {/* ── Pantalla de resultado ── */}
          {resultado ? (
            <PantallaResultadoOperador
              operador={resultado.operador}
              vehiculo={resultado.vehiculo}
              mensaje={resultado.mensaje}
              onCerrar={() => {
                setResultado(null);
                onOperadorAgregado?.(resultado.operador, resultado.vehiculo);
              }}
            />
          ) : (
            <>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
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
                      handleCampo("placas", v.replace(/[^A-Z0-9-]/g, ""))
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
                    El operador y su vehículo quedarán disponibles de inmediato
                    para crear vales.
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
            </>
          )}
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
