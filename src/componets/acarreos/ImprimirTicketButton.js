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

const ImprimirTicketButton = ({
  valeId,
  valeData,
  impresiones,
  estado,
  onImpreso,
}) => {
  const [imprimiendo, setImprimiendo] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [impresoras, setImpresoras] = useState([]);

  // Validar que el vale sea del mismo día o día siguiente
  const validarFechaImpresion = useCallback(() => {
    if (!valeData?.fecha_creacion) return false;
    const hoy = new Date();
    const fechaCreacion = new Date(valeData.fecha_creacion);

    hoy.setHours(0, 0, 0, 0);
    fechaCreacion.setHours(0, 0, 0, 0);

    const diffMs = hoy - fechaCreacion;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDias <= 1; // mismo día (0) o día siguiente (1)
  }, [valeData?.fecha_creacion]);

  const dentroDeRangoFecha = validarFechaImpresion();
  const esEnProceso = estado === "en_proceso";
  const puedeImprimir = impresiones > 0 && esEnProceso && dentroDeRangoFecha;

  const descontarImpresion = useCallback(async () => {
    const { error } = await supabase
      .from("vales")
      .update({ impresiones_ticket: impresiones - 1 })
      .eq("id_vale", valeId);
    if (error) throw error;
  }, [valeId, impresiones]);

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
      setImpresoras([]);
      setMostrarModal(true);
      setEscaneando(true);
      const dispositivos = await escanearImpresoras();
      setImpresoras(dispositivos);
    } catch (error) {
      setMostrarModal(false);
      Alert.alert("Error", error.message);
    } finally {
      setEscaneando(false);
    }
  }, []);

  const handleSeleccionarImpresora = useCallback(
    async (dispositivo) => {
      try {
        setImprimiendo(true);
        console.log(
          `[BTN] Conectando a: ${dispositivo.name} | ${dispositivo.address}`,
        );
        const device = await conectarImpresora(dispositivo.address);
        console.log("[BTN] Conexion exitosa, generando ticket...");
        const lineas =
          valeData.tipo_vale === "renta"
            ? generarTicketRenta(valeData)
            : generarTicketMaterial(valeData);
        console.log(`[BTN] Ticket generado con ${lineas.length} lineas`);
        await imprimirTicket(device, lineas);
        console.log("[BTN] Impresion exitosa");
        await descontarImpresion();
        setMostrarModal(false);
        onImpreso?.();
      } catch (error) {
        console.log(`[BTN] Error: ${error.message}`);
        Alert.alert("Error al imprimir", error.message);
      } finally {
        setImprimiendo(false);
      }
    },
    [valeData, descontarImpresion, onImpreso],
  );

  const handleCerrarModal = useCallback(() => {
    if (escaneando) {
      Alert.alert(
        "Escaneo en curso",
        "Se esta buscando impresoras. ¿Deseas cancelar?",
        [
          { text: "Continuar", style: "cancel" },
          {
            text: "Cancelar",
            style: "destructive",
            onPress: () => {
              setEscaneando(false);
              setMostrarModal(false);
            },
          },
        ],
      );
    } else {
      setMostrarModal(false);
    }
  }, [escaneando]);

  return (
    <>
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
              : !esEnProceso
                ? "Solo vales en proceso"
                : !dentroDeRangoFecha
                  ? "Plazo de impresion vencido"
                  : impresiones > 0
                    ? "Imprimir ticket"
                    : "Ticket impreso"}
          </Text>
        </TouchableOpacity>
      )}

      {BLUETOOTH_ENABLED && (
        <Modal
          visible={mostrarModal}
          transparent
          animationType="slide"
          onRequestClose={handleCerrarModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Seleccionar impresora</Text>
                <TouchableOpacity onPress={handleCerrarModal}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {escaneando ? (
                <View style={styles.estadoContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.estadoText}>Buscando impresoras...</Text>
                </View>
              ) : impresoras.length === 0 ? (
                <View style={styles.estadoContainer}>
                  <MaterialCommunityIcons
                    name="printer-off"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.estadoText}>
                    No se encontraron impresoras.{"\n"}
                    Asegurate de que esten encendidas y en modo Bluetooth.
                  </Text>
                  <TouchableOpacity
                    style={styles.btnReintentar}
                    onPress={() => {
                      setMostrarModal(false);
                      setTimeout(handleMostrarImpresoras, 300);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="refresh"
                      size={16}
                      color={colors.secondary}
                    />
                    <Text style={styles.btnReintentarText}>Reintentar</Text>
                  </TouchableOpacity>
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
    maxHeight: "65%",
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
  estadoContainer: {
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  estadoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  btnReintentar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.secondary,
    gap: 6,
    marginTop: 8,
  },
  btnReintentarText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: "600",
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
