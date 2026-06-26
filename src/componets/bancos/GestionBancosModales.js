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

export function ModalBanco({ visible, banco, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setNombre(banco?.banco ?? "");
      setErrMsg("");
    }
  }, [visible, banco]);

  const handleGuardar = async () => {
    if (!nombre.trim()) { setErrMsg("Ingresa el nombre del banco"); return; }
    setGuardando(true);
    try {
      await onGuardar(nombre.trim());
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
        <View style={estilos.caja}>
          <View style={estilos.header}>
            <Text style={estilos.titulo}>{banco ? "Editar banco" : "Nuevo banco"}</Text>
            <TouchableOpacity onPress={onCerrar}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={estilos.cuerpo}>
            <Text style={estilos.inputLabel}>Nombre del banco</Text>
            <TextInput
              style={[estilos.input, errMsg ? estilos.inputError : null]}
              value={nombre}
              onChangeText={(v) => { setNombre(v); setErrMsg(""); }}
              placeholder="Ej: Banco Tepetate Norte"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoFocus
            />
            {errMsg ? <Text style={estilos.errorTexto}>{errMsg}</Text> : null}
          </View>

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

export function ModalDistancia({ visible, distancia, listaBancos, obras, onGuardar, onCerrar }) {
  const esEdicion = !!distancia;
  const [bancoSelId, setBancoSelId] = useState(null);
  const [obraSelId, setObraSelId] = useState(null);
  const [distKm, setDistKm] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setBancoSelId(distancia?.id_banco ?? null);
      setObraSelId(distancia?.id_obra ?? null);
      setDistKm(distancia ? String(distancia.distancia_km) : "");
      setErrMsg("");
    }
  }, [visible, distancia]);

  const handleGuardar = async () => {
    if (!esEdicion && !bancoSelId) { setErrMsg("Selecciona un banco"); return; }
    if (!esEdicion && !obraSelId) { setErrMsg("Selecciona una obra"); return; }
    const km = parseFloat(distKm);
    if (!distKm.trim() || isNaN(km) || km <= 0) { setErrMsg("Ingresa una distancia valida en km"); return; }
    setGuardando(true);
    try {
      if (esEdicion) {
        await onGuardar(distancia.id_distancia_banco_obra, km);
      } else {
        await onGuardar({ id_banco: bancoSelId, id_obra: obraSelId, distancia_km: km });
      }
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
            <Text style={estilos.titulo}>{esEdicion ? "Editar distancia" : "Nueva distancia"}</Text>
            <TouchableOpacity onPress={onCerrar}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.cuerpo} keyboardShouldPersistTaps="handled">
            {esEdicion ? (
              <View style={estilos.infoRow}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.secondary} />
                <Text style={estilos.infoTexto}>
                  {distancia?.bancos?.banco}{"  →  "}{distancia?.obras?.obra}
                </Text>
              </View>
            ) : (
              <>
                <Text style={estilos.inputLabel}>Banco</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipsScroll}>
                  {listaBancos.map((b) => (
                    <TouchableOpacity
                      key={b.id_banco}
                      style={[estilos.chip, bancoSelId === b.id_banco && estilos.chipActivo]}
                      onPress={() => { setBancoSelId(b.id_banco); setErrMsg(""); }}
                    >
                      <Text style={[estilos.chipTexto, bancoSelId === b.id_banco && estilos.chipTextoActivo]}>
                        {b.banco}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[estilos.inputLabel, { marginTop: 14 }]}>Obra</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipsScroll}>
                  {obras.map((o) => (
                    <TouchableOpacity
                      key={o.id_obra}
                      style={[estilos.chip, obraSelId === o.id_obra && estilos.chipActivo]}
                      onPress={() => { setObraSelId(o.id_obra); setErrMsg(""); }}
                    >
                      <Text style={[estilos.chipTexto, obraSelId === o.id_obra && estilos.chipTextoActivo]}>
                        {o.obra}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={[estilos.inputLabel, { marginTop: esEdicion ? 0 : 14 }]}>Distancia (km)</Text>
            <TextInput
              style={[estilos.input, errMsg ? estilos.inputError : null]}
              value={distKm}
              onChangeText={(v) => { setDistKm(v); setErrMsg(""); }}
              keyboardType="decimal-pad"
              placeholder="Ej: 12.5"
              placeholderTextColor={colors.textSecondary}
            />
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

export function ModalPesoEspecifico({ visible, peso, listaBancos, materiales, onGuardar, onCerrar }) {
  const esEdicion = !!peso;
  const [bancoSelId, setBancoSelId] = useState(null);
  const [materialSelId, setMaterialSelId] = useState(null);
  const [valorPeso, setValorPeso] = useState("1");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setBancoSelId(peso?.id_banco ?? null);
      setMaterialSelId(peso?.id_material ?? null);
      setValorPeso(peso ? String(peso.peso_especifico) : "1");
      setErrMsg("");
    }
  }, [visible, peso]);

  const handleGuardar = async () => {
    if (!esEdicion && !bancoSelId) { setErrMsg("Selecciona un banco"); return; }
    if (!esEdicion && !materialSelId) { setErrMsg("Selecciona un material"); return; }
    const val = parseFloat(valorPeso);
    if (!valorPeso.trim() || isNaN(val) || val <= 0) { setErrMsg("Ingresa un peso valido mayor a 0"); return; }
    setGuardando(true);
    try {
      if (esEdicion) {
        await onGuardar(peso.id_peso_especifico, val);
      } else {
        await onGuardar({ id_banco: bancoSelId, id_material: materialSelId, peso_especifico: val });
      }
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
            <Text style={estilos.titulo}>{esEdicion ? "Editar peso" : "Nuevo peso especifico"}</Text>
            <TouchableOpacity onPress={onCerrar}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.cuerpo} keyboardShouldPersistTaps="handled">
            {esEdicion ? (
              <View style={estilos.infoRow}>
                <MaterialCommunityIcons name="weight-kilogram" size={16} color={colors.secondary} />
                <Text style={estilos.infoTexto}>
                  {peso?.bancos?.banco}{"  ·  "}{peso?.material?.material}
                </Text>
              </View>
            ) : (
              <>
                <Text style={estilos.inputLabel}>Banco</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipsScroll}>
                  {listaBancos.map((b) => (
                    <TouchableOpacity
                      key={b.id_banco}
                      style={[estilos.chip, bancoSelId === b.id_banco && estilos.chipActivo]}
                      onPress={() => { setBancoSelId(b.id_banco); setErrMsg(""); }}
                    >
                      <Text style={[estilos.chipTexto, bancoSelId === b.id_banco && estilos.chipTextoActivo]}>
                        {b.banco}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[estilos.inputLabel, { marginTop: 14 }]}>Material</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipsScroll}>
                  {materiales.map((m) => (
                    <TouchableOpacity
                      key={m.id_material}
                      style={[estilos.chip, materialSelId === m.id_material && estilos.chipActivo]}
                      onPress={() => { setMaterialSelId(m.id_material); setErrMsg(""); }}
                    >
                      <Text style={[estilos.chipTexto, materialSelId === m.id_material && estilos.chipTextoActivo]}>
                        {m.material}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={[estilos.inputLabel, { marginTop: esEdicion ? 0 : 14 }]}>
              Peso especifico (ton/m3)
            </Text>
            <TextInput
              style={[estilos.input, errMsg ? estilos.inputError : null]}
              value={valorPeso}
              onChangeText={(v) => { setValorPeso(v); setErrMsg(""); }}
              keyboardType="decimal-pad"
              placeholder="Ej: 1.85"
              placeholderTextColor={colors.textSecondary}
            />
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
  inputError: {
    borderColor: "#E74C3C",
  },
  errorTexto: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 2,
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
    marginBottom: 16,
  },
  infoTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
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
