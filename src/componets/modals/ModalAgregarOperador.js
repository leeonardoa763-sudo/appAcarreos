// 1. React
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
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 4. Config
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";

// 5. Hooks
import { useOperadoresParaPlacas } from "../../hooks/useOperadoresParaPlacas";
import { useVehiculosParaAsignar } from "../../hooks/useVehiculosParaAsignar";

// 6. Subcomponentes
import ModoSelector from "./agregarOperador/ModoSelector";
import CamposOperador from "./agregarOperador/CamposOperador";
import CamposPlaca from "./agregarOperador/CamposPlaca";
import PantallaResultadoOperador from "./agregarOperador/PantallaResultadoOperador";
import {
  validarModoOperador,
  validarModoPlaca,
  generarQrUid,
} from "./agregarOperador/validacion";

const ESTADO_INICIAL = {
  nombre: "",
  primerApellido: "",
  segundoApellido: "",
  sindicatoId: null,
  placas: "",
  capacidad: "",
};

const fechaLocalHoy = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

const ModalAgregarOperador = ({ visible, onClose, onOperadorAgregado }) => {
  const isMounted = useRef(true);
  const insets = useSafeAreaInsets();

  const { operadores, loading: loadingOperadores, cargar: cargarOperadores } =
    useOperadoresParaPlacas();
  const { vehiculos, loading: loadingVehiculos, cargar: cargarVehiculos } =
    useVehiculosParaAsignar();

  const [modo, setModo] = useState("operador");
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [asignar, setAsignar] = useState(false);
  const [operadorAsignadoId, setOperadorAsignadoId] = useState(null);
  const [vehiculoAsignadoId, setVehiculoAsignadoId] = useState(null);
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
    cargarOperadores();
    cargarVehiculos();
    setModo("operador");
    setForm(ESTADO_INICIAL);
    setAsignar(false);
    setOperadorAsignadoId(null);
    setVehiculoAsignadoId(null);
    setErrores({});
    setResultado(null);
  }, [visible, cargarOperadores, cargarVehiculos]);

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

  const handleCambiarModo = (nuevoModo) => {
    if (nuevoModo === modo) return;
    setModo(nuevoModo);
    setAsignar(false);
    setOperadorAsignadoId(null);
    setVehiculoAsignadoId(null);
    setErrores({});
  };

  const handleCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: null }));
    }
    // Al cambiar de sindicato, la placa/operador elegido (de otro sindicato)
    // deja de ser válido — no se pueden mezclar sindicatos.
    if (campo === "sindicatoId") {
      setOperadorAsignadoId(null);
      setVehiculoAsignadoId(null);
    }
  };

  const handleSelectOperador = (id) => {
    setOperadorAsignadoId(id);
    if (errores.operador) setErrores((prev) => ({ ...prev, operador: null }));
  };

  const handleSelectVehiculo = (id) => {
    setVehiculoAsignadoId(id);
    if (errores.placas) setErrores((prev) => ({ ...prev, placas: null }));
  };

  // ── Crea (o reutiliza) el operador y devuelve su fila ──────────────────────
  const crearOReusarOperador = async () => {
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

    if (operadorExistente) return { operador: operadorExistente, nuevo: false };

    const { data: operadorNuevo, error } = await supabase
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

    if (error) throw error;
    return { operador: operadorNuevo, nuevo: true };
  };

  // ── Crea el vehiculo (validando placa duplicada). Devuelve fila o null si
  //    la placa ya existía (deja el error en el campo) ────────────────────────
  const crearVehiculo = async (idOperador) => {
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
      return null;
    }

    const { data: vehiculoNuevo, error } = await supabase
      .from("vehiculos")
      .insert({
        placas,
        capacidad_m3: parseFloat(form.capacidad),
        id_sindicato: form.sindicatoId,
        id_operador_sugerido: idOperador ?? null,
        qr_uid: generarQrUid(placas),
        activo: true,
      })
      .select("id_vehiculo, placas, capacidad_m3, qr_uid")
      .single();

    if (error) throw error;
    return vehiculoNuevo;
  };

  const registrarAsignacion = async (idVehiculo, idOperador) => {
    const { error } = await supabase
      .from("asignacion_operador_vehiculo")
      .insert({
        id_vehiculo: idVehiculo,
        id_operador: idOperador,
        fecha_inicio: fechaLocalHoy(),
      });

    if (error) {
      console.error(
        "[ModalAgregarOperador] Error al crear asignación:",
        error.message,
      );
    }
  };

  // ── Enlaza una placa YA existente a un operador (genera QR si falta y cierra
  //    la asignación abierta anterior). Devuelve la fila del vehiculo ──────────
  const enlazarVehiculoExistente = async (vehiculo, idOperador) => {
    const qrUid = vehiculo.qr_uid || generarQrUid(vehiculo.placas);

    const updatePayload = { id_operador_sugerido: idOperador };
    if (!vehiculo.qr_uid) updatePayload.qr_uid = qrUid;

    const { error: errorUpdate } = await supabase
      .from("vehiculos")
      .update(updatePayload)
      .eq("id_vehiculo", vehiculo.id_vehiculo);

    if (errorUpdate) throw errorUpdate;

    await supabase
      .from("asignacion_operador_vehiculo")
      .update({ fecha_fin: fechaLocalHoy() })
      .eq("id_vehiculo", vehiculo.id_vehiculo)
      .is("fecha_fin", null);

    await registrarAsignacion(vehiculo.id_vehiculo, idOperador);

    return {
      id_vehiculo: vehiculo.id_vehiculo,
      placas: vehiculo.placas,
      capacidad_m3: vehiculo.capacidad_m3,
      qr_uid: qrUid,
    };
  };

  const guardarModoOperador = async () => {
    const { operador, nuevo } = await crearOReusarOperador();

    if (!asignar) {
      return {
        operador,
        vehiculo: null,
        mensaje: nuevo
          ? `${operador.nombre_completo} fue registrado. Puedes asignarle placas cuando quieras.`
          : `El operador "${operador.nombre_completo}" ya existía; no se duplicó.`,
      };
    }

    const vehiculoSel = vehiculos.find(
      (v) => v.id_vehiculo === vehiculoAsignadoId,
    );
    if (!vehiculoSel) return null;

    const vehiculo = await enlazarVehiculoExistente(
      vehiculoSel,
      operador.id_operador,
    );

    return {
      operador,
      vehiculo,
      mensaje: `La placa "${vehiculo.placas}" fue asignada a ${operador.nombre_completo}.`,
    };
  };

  const guardarModoPlaca = async () => {
    const idOperador = asignar ? operadorAsignadoId : null;

    const vehiculo = await crearVehiculo(idOperador);
    if (!vehiculo) return null; // placa duplicada, error ya mostrado

    let operador = null;
    if (idOperador) {
      await registrarAsignacion(vehiculo.id_vehiculo, idOperador);
      operador =
        operadores.find((op) => op.id_operador === idOperador) ?? null;
    }

    return {
      operador,
      vehiculo,
      mensaje: operador
        ? `La placa "${vehiculo.placas}" fue registrada y asignada a ${operador.nombre_completo}.`
        : `La placa "${vehiculo.placas}" fue registrada sin operador. Puedes asignarle uno cuando quieras.`,
    };
  };

  const handleGuardar = async () => {
    const erroresNuevos =
      modo === "operador"
        ? validarModoOperador(form, asignar, vehiculoAsignadoId)
        : validarModoPlaca(form, asignar, operadorAsignadoId);

    if (Object.keys(erroresNuevos).length > 0) {
      setErrores(erroresNuevos);
      return;
    }

    try {
      setGuardando(true);

      const res =
        modo === "operador"
          ? await guardarModoOperador()
          : await guardarModoPlaca();

      if (!res || !isMounted.current) return;
      setResultado(res);
    } catch (error) {
      console.error("[ModalAgregarOperador] Error al guardar:", error);
      Alert.alert(
        "Error",
        "No se pudo completar el registro. Por favor intenta de nuevo.",
      );
    } finally {
      if (isMounted.current) setGuardando(false);
    }
  };

  const tituloHeader = resultado
    ? "Registro completado"
    : modo === "operador"
      ? "Nuevo Operador"
      : "Nueva Placa";

  const textoBoton =
    modo === "operador" ? "Registrar operador" : "Registrar placa";

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
                name={modo === "operador" ? "account-hard-hat" : "dump-truck"}
                size={24}
                color={colors.primary}
              />
              <Text style={styles.headerTitulo}>{tituloHeader}</Text>
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
              <ModoSelector
                modo={modo}
                onCambiar={handleCambiarModo}
                disabled={guardando}
              />

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {modo === "operador" ? (
                  <CamposOperador
                    form={form}
                    errores={errores}
                    guardando={guardando}
                    onCampo={handleCampo}
                    sindicatos={sindicatos}
                    loadingSindicatos={loadingSindicatos}
                    asignarPlacas={asignar}
                    onToggleAsignar={setAsignar}
                    vehiculos={vehiculos}
                    loadingVehiculos={loadingVehiculos}
                    vehiculoAsignadoId={vehiculoAsignadoId}
                    onSelectVehiculo={handleSelectVehiculo}
                  />
                ) : (
                  <CamposPlaca
                    form={form}
                    errores={errores}
                    guardando={guardando}
                    onCampo={handleCampo}
                    sindicatos={sindicatos}
                    loadingSindicatos={loadingSindicatos}
                    asignarOperador={asignar}
                    onToggleAsignar={setAsignar}
                    operadores={operadores}
                    loadingOperadores={loadingOperadores}
                    operadorAsignadoId={operadorAsignadoId}
                    onSelectOperador={handleSelectOperador}
                  />
                )}
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
                  style={[styles.btnGuardar, guardando && styles.btnGuardarDisabled]}
                  onPress={handleGuardar}
                  disabled={guardando}
                  activeOpacity={0.8}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={colors.surface}
                    />
                  )}
                  <Text style={styles.btnGuardarTexto}>
                    {guardando ? "Registrando..." : textoBoton}
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
