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
  Image,
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
// 5. Local - Componentes
import FormInput from "../forms/FormInput";
import QRCodeGenerator from "../common/QRCodeGenerator";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

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

// ─── Generador de qr_uid ──────────────────────────────────────────────────────

const generarQrUid = (placas) => {
  const placasLimpias = placas.replace(/[^A-Z0-9]/g, "");
  const timestamp = Date.now().toString(36).toUpperCase();
  return `VH-${placasLimpias}-${timestamp}`;
};

// ─── PantallaResultado ────────────────────────────────────────────────────────

const PantallaResultado = ({ operador, vehiculo, mensaje, onCerrar }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const handleExportarPDF = async () => {
    if (!qrDataUrl) {
      Alert.alert("Espera", "El código QR aún se está generando.");
      return;
    }

    try {
      setGenerandoPDF(true);

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, sans-serif;
                background: #ffffff;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 24px;
              }
              .card {
                width: 100%;
                max-width: 320px;
                border: 2px solid #004E89;
                border-radius: 16px;
                overflow: hidden;
                margin: 0 auto;
              }
              .header {
                background-color: #004E89;
                padding: 16px 20px;
                text-align: center;
              }
              .header-titulo {
                color: #ffffff;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-bottom: 2px;
              }
              .header-subtitulo {
                color: rgba(255,255,255,0.75);
                font-size: 11px;
              }
              .body {
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
              }
              .qr-wrapper {
                border: 1px solid #E5E7EB;
                border-radius: 12px;
                padding: 14px;
                background: #F5F6FA;
              }
              .qr-wrapper img {
                display: block;
                width: 160px;
                height: 160px;
              }
              .info {
                width: 100%;
                border-top: 1px solid #E5E7EB;
                padding-top: 14px;
                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              .fila {
                display: flex;
                flex-direction: column;
                gap: 2px;
              }
              .fila-label {
                font-size: 10px;
                color: #7F8C8D;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .fila-valor {
                font-size: 15px;
                font-weight: 700;
                color: #2C3E50;
              }
              .fila-valor-placas {
                font-size: 22px;
                font-weight: 800;
                color: #004E89;
                letter-spacing: 2px;
              }
              .footer {
                background: #F5F6FA;
                padding: 10px 20px;
                text-align: center;
                border-top: 1px solid #E5E7EB;
              }
              .footer-texto {
                font-size: 10px;
                color: #7F8C8D;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <div class="header-titulo">Control de Acarreos</div>
                <div class="header-subtitulo">Identificación de Vehículo</div>
              </div>
              <div class="body">
                <div class="qr-wrapper">
                  <img src="${qrDataUrl}" />
                </div>
                <div class="info">
                  <div class="fila">
                    <span class="fila-label">Placas</span>
                    <span class="fila-valor-placas">${vehiculo.placas}</span>
                  </div>
                  <div class="fila">
                    <span class="fila-label">Operador</span>
                    <span class="fila-valor">${operador.nombre_completo}</span>
                  </div>
                  ${
                    vehiculo.capacidad_m3
                      ? `
                  <div class="fila">
                    <span class="fila-label">Capacidad</span>
                    <span class="fila-valor">${vehiculo.capacidad_m3} m³</span>
                  </div>`
                      : ""
                  }
                </div>
              </div>
              <div class="footer">
                <span class="footer-texto">Escanea el QR para asignar este vehículo a un vale</span>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const puedeCompartir = await Sharing.isAvailableAsync();
      if (!puedeCompartir) {
        Alert.alert("Error", "La función de compartir no está disponible.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `QR Vehículo ${vehiculo.placas}`,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("[PantallaResultado] Error generando PDF:", error);
      Alert.alert("Error", "No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={resultadoStyles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* QR invisible para captura */}
      {vehiculo.qr_uid && (
        <QRCodeGenerator
          value={vehiculo.qr_uid}
          onGenerated={(dataUrl) => setQrDataUrl(dataUrl)}
          size={200}
        />
      )}

      {/* Banner de éxito */}
      <View style={resultadoStyles.banner}>
        <MaterialCommunityIcons
          name="check-circle"
          size={36}
          color={colors.accent}
        />
        <Text style={resultadoStyles.bannerTitulo}>Registro exitoso</Text>
        <Text style={resultadoStyles.bannerMensaje}>{mensaje}</Text>
      </View>

      {/* Card con QR */}
      <View style={resultadoStyles.card}>
        {/* Header card */}
        <View style={resultadoStyles.cardHeader}>
          <MaterialCommunityIcons
            name="dump-truck"
            size={20}
            color={colors.surface}
          />
          <Text style={resultadoStyles.cardHeaderTexto}>
            Identificación del vehículo
          </Text>
        </View>

        {/* QR visual */}
        <View style={resultadoStyles.qrContainer}>
          {qrDataUrl ? (
            <Image
              source={{ uri: qrDataUrl }}
              style={resultadoStyles.qrImagen}
            />
          ) : (
            <View style={resultadoStyles.qrCargando}>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text style={resultadoStyles.qrCargandoTexto}>
                Generando QR...
              </Text>
            </View>
          )}
        </View>

        {/* Datos */}
        <View style={resultadoStyles.datosContainer}>
          <View style={resultadoStyles.datoFila}>
            <Text style={resultadoStyles.datoLabel}>PLACAS</Text>
            <Text style={resultadoStyles.datoValorPlacas}>
              {vehiculo.placas}
            </Text>
          </View>
          <View style={resultadoStyles.separador} />
          <View style={resultadoStyles.datoFila}>
            <Text style={resultadoStyles.datoLabel}>OPERADOR</Text>
            <Text style={resultadoStyles.datoValor}>
              {operador.nombre_completo}
            </Text>
          </View>
          {vehiculo.capacidad_m3 && (
            <>
              <View style={resultadoStyles.separador} />
              <View style={resultadoStyles.datoFila}>
                <Text style={resultadoStyles.datoLabel}>CAPACIDAD</Text>
                <Text style={resultadoStyles.datoValor}>
                  {vehiculo.capacidad_m3} m³
                </Text>
              </View>
            </>
          )}
        </View>

        <Text style={resultadoStyles.qrHint}>
          Pega este QR en el vehículo para asignarlo rápidamente a un vale
        </Text>
      </View>

      {/* Botones */}
      <View style={resultadoStyles.botones}>
        <TouchableOpacity
          style={[
            resultadoStyles.btnPDF,
            (!qrDataUrl || generandoPDF) && resultadoStyles.btnDisabled,
          ]}
          onPress={handleExportarPDF}
          disabled={!qrDataUrl || generandoPDF}
          activeOpacity={0.8}
        >
          {generandoPDF ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={22}
              color={colors.surface}
            />
          )}
          <Text style={resultadoStyles.btnPDFTexto}>
            {generandoPDF ? "Generando..." : "Exportar QR en PDF"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={resultadoStyles.btnListo}
          onPress={onCerrar}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="check"
            size={20}
            color={colors.secondary}
          />
          <Text style={resultadoStyles.btnListoTexto}>Listo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const resultadoStyles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  banner: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  bannerTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
  },
  bannerMensaje: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardHeaderTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: colors.background,
  },
  qrImagen: {
    width: 160,
    height: 160,
    borderRadius: 8,
  },
  qrCargando: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qrCargandoTexto: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  datosContainer: {
    padding: 16,
    gap: 10,
  },
  datoFila: {
    gap: 2,
  },
  datoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  datoValor: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  datoValorPlacas: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.secondary,
    letterSpacing: 2,
  },
  separador: {
    height: 1,
    backgroundColor: colors.background,
  },
  qrHint: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    lineHeight: 16,
  },
  botones: {
    gap: 10,
  },
  btnPDF: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  btnDisabled: {
    backgroundColor: colors.disabled,
    elevation: 0,
  },
  btnPDFTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface,
  },
  btnListo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  btnListoTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.secondary,
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
  const [resultado, setResultado] = useState(null); // { operador, vehiculo, mensaje }

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

      const nombreCompleto = [
        form.nombre.trim(),
        form.primerApellido.trim(),
        form.segundoApellido.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      // ── 1. Verificar si el operador ya existe por nombre ──────────────────
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

      // ── 2. Verificar si la placa ya existe ────────────────────────────────
      const placas = form.placas.trim().toUpperCase();

      const { data: vehiculoExistente } = await supabase
        .from("vehiculos")
        .select("id_vehiculo, placas, capacidad_m3")
        .eq("placas", placas)
        .maybeSingle();

      let vehiculoFinal;
      let placaEraExistente = false;

      if (vehiculoExistente) {
        placaEraExistente = true;

        // Si ya tiene qr_uid lo conservamos, si no le generamos uno
        const qrUidActualizado =
          vehiculoExistente.qr_uid ?? generarQrUid(placas);

        const { data: vehiculoActualizado, error: errorUpdate } = await supabase
          .from("vehiculos")
          .update({
            capacidad_m3: parseFloat(form.capacidad),
            id_sindicato: form.sindicatoId,
            id_operador_sugerido: operadorFinal.id_operador,
            qr_uid: qrUidActualizado,
          })
          .eq("id_vehiculo", vehiculoExistente.id_vehiculo)
          .select("id_vehiculo, placas, capacidad_m3, qr_uid")
          .single();

        if (errorUpdate) throw errorUpdate;
        vehiculoFinal = vehiculoActualizado;
      } else {
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
        vehiculoFinal = vehiculoNuevo;
      }

      if (!isMounted.current) return;

      // ── 3. Construir mensaje de resultado ─────────────────────────────────
      let mensaje;
      if (!operadorEsNuevo && placaEraExistente) {
        mensaje = `El operador "${operadorFinal.nombre_completo}" y la placa "${vehiculoFinal.placas}" ya existían. Se actualizó la capacidad a ${vehiculoFinal.capacidad_m3} m³.`;
      } else if (!operadorEsNuevo) {
        mensaje = `La placa "${vehiculoFinal.placas}" fue agregada. El operador "${operadorFinal.nombre_completo}" ya existía y no fue duplicado.`;
      } else if (placaEraExistente) {
        mensaje = `Operador "${operadorFinal.nombre_completo}" registrado correctamente. La placa "${vehiculoFinal.placas}" ya existía, se actualizó su capacidad a ${vehiculoFinal.capacidad_m3} m³.`;
      } else {
        mensaje = `${operadorFinal.nombre_completo} y su vehículo (${vehiculoFinal.placas}) fueron agregados correctamente.`;
      }

      setResultado({
        operador: operadorFinal,
        vehiculo: vehiculoFinal,
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
        <View style={styles.container}>
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

          {/* ── Pantalla de resultado con QR ── */}
          {resultado ? (
            <PantallaResultado
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
