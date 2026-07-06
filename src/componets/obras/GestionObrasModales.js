import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

export function ModalObra({ visible, obra, empresas, onGuardar, onCerrar }) {
  const esEdicion = !!obra;

  const [nombre, setNombre] = useState("");
  const [cc, setCc] = useState("");
  const [empresaSelId, setEmpresaSelId] = useState(null);
  const [radioValidacion, setRadioValidacion] = useState("");
  const [minMinutos, setMinMinutos] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setNombre(obra?.obra ?? "");
      setCc(obra?.cc != null ? String(obra.cc) : "");
      setEmpresaSelId(obra?.id_empresa ?? null);
      setRadioValidacion(
        obra?.radio_validacion_metros != null
          ? String(obra.radio_validacion_metros)
          : "",
      );
      setMinMinutos(
        obra?.min_minutos_entre_viajes != null
          ? String(obra.min_minutos_entre_viajes)
          : "",
      );
      setLatitud(obra?.latitud != null ? String(obra.latitud) : "");
      setLongitud(obra?.longitud != null ? String(obra.longitud) : "");
      setErrMsg("");
    }
  }, [visible, obra]);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setErrMsg("Ingresa el nombre de la obra");
      return;
    }

    const datos = {
      obra: nombre.trim(),
      cc: cc.trim() ? parseInt(cc, 10) : null,
      id_empresa: empresaSelId,
      radio_validacion_metros: radioValidacion.trim()
        ? parseInt(radioValidacion, 10)
        : null,
      min_minutos_entre_viajes: minMinutos.trim()
        ? parseInt(minMinutos, 10)
        : null,
      latitud: latitud.trim() ? parseFloat(latitud) : null,
      longitud: longitud.trim() ? parseFloat(longitud) : null,
    };

    setGuardando(true);
    try {
      await onGuardar(datos);
      onCerrar();
    } catch (e) {
      setErrMsg(e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.overlay}>
        <View style={[estilos.caja, { maxHeight: "88%" }]}>
          <View style={estilos.header}>
            <Text style={estilos.titulo}>{esEdicion ? "Editar obra" : "Nueva obra"}</Text>
            <TouchableOpacity onPress={onCerrar}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.cuerpo} keyboardShouldPersistTaps="handled">
            {esEdicion && (
              <View style={estilos.infoRow}>
                <MaterialCommunityIcons name="pound" size={16} color={colors.secondary} />
                <Text style={estilos.infoTexto}>ID de obra: {obra?.id_obra}</Text>
              </View>
            )}

            <Text style={estilos.inputLabel}>Nombre de la obra</Text>
            <TextInput
              style={estilos.input}
              value={nombre}
              onChangeText={(v) => { setNombre(v); setErrMsg(""); }}
              placeholder="Ej: Fraccionamiento Los Pinos"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />

            <Text style={[estilos.inputLabel, { marginTop: 14 }]}>Centro de costo (CC)</Text>
            <TextInput
              style={estilos.input}
              value={cc}
              onChangeText={setCc}
              placeholder="Ej: 1200"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={[estilos.inputLabel, { marginTop: 14 }]}>Empresa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipsScroll}>
              {empresas.map((e) => (
                <TouchableOpacity
                  key={e.id_empresa}
                  style={[estilos.chip, empresaSelId === e.id_empresa && estilos.chipActivo]}
                  onPress={() => setEmpresaSelId(e.id_empresa)}
                >
                  <Text style={[estilos.chipTexto, empresaSelId === e.id_empresa && estilos.chipTextoActivo]}>
                    {e.empresa}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[estilos.inputLabel, { marginTop: 14 }]}>Radio de validacion GPS (metros)</Text>
            <TextInput
              style={estilos.input}
              value={radioValidacion}
              onChangeText={setRadioValidacion}
              placeholder="500"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={[estilos.inputLabel, { marginTop: 14 }]}>Minutos minimos entre viajes</Text>
            <TextInput
              style={estilos.input}
              value={minMinutos}
              onChangeText={setMinMinutos}
              placeholder="20"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />

            <View style={estilos.filaDoble}>
              <View style={estilos.mitad}>
                <Text style={estilos.inputLabel}>Latitud</Text>
                <TextInput
                  style={estilos.input}
                  value={latitud}
                  onChangeText={setLatitud}
                  placeholder="Ej: 20.6736"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={estilos.mitad}>
                <Text style={estilos.inputLabel}>Longitud</Text>
                <TextInput
                  style={estilos.input}
                  value={longitud}
                  onChangeText={setLongitud}
                  placeholder="Ej: -103.344"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {errMsg ? <Text style={estilos.errorTexto}>{errMsg}</Text> : null}
          </ScrollView>

          <View style={estilos.pie}>
            <TouchableOpacity style={estilos.btnCancelar} onPress={onCerrar}>
              <Text style={estilos.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnGuardar} onPress={handleGuardar} disabled={guardando}>
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

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  caja: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "75%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cuerpo: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  errorTexto: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 8,
    marginBottom: 4,
  },
  chipsScroll: {
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: 8,
  },
  chipActivo: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextoActivo: {
    color: colors.surface,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  infoTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  filaDoble: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  mitad: {
    flex: 1,
  },
  pie: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
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
