// 1. React
import React, { useState, useEffect, useRef } from "react";

// 2. React Native
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

// 5. Hooks y utilidades
import { useOperadoresParaPlacas } from "../../hooks/useOperadoresParaPlacas";
import { useVehiculosParaAsignar } from "../../hooks/useVehiculosParaAsignar";
import { generarQrUid } from "./agregarOperador/validacion";

// 6. Subcomponentes
import PantallaResultadoOperador from "./agregarOperador/PantallaResultadoOperador";

/**
 * ModalAsignarPlacas
 *
 * Asigna a un operador YA registrado un vehiculo (placas) que TAMBIEN ya existe
 * en el sistema. Un solo Modal con pasos internos
 * (seleccionOperador -> buscarVehiculo -> resultado) para no apilar modales
 * (trampa Android, ver componets/CLAUDE.md).
 */
const ModalAsignarPlacas = ({ visible, onClose, onAsignado }) => {
  const isMounted = useRef(true);
  const insets = useSafeAreaInsets();

  const { operadores, loading: loadingOperadores, cargar: cargarOperadores } =
    useOperadoresParaPlacas();
  const { vehiculos, loading: loadingVehiculos, cargar: cargarVehiculos } =
    useVehiculosParaAsignar();

  const [paso, setPaso] = useState("seleccionOperador");
  const [busquedaOperador, setBusquedaOperador] = useState("");
  const [busquedaPlacas, setBusquedaPlacas] = useState("");
  const [operadorSeleccionado, setOperadorSeleccionado] = useState(null);
  const [asignandoId, setAsignandoId] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    cargarOperadores();
    cargarVehiculos();
    setPaso("seleccionOperador");
    setBusquedaOperador("");
    setBusquedaPlacas("");
    setOperadorSeleccionado(null);
    setAsignandoId(null);
    setResultado(null);
  }, [visible, cargarOperadores, cargarVehiculos]);

  const operadoresFiltrados = busquedaOperador.trim()
    ? operadores.filter((op) =>
        op.nombre_completo
          ?.toLowerCase()
          .includes(busquedaOperador.toLowerCase()),
      )
    : operadores;

  // Solo placas del MISMO sindicato que el operador — no se pueden combinar
  // operadores con vehículos de otro sindicato.
  const vehiculosDelSindicato = operadorSeleccionado
    ? vehiculos.filter(
        (v) => v.id_sindicato === operadorSeleccionado.id_sindicato,
      )
    : [];

  const vehiculosFiltrados = busquedaPlacas.trim()
    ? vehiculosDelSindicato.filter((v) =>
        v.placas?.toLowerCase().includes(busquedaPlacas.toLowerCase().trim()),
      )
    : vehiculosDelSindicato;

  const handleSeleccionarOperador = (operador) => {
    setOperadorSeleccionado(operador);
    setBusquedaPlacas("");
    setPaso("buscarVehiculo");
  };

  const handleAsignar = async (vehiculo) => {
    if (!operadorSeleccionado || asignandoId) return;

    try {
      setAsignandoId(vehiculo.id_vehiculo);

      // ── 1. Enlazar el vehiculo al operador (y generar QR si le falta) ───────
      const qrUid = vehiculo.qr_uid || generarQrUid(vehiculo.placas);

      const updatePayload = {
        id_operador_sugerido: operadorSeleccionado.id_operador,
      };
      if (!vehiculo.qr_uid) updatePayload.qr_uid = qrUid;

      const { error: errorUpdate } = await supabase
        .from("vehiculos")
        .update(updatePayload)
        .eq("id_vehiculo", vehiculo.id_vehiculo);

      if (errorUpdate) throw errorUpdate;

      // ── 2. Registrar la rotación: cerrar la asignación abierta previa (se le
      //       quita al operador anterior) y abrir la nueva ─────────────────────
      const hoy = new Date();
      const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

      const { error: errorCierre } = await supabase
        .from("asignacion_operador_vehiculo")
        .update({ fecha_fin: fechaHoy })
        .eq("id_vehiculo", vehiculo.id_vehiculo)
        .is("fecha_fin", null);

      if (errorCierre) {
        console.error(
          "[ModalAsignarPlacas] Error al cerrar asignación previa:",
          errorCierre.message,
        );
      }

      const { error: errorAsignacion } = await supabase
        .from("asignacion_operador_vehiculo")
        .insert({
          id_vehiculo: vehiculo.id_vehiculo,
          id_operador: operadorSeleccionado.id_operador,
          fecha_inicio: fechaHoy,
        });

      if (errorAsignacion) {
        console.error(
          "[ModalAsignarPlacas] Error al crear asignación:",
          errorAsignacion.message,
        );
      }

      if (!isMounted.current) return;

      setResultado({
        operador: operadorSeleccionado,
        vehiculo: {
          id_vehiculo: vehiculo.id_vehiculo,
          placas: vehiculo.placas,
          capacidad_m3: vehiculo.capacidad_m3,
          qr_uid: qrUid,
        },
        mensaje: `La placa "${vehiculo.placas}" fue asignada a ${operadorSeleccionado.nombre_completo} correctamente.`,
      });
      setPaso("resultado");
    } catch (error) {
      console.error("[ModalAsignarPlacas] Error al asignar:", error);
      Alert.alert(
        "Error",
        "No se pudieron asignar las placas. Por favor intenta de nuevo.",
      );
    } finally {
      if (isMounted.current) setAsignandoId(null);
    }
  };

  const tituloHeader =
    paso === "resultado"
      ? "Placas Asignadas"
      : paso === "buscarVehiculo"
        ? "Buscar Placas"
        : "Asignar Placas";

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
        <View
          style={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {paso === "buscarVehiculo" && (
                <TouchableOpacity
                  onPress={() => setPaso("seleccionOperador")}
                  disabled={!!asignandoId}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={26}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              <MaterialCommunityIcons
                name="card-account-details-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.headerTitulo}>{tituloHeader}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={!!asignandoId}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* ── Paso: seleccion de operador ── */}
          {paso === "seleccionOperador" && (
            <>
              <Text style={styles.subtitulo}>
                Elige el operador al que quieres asignarle placas.
              </Text>

              <View style={styles.buscadorWrapper}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.buscador}
                  value={busquedaOperador}
                  onChangeText={setBusquedaOperador}
                  placeholder="Buscar operador..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
                {busquedaOperador.length > 0 && (
                  <TouchableOpacity onPress={() => setBusquedaOperador("")}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {loadingOperadores ? (
                <View style={styles.centrado}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.centradoTexto}>
                    Cargando operadores...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.lista}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {operadoresFiltrados.length === 0 ? (
                    <View style={styles.centrado}>
                      <MaterialCommunityIcons
                        name="account-off-outline"
                        size={40}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.centradoTexto}>
                        No se encontraron operadores
                      </Text>
                    </View>
                  ) : (
                    operadoresFiltrados.map((op) => (
                      <TouchableOpacity
                        key={op.id_operador}
                        style={styles.itemOperador}
                        onPress={() => handleSeleccionarOperador(op)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.itemIcono}>
                          <MaterialCommunityIcons
                            name="account-hard-hat"
                            size={20}
                            color={colors.secondary}
                          />
                        </View>
                        <Text style={styles.itemNombre}>
                          {op.nombre_completo}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}
            </>
          )}

          {/* ── Paso: buscar vehiculo existente ── */}
          {paso === "buscarVehiculo" && operadorSeleccionado && (
            <>
              <View style={styles.operadorVisor}>
                <MaterialCommunityIcons
                  name="account-hard-hat"
                  size={18}
                  color={colors.accent}
                />
                <View style={styles.operadorVisorTextos}>
                  <Text style={styles.operadorVisorTexto}>
                    {operadorSeleccionado.nombre_completo}
                  </Text>
                  <View style={styles.sindicatoChip}>
                    <MaterialCommunityIcons
                      name="shield-account"
                      size={12}
                      color={colors.secondary}
                    />
                    <Text style={styles.sindicatoChipTexto}>
                      {operadorSeleccionado.sindicato}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.subtitulo}>
                Solo se muestran placas del sindicato del operador.
              </Text>

              <View style={styles.buscadorWrapper}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.buscador}
                  value={busquedaPlacas}
                  onChangeText={(v) =>
                    setBusquedaPlacas(v.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
                  }
                  placeholder="Buscar placas..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  maxLength={10}
                />
                {busquedaPlacas.length > 0 && (
                  <TouchableOpacity onPress={() => setBusquedaPlacas("")}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {loadingVehiculos ? (
                <View style={styles.centrado}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.centradoTexto}>
                    Cargando vehículos...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.lista}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {vehiculosFiltrados.length === 0 ? (
                    <View style={styles.centrado}>
                      <MaterialCommunityIcons
                        name="truck-remove-outline"
                        size={40}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.centradoTexto}>
                        {busquedaPlacas.trim()
                          ? "No se encontraron placas"
                          : `No hay placas registradas en ${operadorSeleccionado.sindicato}`}
                      </Text>
                    </View>
                  ) : (
                    vehiculosFiltrados.map((v) => {
                      const asignandoEste = asignandoId === v.id_vehiculo;
                      return (
                        <TouchableOpacity
                          key={v.id_vehiculo}
                          style={styles.itemVehiculo}
                          onPress={() => handleAsignar(v)}
                          disabled={!!asignandoId}
                          activeOpacity={0.75}
                        >
                          <View style={styles.itemIcono}>
                            <MaterialCommunityIcons
                              name="dump-truck"
                              size={20}
                              color={colors.secondary}
                            />
                          </View>

                          <View style={styles.itemVehiculoTextos}>
                            <View style={styles.itemVehiculoFila}>
                              <Text style={styles.itemPlacas}>{v.placas}</Text>
                              {v.capacidad_m3 != null && (
                                <View style={styles.capacidadBadge}>
                                  <Text style={styles.capacidadTexto}>
                                    {v.capacidad_m3} m³
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.itemSindicato}>
                              {v.sindicato}
                            </Text>
                            {v.operadorActual && (
                              <Text
                                style={styles.itemOperadorActual}
                                numberOfLines={1}
                              >
                                Asignado a: {v.operadorActual}
                              </Text>
                            )}
                          </View>

                          {asignandoEste ? (
                            <ActivityIndicator
                              size="small"
                              color={colors.accent}
                            />
                          ) : (
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={20}
                              color={colors.textSecondary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              )}
            </>
          )}

          {/* ── Paso: resultado con QR ── */}
          {paso === "resultado" && resultado && (
            <PantallaResultadoOperador
              operador={resultado.operador}
              vehiculo={resultado.vehiculo}
              mensaje={resultado.mensaje}
              onCerrar={() => {
                onAsignado?.(resultado.operador, resultado.vehiculo);
                onClose?.();
              }}
            />
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
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  buscadorWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 6,
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
    maxHeight: 360,
    paddingHorizontal: 20,
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
  itemVehiculo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  itemVehiculoTextos: {
    flex: 1,
    gap: 3,
  },
  itemVehiculoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemPlacas: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  capacidadBadge: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  capacidadTexto: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  itemSindicato: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "600",
  },
  itemOperadorActual: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
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
  centrado: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  centradoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  operadorVisor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${colors.accent}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
  },
  operadorVisorTextos: {
    flex: 1,
    gap: 4,
  },
  operadorVisorTexto: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: "600",
  },
  sindicatoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sindicatoChipTexto: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: "600",
  },
});

export default ModalAsignarPlacas;
