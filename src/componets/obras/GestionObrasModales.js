import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

// Android no ofrece "numbers-and-punctuation"; con "numeric" al menos evita
// el teclado completo y sigue permitiendo el signo negativo y el punto.
const TECLADO_DECIMAL =
  Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric";

const esEnteroValido = (texto) => /^\d+$/.test(texto.trim());

export function ModalObra({
  visible,
  obra,
  obras = [],
  empresas,
  onGuardar,
  onCerrar,
}) {
  const esEdicion = !!obra;

  const [nombre, setNombre] = useState("");
  const [cc, setCc] = useState("");
  const [empresaSelId, setEmpresaSelId] = useState(null);
  const [radioValidacion, setRadioValidacion] = useState("");
  const [minMinutos, setMinMinutos] = useState("");
  const [velocidadKmh, setVelocidadKmh] = useState("");
  const [minutosCargaDescarga, setMinutosCargaDescarga] = useState("");
  const [factorTolerancia, setFactorTolerancia] = useState("");
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
      setVelocidadKmh(
        obra?.velocidad_promedio_kmh != null
          ? String(obra.velocidad_promedio_kmh)
          : "",
      );
      setMinutosCargaDescarga(
        obra?.minutos_carga_descarga != null
          ? String(obra.minutos_carga_descarga)
          : "",
      );
      setFactorTolerancia(
        obra?.factor_tolerancia_tiempo != null
          ? String(obra.factor_tolerancia_tiempo)
          : "",
      );
      setLatitud(obra?.latitud != null ? String(obra.latitud) : "");
      setLongitud(obra?.longitud != null ? String(obra.longitud) : "");
      setErrMsg("");
      setGuardando(false);
    }
  }, [visible, obra]);

  const limpiarError = (setter) => (valor) => {
    setter(valor);
    setErrMsg("");
  };

  const validar = () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return "Ingresa el nombre de la obra";

    const duplicada = obras.some(
      (o) =>
        o.id_obra !== obra?.id_obra &&
        String(o.obra ?? "").trim().toLowerCase() ===
          nombreLimpio.toLowerCase(),
    );
    if (duplicada) return `Ya existe una obra llamada "${nombreLimpio}"`;

    if (cc.trim()) {
      if (!esEnteroValido(cc)) return "El centro de costo debe ser un numero entero";
      const ccNum = parseInt(cc, 10);
      const ccRepetido = obras.some(
        (o) => o.id_obra !== obra?.id_obra && o.cc === ccNum,
      );
      if (ccRepetido)
        return `El centro de costo ${ccNum} ya lo usa otra obra. Los folios se generan con el CC.`;
    }

    if (radioValidacion.trim()) {
      if (!esEnteroValido(radioValidacion))
        return "El radio debe ser un numero entero de metros";
      if (parseInt(radioValidacion, 10) <= 0)
        return "El radio debe ser mayor a 0 metros";
    }

    if (minMinutos.trim() && !esEnteroValido(minMinutos))
      return "Los minutos minimos deben ser un numero entero";

    if (velocidadKmh.trim()) {
      const kmh = parseFloat(velocidadKmh);
      if (Number.isNaN(kmh) || kmh <= 0)
        return "La velocidad promedio debe ser mayor a 0";
    }

    if (minutosCargaDescarga.trim() && !esEnteroValido(minutosCargaDescarga))
      return "Los minutos de carga y descarga deben ser un numero entero";

    if (factorTolerancia.trim()) {
      const factor = parseFloat(factorTolerancia);
      if (Number.isNaN(factor) || factor <= 0 || factor > 1)
        return "La tolerancia debe estar entre 0 y 1 (ej: 0.8)";
    }

    const tieneLat = !!latitud.trim();
    const tieneLon = !!longitud.trim();
    if (tieneLat !== tieneLon)
      return "Captura latitud y longitud, o deja ambas vacias";

    if (tieneLat) {
      const lat = parseFloat(latitud);
      const lon = parseFloat(longitud);
      if (Number.isNaN(lat) || lat < -90 || lat > 90)
        return "La latitud debe estar entre -90 y 90";
      if (Number.isNaN(lon) || lon < -180 || lon > 180)
        return "La longitud debe estar entre -180 y 180";
    }

    return null;
  };

  const handleGuardar = async () => {
    const problema = validar();
    if (problema) {
      setErrMsg(problema);
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
      velocidad_promedio_kmh: velocidadKmh.trim()
        ? parseFloat(velocidadKmh)
        : null,
      minutos_carga_descarga: minutosCargaDescarga.trim()
        ? parseInt(minutosCargaDescarga, 10)
        : null,
      factor_tolerancia_tiempo: factorTolerancia.trim()
        ? parseFloat(factorTolerancia)
        : null,
      latitud: latitud.trim() ? parseFloat(latitud) : null,
      longitud: longitud.trim() ? parseFloat(longitud) : null,
    };

    setGuardando(true);
    try {
      await onGuardar(datos);
      onCerrar();
    } catch (e) {
      console.error("[ModalObra] Error al guardar:", e);
      setErrMsg(e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const faltanDatosFolio = !cc.trim() || !empresaSelId;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.overlay}>
        <View style={estilos.caja}>
          <View style={estilos.header}>
            <MaterialCommunityIcons
              name="office-building-marker-outline"
              size={20}
              color={colors.secondary}
            />
            <Text style={estilos.titulo}>
              {esEdicion ? "Editar obra" : "Nueva obra"}
            </Text>
            <TouchableOpacity
              onPress={onCerrar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.cuerpo} keyboardShouldPersistTaps="handled">
            {esEdicion && (
              <View style={estilos.infoRow}>
                <MaterialCommunityIcons name="pound" size={16} color={colors.secondary} />
                <Text style={estilos.infoTexto}>ID de obra: {obra?.id_obra}</Text>
                <View
                  style={[
                    estilos.estadoPill,
                    obra?.activo ? estilos.estadoActiva : estilos.estadoInactiva,
                  ]}
                >
                  <Text
                    style={[
                      estilos.estadoTexto,
                      { color: obra?.activo ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    {obra?.activo ? "Activa" : "Inactiva"}
                  </Text>
                </View>
              </View>
            )}

            <Text style={estilos.inputLabel}>Nombre de la obra</Text>
            <TextInput
              style={estilos.input}
              value={nombre}
              onChangeText={limpiarError(setNombre)}
              placeholder="Ej: Fraccionamiento Los Pinos"
              placeholderTextColor={colors.textSecondary}
              autoFocus={!esEdicion}
            />

            <Text style={[estilos.inputLabel, { marginTop: 14 }]}>
              Centro de costo (CC)
            </Text>
            <TextInput
              style={estilos.input}
              value={cc}
              onChangeText={limpiarError(setCc)}
              placeholder="Ej: 1200"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={[estilos.inputLabel, { marginTop: 14 }]}>Empresa</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={estilos.chipsScroll}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                style={[estilos.chip, empresaSelId == null && estilos.chipActivo]}
                onPress={() => { setEmpresaSelId(null); setErrMsg(""); }}
              >
                <Text
                  style={[
                    estilos.chipTexto,
                    empresaSelId == null && estilos.chipTextoActivo,
                  ]}
                >
                  Sin empresa
                </Text>
              </TouchableOpacity>
              {empresas.map((e) => (
                <TouchableOpacity
                  key={e.id_empresa}
                  style={[estilos.chip, empresaSelId === e.id_empresa && estilos.chipActivo]}
                  onPress={() => { setEmpresaSelId(e.id_empresa); setErrMsg(""); }}
                >
                  <Text
                    style={[
                      estilos.chipTexto,
                      empresaSelId === e.id_empresa && estilos.chipTextoActivo,
                    ]}
                  >
                    {e.sufijo ? `${e.empresa} (${e.sufijo})` : e.empresa}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {faltanDatosFolio && (
              <View style={estilos.avisoRow}>
                <MaterialCommunityIcons
                  name="alert-outline"
                  size={16}
                  color={colors.warning}
                />
                <Text style={estilos.avisoTexto}>
                  Sin CC y empresa no se pueden generar folios de vales para esta obra.
                </Text>
              </View>
            )}

            <Text style={[estilos.inputLabel, { marginTop: 14 }]}>
              Radio de validacion GPS (metros)
            </Text>
            <TextInput
              style={estilos.input}
              value={radioValidacion}
              onChangeText={limpiarError(setRadioValidacion)}
              placeholder="500"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
            <Text style={estilos.ayudaTexto}>
              Distancia maxima desde el centro de la obra para registrar un viaje.
            </Text>

            <Text style={[estilos.inputLabel, { marginTop: 14 }]}>
              Minutos minimos entre viajes
            </Text>
            <TextInput
              style={estilos.input}
              value={minMinutos}
              onChangeText={limpiarError(setMinMinutos)}
              placeholder="20"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
            <Text style={estilos.ayudaTexto}>
              Solo se usa cuando el vale no tiene distancia al banco. En vales de
              material el tiempo se calcula por distancia (ver abajo).
            </Text>

            <Text style={[estilos.inputLabel, { marginTop: 14 }]}>
              Velocidad promedio del camion (km/h)
            </Text>
            <TextInput
              style={estilos.input}
              value={velocidadKmh}
              onChangeText={limpiarError(setVelocidadKmh)}
              placeholder="30"
              placeholderTextColor={colors.textSecondary}
              keyboardType={TECLADO_DECIMAL}
            />

            <View style={estilos.filaDoble}>
              <View style={estilos.mitad}>
                <Text style={estilos.inputLabel}>Carga y descarga (min)</Text>
                <TextInput
                  style={estilos.input}
                  value={minutosCargaDescarga}
                  onChangeText={limpiarError(setMinutosCargaDescarga)}
                  placeholder="19"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                />
              </View>
              <View style={estilos.mitad}>
                <Text style={estilos.inputLabel}>Tolerancia (0 a 1)</Text>
                <TextInput
                  style={estilos.input}
                  value={factorTolerancia}
                  onChangeText={limpiarError(setFactorTolerancia)}
                  placeholder="0.55"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType={TECLADO_DECIMAL}
                />
              </View>
            </View>
            <Text style={estilos.ayudaTexto}>
              Tiempo minimo = (distancia ida y vuelta / velocidad + carga y
              descarga) x tolerancia. Si el historial del banco muestra que es
              aun mas lento, se usa ese valor mayor.
            </Text>

            <View style={estilos.filaDoble}>
              <View style={estilos.mitad}>
                <Text style={estilos.inputLabel}>Latitud</Text>
                <TextInput
                  style={estilos.input}
                  value={latitud}
                  onChangeText={limpiarError(setLatitud)}
                  placeholder="Ej: 20.6736"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType={TECLADO_DECIMAL}
                />
              </View>
              <View style={estilos.mitad}>
                <Text style={estilos.inputLabel}>Longitud</Text>
                <TextInput
                  style={estilos.input}
                  value={longitud}
                  onChangeText={limpiarError(setLongitud)}
                  placeholder="Ej: -103.344"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType={TECLADO_DECIMAL}
                />
              </View>
            </View>

            {errMsg ? (
              <View style={estilos.errorRow}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.danger}
                />
                <Text style={estilos.errorTexto}>{errMsg}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={estilos.pie}>
            <TouchableOpacity
              style={estilos.btnCancelar}
              onPress={onCerrar}
              disabled={guardando}
            >
              <Text style={estilos.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.btnGuardar, guardando && estilos.btnGuardarInactivo]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={estilos.btnGuardarTexto}>Guardar</Text>
              )}
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
    maxWidth: 560,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titulo: {
    flex: 1,
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
  },
  ayudaTexto: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 5,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  errorTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
  },
  avisoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FDF3E3",
    borderWidth: 1,
    borderColor: colors.warning,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 11,
    color: colors.textPrimary,
  },
  chipsScroll: {
    marginBottom: 2,
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
    marginBottom: 14,
  },
  infoTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  estadoPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  estadoActiva: {
    borderColor: colors.accent,
    backgroundColor: "#EAF6F1",
  },
  estadoInactiva: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  estadoTexto: {
    fontSize: 11,
    fontWeight: "700",
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
  btnGuardarInactivo: {
    opacity: 0.7,
  },
  btnGuardarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});
