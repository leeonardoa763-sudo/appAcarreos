// src/componets/presupuestos/PresupuestoModales.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const esValorValido = (texto) => {
  const n = parseFloat(String(texto).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0;
};

// ─── Contenedor comun de los modales ─────────────────────────────────────────
const CajaModal = ({ visible, onCerrar, children, estiloCaja }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onCerrar}
  >
    <KeyboardAvoidingView
      style={estilos.overlay}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[estilos.caja, estiloCaja]}>{children}</View>
    </KeyboardAvoidingView>
  </Modal>
);

// ─── Encabezado con icono ────────────────────────────────────────────────────
const EncabezadoModal = ({ icono, titulo, subtitulo }) => (
  <View style={estilos.encabezado}>
    <View style={estilos.encabezadoIcono}>
      <MaterialCommunityIcons name={icono} size={20} color={colors.secondary} />
    </View>
    <View style={estilos.encabezadoTextos}>
      <Text style={estilos.titulo}>{titulo}</Text>
      {!!subtitulo && (
        <Text style={estilos.subtitulo} numberOfLines={2}>
          {subtitulo}
        </Text>
      )}
    </View>
  </View>
);

// ─── Fila de botones Cancelar / Guardar ──────────────────────────────────────
const BotonesModal = ({ onCerrar, onGuardar, guardando, habilitado }) => (
  <View style={estilos.botones}>
    <TouchableOpacity
      style={estilos.botonCancelar}
      onPress={onCerrar}
      disabled={guardando}
      activeOpacity={0.7}
    >
      <Text style={estilos.botonCancelarTexto}>Cancelar</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        estilos.botonConfirmar,
        (guardando || !habilitado) && estilos.disabled,
      ]}
      onPress={onGuardar}
      disabled={guardando || !habilitado}
      activeOpacity={0.8}
    >
      {guardando ? (
        <ActivityIndicator size="small" color={colors.surface} />
      ) : (
        <Text style={estilos.botonConfirmarTexto}>Guardar</Text>
      )}
    </TouchableOpacity>
  </View>
);

// ─── Modal: editar presupuesto de material ────────────────────────────────────
export const ModalEditarMaterial = ({
  visible,
  datos,
  guardando,
  onGuardar,
  onCerrar,
}) => {
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (visible) setValor(datos?.valorActual ?? "");
  }, [visible, datos]);

  return (
    <CajaModal visible={visible} onCerrar={onCerrar}>
      <EncabezadoModal
        icono={datos?.esAsfaltico ? "road-variant" : "cube-outline"}
        titulo={
          datos?.esAsfaltico
            ? "Presupuesto de carpeta asfaltica"
            : "Presupuesto de material"
        }
        subtitulo={datos?.nombre}
      />

      <Text style={estilos.inputLabel}>m3 presupuestados</Text>
      <View style={estilos.inputFila}>
        <TextInput
          style={estilos.input}
          value={valor}
          onChangeText={setValor}
          keyboardType="decimal-pad"
          placeholder="Ej: 5000"
          placeholderTextColor={colors.input.placeholder}
          editable={!guardando}
        />
        <Text style={estilos.inputSufijo}>m3</Text>
      </View>

      <BotonesModal
        onCerrar={onCerrar}
        onGuardar={() => onGuardar(datos?.id_material, valor)}
        guardando={guardando}
        habilitado={!!datos?.id_material && esValorValido(valor)}
      />
    </CajaModal>
  );
};

// ─── Modal: editar presupuesto de renta ──────────────────────────────────────
export const ModalEditarRenta = ({
  visible,
  datos,
  guardando,
  onGuardar,
  onCerrar,
}) => {
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (visible) setValor(datos?.valorActual ?? "");
  }, [visible, datos]);

  return (
    <CajaModal visible={visible} onCerrar={onCerrar}>
      <EncabezadoModal
        icono="excavator"
        titulo="Presupuesto de renta"
        subtitulo="Renta de equipo para la obra"
      />

      <Text style={estilos.inputLabel}>Monto presupuestado</Text>
      <View style={estilos.inputFila}>
        <Text style={estilos.inputPrefijo}>$</Text>
        <TextInput
          style={estilos.input}
          value={valor}
          onChangeText={setValor}
          keyboardType="decimal-pad"
          placeholder="Ej: 150000"
          placeholderTextColor={colors.input.placeholder}
          editable={!guardando}
        />
        <Text style={estilos.inputSufijo}>MXN</Text>
      </View>

      <BotonesModal
        onCerrar={onCerrar}
        onGuardar={() => onGuardar(valor)}
        guardando={guardando}
        habilitado={esValorValido(valor)}
      />
    </CajaModal>
  );
};

// ─── Modal: agregar nuevo material ───────────────────────────────────────────
export const ModalNuevoMaterial = ({
  visible,
  materiales = [],
  guardando,
  onGuardar,
  onCerrar,
}) => {
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [m3, setM3] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [paso, setPaso] = useState("selector");

  useEffect(() => {
    if (visible) {
      setMaterialSeleccionado(null);
      setM3("");
      setBusqueda("");
      setPaso("selector");
    }
  }, [visible]);

  const materialesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return materiales;
    return materiales.filter((m) =>
      String(m.material ?? "").toLowerCase().includes(q)
    );
  }, [materiales, busqueda]);

  const handleSeleccionarMaterial = (mat) => {
    setMaterialSeleccionado(mat);
    setPaso("monto");
  };

  return (
    <CajaModal
      visible={visible}
      onCerrar={onCerrar}
      estiloCaja={paso === "selector" ? { maxHeight: "80%" } : null}
    >
      {paso === "selector" ? (
        <>
          <EncabezadoModal
            icono="playlist-plus"
            titulo="Seleccionar material"
            subtitulo="Elige el material a presupuestar"
          />

          {materiales.length > 0 && (
            <View style={estilos.buscador}>
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color={colors.textSecondary}
              />
              <TextInput
                style={estilos.buscadorInput}
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar material..."
                placeholderTextColor={colors.input.placeholder}
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
          )}

          {materiales.length === 0 ? (
            <Text style={estilos.textoVacio}>
              Todos los materiales ya tienen presupuesto configurado.
            </Text>
          ) : (
            <FlatList
              data={materialesFiltrados}
              keyExtractor={(m) => String(m.id_material)}
              style={estilos.lista}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const esAsfaltico = item.id_tipo_de_material === 2;
                return (
                  <TouchableOpacity
                    style={estilos.itemMaterial}
                    onPress={() => handleSeleccionarMaterial(item)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={esAsfaltico ? "road-variant" : "cube-outline"}
                      size={18}
                      color={esAsfaltico ? colors.primary : colors.secondary}
                    />
                    <Text style={estilos.itemMaterialTexto} numberOfLines={1}>
                      {item.material}
                    </Text>
                    {esAsfaltico && (
                      <View style={estilos.itemEtiqueta}>
                        <Text style={estilos.itemEtiquetaTexto}>Asfaltico</Text>
                      </View>
                    )}
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={estilos.separador} />}
              ListEmptyComponent={
                <Text style={estilos.textoVacio}>
                  Sin resultados para la busqueda.
                </Text>
              }
            />
          )}

          <TouchableOpacity
            style={[estilos.botonCancelar, { marginTop: 12 }]}
            onPress={onCerrar}
            activeOpacity={0.7}
          >
            <Text style={estilos.botonCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={estilos.volverBtn}
            onPress={() => setPaso("selector")}
            disabled={guardando}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={colors.secondary}
            />
            <Text style={estilos.volverBtnTexto}>Cambiar material</Text>
          </TouchableOpacity>

          <EncabezadoModal
            icono={
              materialSeleccionado?.id_tipo_de_material === 2
                ? "road-variant"
                : "cube-outline"
            }
            titulo="Nuevo presupuesto"
            subtitulo={materialSeleccionado?.material}
          />

          <Text style={estilos.inputLabel}>m3 presupuestados</Text>
          <View style={estilos.inputFila}>
            <TextInput
              style={estilos.input}
              value={m3}
              onChangeText={setM3}
              keyboardType="decimal-pad"
              placeholder="Ej: 5000"
              placeholderTextColor={colors.input.placeholder}
              editable={!guardando}
            />
            <Text style={estilos.inputSufijo}>m3</Text>
          </View>

          <BotonesModal
            onCerrar={onCerrar}
            onGuardar={() =>
              onGuardar(materialSeleccionado?.id_material, m3)
            }
            guardando={guardando}
            habilitado={
              !!materialSeleccionado?.id_material && esValorValido(m3)
            }
          />
        </>
      )}
    </CajaModal>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  caja: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },

  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  encabezadoIcono: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  encabezadoTextos: {
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
  },
  inputFila: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.input.background,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 16,
    fontWeight: "600",
    color: colors.input.text,
  },
  inputPrefijo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
    marginRight: 4,
  },
  inputSufijo: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: 6,
  },

  botones: {
    flexDirection: "row",
    gap: 10,
  },
  botonCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  botonCancelarTexto: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  botonConfirmar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: "center",
  },
  botonConfirmarTexto: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.45,
  },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 8,
  },
  buscadorInput: {
    flex: 1,
    fontSize: 14,
    color: colors.input.text,
    padding: 0,
  },
  lista: {
    flexGrow: 0,
    maxHeight: 300,
  },
  itemMaterial: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  itemMaterialTexto: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  itemEtiqueta: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: `${colors.primary}1A`,
  },
  itemEtiquetaTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  separador: {
    height: 1,
    backgroundColor: colors.background,
  },
  textoVacio: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
  volverBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  volverBtnTexto: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
