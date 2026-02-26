// 1. React
import React, { useState, useCallback } from "react";

// 2. React Native
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  View,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";
import { BLUETOOTH_ENABLED } from "../../config/features";

// 5. Local - Servicios
import {
  generarYCompartirPDFTicket,
  generarYCompartirPDFTicketRenta,
} from "../../services/pdfTicketGenerator";

// Solo se importa si Bluetooth está activo
let verificarBluetooth,
  escanearImpresoras,
  conectarImpresora,
  imprimirTicket,
  generarTicketMaterial,
  generarTicketRenta;
if (BLUETOOTH_ENABLED) {
  const bt = require("../../services/bluetoothPrinter");
  const tg = require("../../services/ticketGenerator");
  generarTicketMaterial = tg.generarTicketMaterial;
  generarTicketRenta = tg.generarTicketRenta;
  verificarBluetooth = bt.verificarBluetooth;
  escanearImpresoras = bt.escanearImpresoras;
  conectarImpresora = bt.conectarImpresora;
  imprimirTicket = bt.imprimirTicket;
}

/**
 * ImprimirTicketButton
 *
 * BLUETOOTH_ENABLED = false: Solo muestra botón PDF (Expo Go / iPhone)
 * BLUETOOTH_ENABLED = true:  Muestra ambos botones (Android con impresora)
 *
 * PROPS:
 * - valeId: string
 * - valeData: object
 * - impresiones: number
 * - estado: string
 * - onImpreso: function
 */
const ImprimirTicketButton = ({
  valeId,
  valeData,
  impresiones,
  estado,
  onImpreso,
}) => {
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [impresoras, setImpresoras] = useState([]);

  const puedeImprimir = impresiones > 0;

  const descontarImpresion = useCallback(async () => {
    const { error } = await supabase
      .from("vales")
      .update({ impresiones_ticket: impresiones - 1 })
      .eq("id_vale", valeId);
    if (error) throw error;
  }, [valeId, impresiones]);

  const handleCompartirPDF = useCallback(async () => {
    try {
      setGenerandoPDF(true);
      if (valeData.tipo_vale === "renta") {
        await generarYCompartirPDFTicketRenta(valeData);
      } else {
        await generarYCompartirPDFTicket(valeData);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setGenerandoPDF(false);
    }
  }, [valeData]);

  const handleMostrarImpresoras = useCallback(async () => {
    try {
      const bluetoothActivo = await verificarBluetooth();
      if (!bluetoothActivo) {
        Alert.alert(
          "Bluetooth desactivado",
          "Activa el Bluetooth para conectar la impresora.",
        );
        return;
      }
      setMostrarModal(true);
      setEscaneando(true);
      const dispositivos = await escanearImpresoras();
      setImpresoras(dispositivos);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setEscaneando(false);
    }
  }, []);

  const handleSeleccionarImpresora = useCallback(
    async (dispositivo) => {
      try {
        setMostrarModal(false);
        setImprimiendo(true);
        await conectarImpresora(dispositivo.address);
        const lineas =
          valeData.tipo_vale === "renta"
            ? generarTicketRenta(valeData)
            : generarTicketMaterial(valeData);
        await imprimirTicket(lineas);
        await descontarImpresion();
        onImpreso();
      } catch (error) {
        Alert.alert("Error al imprimir", error.message);
      } finally {
        setImprimiendo(false);
      }
    },
    [valeData, descontarImpresion, onImpreso],
  );

  return (
    <>
      {/* Botón Bluetooth - solo si BLUETOOTH_ENABLED = true */}
      {BLUETOOTH_ENABLED && (
        <TouchableOpacity
          style={[styles.btn, !puedeImprimir && styles.btnDisabled]}
          onPress={handleMostrarImpresoras}
          disabled={!puedeImprimir || imprimiendo}
          activeOpacity={0.7}
        >
          {imprimiendo ? (
            <ActivityIndicator size={14} color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons
              name="printer-pos"
              size={15}
              color="#FFFFFF"
            />
          )}
          <Text style={styles.btnText}>
            {imprimiendo
              ? "Imprimiendo..."
              : puedeImprimir
                ? `Imprimir ticket (${impresiones})`
                : "Ticket impreso"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Botón PDF - siempre disponible */}
      <TouchableOpacity
        style={styles.btnPDF}
        onPress={handleCompartirPDF}
        disabled={generandoPDF}
        activeOpacity={0.7}
      >
        {generandoPDF ? (
          <ActivityIndicator size={13} color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons
            name="file-pdf-box"
            size={13}
            color="#FFFFFF"
          />
        )}
        <Text style={styles.btnText}>
          {generandoPDF ? "Generando..." : "Compartir ticket"}
        </Text>
      </TouchableOpacity>

      {/* Modal impresoras - solo si BLUETOOTH_ENABLED = true */}
      {BLUETOOTH_ENABLED && (
        <Modal
          visible={mostrarModal}
          transparent
          animationType="slide"
          onRequestClose={() => setMostrarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Seleccionar impresora</Text>
                <TouchableOpacity onPress={() => setMostrarModal(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {escaneando ? (
                <View style={styles.escaneandoContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.escaneandoText}>
                    Buscando impresoras...
                  </Text>
                </View>
              ) : impresoras.length === 0 ? (
                <View style={styles.escaneandoContainer}>
                  <MaterialCommunityIcons
                    name="printer-off"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.escaneandoText}>
                    No se encontraron impresoras.{"\n"}
                    Asegúrate de que estén encendidas y en modo Bluetooth.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={impresoras}
                  keyExtractor={(item) => item.address}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.impresoraItem}
                      onPress={() => handleSeleccionarImpresora(item)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="printer-pos"
                        size={24}
                        color={colors.secondary}
                      />
                      <View style={styles.impresoraInfo}>
                        <Text style={styles.impresoraNombre}>
                          {item.name || "Impresora sin nombre"}
                        </Text>
                        <Text style={styles.impresoraAddress}>
                          {item.address}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    marginTop: 6,
    gap: 6,
  },
  btnPDF: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    marginTop: 4,
    gap: 6,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  escaneandoContainer: {
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  escaneandoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  impresoraItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
    gap: 12,
  },
  impresoraInfo: {
    flex: 1,
  },
  impresoraNombre: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  impresoraAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default ImprimirTicketButton;
