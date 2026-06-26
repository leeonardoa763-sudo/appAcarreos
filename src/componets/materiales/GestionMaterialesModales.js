import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

// ─── Modal para crear / editar un material ────────────────────────────────────

export function ModalMaterial({ visible, material, tipos, onGuardar, onCerrar }) {
  const esEdicion = !!material;

  const [nombre, setNombre] = useState("");
  const [idTipo, setIdTipo] = useState(null);
  const [esDescarga, setEsDescarga] = useState(false);
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorNombre, setErrorNombre] = useState("");

  useEffect(() => {
    if (visible) {
      setNombre(material?.material ?? "");
      setIdTipo(material?.id_tipo_de_material ?? (tipos[0]?.id_tipo_de_material ?? null));
      setEsDescarga(material?.es_material_descarga ?? false);
      setActivo(material?.activo ?? true);
      setErrorNombre("");
    }
  }, [visible, material, tipos]);

  const handleGuardar = async () => {
    const nombreTrimmed = nombre.trim();
    if (!nombreTrimmed) {
      setErrorNombre("El nombre es obligatorio");
      return;
    }
    if (!idTipo) {
      setErrorNombre("Selecciona un tipo de material");
      return;
    }
    setErrorNombre("");
    setGuardando(true);
    try {
      await onGuardar({
        material: nombreTrimmed,
        id_tipo_de_material: idTipo,
        es_material_descarga: esDescarga,
        activo,
      });
      onCerrar();
    } catch (err) {
      setErrorNombre("Error al guardar: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={estilos.overlay}>
        <View style={estilos.contenedor}>
          <View style={estilos.header}>
            <Text style={estilos.titulo}>
              {esEdicion ? "Editar material" : "Nuevo material"}
            </Text>
            <TouchableOpacity onPress={onCerrar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.cuerpo} showsVerticalScrollIndicator={false}>
            {/* Nombre */}
            <Text style={estilos.label}>Nombre del material</Text>
            <TextInput
              style={[estilos.input, errorNombre ? estilos.inputError : null]}
              value={nombre}
              onChangeText={(t) => { setNombre(t); setErrorNombre(""); }}
              placeholder="Ej. Arena, Grava, Base Asfáltica..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
            {!!errorNombre && <Text style={estilos.textoError}>{errorNombre}</Text>}

            {/* Tipo */}
            <Text style={[estilos.label, { marginTop: 14 }]}>Tipo de material</Text>
            <View style={estilos.chipRow}>
              {tipos.map((t) => {
                const seleccionado = t.id_tipo_de_material === idTipo;
                return (
                  <TouchableOpacity
                    key={t.id_tipo_de_material}
                    style={[estilos.chip, seleccionado && estilos.chipActivo]}
                    onPress={() => setIdTipo(t.id_tipo_de_material)}
                  >
                    <Text style={[estilos.chipTexto, seleccionado && estilos.chipTextoActivo]}>
                      {t.tipo_de_material}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* es_material_descarga */}
            <View style={estilos.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.switchLabel}>Permite ticket de descarga</Text>
                <Text style={estilos.switchDesc}>Activa el flujo de descarga en vales de renta</Text>
              </View>
              <Switch
                value={esDescarga}
                onValueChange={setEsDescarga}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>

            {/* activo — solo en edición */}
            {esEdicion && (
              <View style={[estilos.switchRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.switchLabel}>Material activo</Text>
                  <Text style={estilos.switchDesc}>Desactivar oculta este material en los formularios</Text>
                </View>
                <Switch
                  value={activo}
                  onValueChange={setActivo}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                />
              </View>
            )}
          </ScrollView>

          <View style={estilos.pie}>
            <TouchableOpacity style={estilos.btnCancelar} onPress={onCerrar}>
              <Text style={estilos.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.btnGuardar, guardando && { opacity: 0.6 }]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator size="small" color={colors.surface} />
                : <Text style={estilos.btnGuardarTexto}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal para crear / editar un tipo de material ────────────────────────────

export function ModalTipo({ visible, tipo, onGuardar, onCerrar }) {
  const esEdicion = !!tipo;

  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorNombre, setErrorNombre] = useState("");

  useEffect(() => {
    if (visible) {
      setNombre(tipo?.tipo_de_material ?? "");
      setErrorNombre("");
    }
  }, [visible, tipo]);

  const handleGuardar = async () => {
    const nombreTrimmed = nombre.trim();
    if (!nombreTrimmed) {
      setErrorNombre("El nombre es obligatorio");
      return;
    }
    setErrorNombre("");
    setGuardando(true);
    try {
      await onGuardar({ tipo_de_material: nombreTrimmed });
      onCerrar();
    } catch (err) {
      setErrorNombre("Error al guardar: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={estilos.overlay}>
        <View style={[estilos.contenedor, { maxHeight: 260 }]}>
          <View style={estilos.header}>
            <Text style={estilos.titulo}>
              {esEdicion ? "Editar tipo" : "Nuevo tipo de material"}
            </Text>
            <TouchableOpacity onPress={onCerrar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={estilos.cuerpo}>
            <Text style={estilos.label}>Nombre del tipo</Text>
            <TextInput
              style={[estilos.input, errorNombre ? estilos.inputError : null]}
              value={nombre}
              onChangeText={(t) => { setNombre(t); setErrorNombre(""); }}
              placeholder="Ej. Material Asfáltico, Agregado..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
            {!!errorNombre && <Text style={estilos.textoError}>{errorNombre}</Text>}
          </View>

          <View style={estilos.pie}>
            <TouchableOpacity style={estilos.btnCancelar} onPress={onCerrar}>
              <Text style={estilos.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.btnGuardar, guardando && { opacity: 0.6 }]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator size="small" color={colors.surface} />
                : <Text style={estilos.btnGuardarTexto}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  contenedor: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cuerpo: {
    padding: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: "#E74C3C",
  },
  textoError: {
    color: "#E74C3C",
    fontSize: 12,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActivo: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary,
  },
  chipTexto: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipTextoActivo: {
    color: colors.surface,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  switchDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pie: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  btnCancelarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  btnGuardar: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  btnGuardarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});
