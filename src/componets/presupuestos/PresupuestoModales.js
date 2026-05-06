// src/componets/presupuestos/PresupuestoModales.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

// ─── Modal: editar presupuesto de material ────────────────────────────────────
export const ModalEditarMaterial = ({ visible, datos, guardando, onGuardar, onCerrar }) => {
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (visible) setValor(datos?.valorActual ?? "");
  }, [visible, datos]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.overlay}>
        <View style={estilos.caja}>
          <Text style={estilos.titulo}>Presupuesto de material</Text>
          <Text style={estilos.subtitulo}>{datos?.nombre}</Text>

          <Text style={estilos.inputLabel}>m3 presupuestados</Text>
          <TextInput
            style={estilos.input}
            value={valor}
            onChangeText={setValor}
            keyboardType="decimal-pad"
            placeholder="Ej: 5000"
            placeholderTextColor={colors.input.placeholder}
            autoFocus
          />

          <View style={estilos.botones}>
            <TouchableOpacity style={estilos.botonCancelar} onPress={onCerrar}>
              <Text style={estilos.botonCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botonConfirmar, guardando && estilos.disabled]}
              onPress={() => onGuardar(datos?.id_material, valor)}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={estilos.botonConfirmarTexto}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Modal: editar presupuesto de renta ──────────────────────────────────────
export const ModalEditarRenta = ({ visible, datos, guardando, onGuardar, onCerrar }) => {
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (visible) setValor(datos?.valorActual ?? "");
  }, [visible, datos]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.overlay}>
        <View style={estilos.caja}>
          <Text style={estilos.titulo}>Presupuesto de renta</Text>

          <Text style={estilos.inputLabel}>Monto presupuestado (MXN)</Text>
          <TextInput
            style={estilos.input}
            value={valor}
            onChangeText={setValor}
            keyboardType="decimal-pad"
            placeholder="Ej: 150000"
            placeholderTextColor={colors.input.placeholder}
            autoFocus
          />

          <View style={estilos.botones}>
            <TouchableOpacity style={estilos.botonCancelar} onPress={onCerrar}>
              <Text style={estilos.botonCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botonConfirmar, guardando && estilos.disabled]}
              onPress={() => onGuardar(valor)}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={estilos.botonConfirmarTexto}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Modal: agregar nuevo material ───────────────────────────────────────────
export const ModalNuevoMaterial = ({ visible, materiales, guardando, onGuardar, onCerrar }) => {
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [m3, setM3] = useState("");
  const [paso, setPaso] = useState("selector");

  useEffect(() => {
    if (visible) {
      setMaterialSeleccionado(null);
      setM3("");
      setPaso("selector");
    }
  }, [visible]);

  const handleSeleccionarMaterial = (mat) => {
    setMaterialSeleccionado(mat);
    setPaso("monto");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.overlay}>
        <View style={[estilos.caja, { maxHeight: "80%" }]}>
          {paso === "selector" ? (
            <>
              <Text style={estilos.titulo}>Seleccionar material</Text>
              {materiales.length === 0 ? (
                <Text style={estilos.textoVacio}>
                  Todos los materiales ya tienen presupuesto configurado.
                </Text>
              ) : (
                <FlatList
                  data={materiales}
                  keyExtractor={(m) => String(m.id_material)}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={estilos.itemMaterial}
                      onPress={() => handleSeleccionarMaterial(item)}
                    >
                      <MaterialCommunityIcons
                        name="cube-outline"
                        size={18}
                        color={colors.secondary}
                      />
                      <Text style={estilos.itemMaterialTexto}>
                        {item.material}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={estilos.separador} />
                  )}
                />
              )}
              <TouchableOpacity
                style={[estilos.botonCancelar, { marginTop: 12 }]}
                onPress={onCerrar}
              >
                <Text style={estilos.botonCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={estilos.volverBtn}
                onPress={() => setPaso("selector")}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={18}
                  color={colors.secondary}
                />
                <Text style={estilos.volverBtnTexto}>Cambiar material</Text>
              </TouchableOpacity>

              <Text style={estilos.titulo}>Nuevo presupuesto</Text>
              <Text style={estilos.subtitulo}>
                {materialSeleccionado?.material}
              </Text>

              <Text style={estilos.inputLabel}>m3 presupuestados</Text>
              <TextInput
                style={estilos.input}
                value={m3}
                onChangeText={setM3}
                keyboardType="decimal-pad"
                placeholder="Ej: 5000"
                placeholderTextColor={colors.input.placeholder}
                autoFocus
              />

              <View style={estilos.botones}>
                <TouchableOpacity
                  style={estilos.botonCancelar}
                  onPress={onCerrar}
                >
                  <Text style={estilos.botonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[estilos.botonConfirmar, guardando && estilos.disabled]}
                  onPress={() => onGuardar(materialSeleccionado.id_material, m3)}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <Text style={estilos.botonConfirmarTexto}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
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
    borderRadius: 14,
    padding: 20,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.input.text,
    backgroundColor: colors.input.background,
    marginBottom: 16,
  },
  botones: {
    flexDirection: "row",
    gap: 10,
  },
  botonCancelar: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
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
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: "center",
  },
  botonConfirmarTexto: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
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
    marginBottom: 14,
  },
  volverBtnTexto: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
