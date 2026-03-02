/**
 * components/acarreos/rentaHelpers/TicketDescargaSection.js
 *
 * Sección que aparece en ValeDetalleRenta cuando el material
 * tiene es_material_descarga = true.
 *
 * Muestra:
 * - Lista de tickets ya generados
 * - Botón para generar el siguiente ticket (habilitado según lógica de viajes)
 * - Modal para capturar el banco de descarga
 *
 * PROPS:
 * - vale: object
 * - detalleRenta: object
 * - viajes: array — viajes registrados (de useViajesRenta)
 * - totalViajes: number
 */

// 1. React
import React, { useState, useCallback } from "react";

// 2. React Native
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal, // ← AGREGAR
  FlatList, // ← AGREGAR
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../../config/colors";
import { BLUETOOTH_ENABLED } from "../../../config/features";

// 5. Local - Hooks
import { useTicketsDescarga } from "../../../hooks/useTicketsDescarga";

// 6. Local - Componentes
import BancoDescargaModal from "./BancoDescargaModal";

// Imports condicionales de Bluetooth (igual que ImprimirTicketButton)
let verificarBluetooth, escanearImpresoras, conectarImpresora, imprimirTicket;

if (BLUETOOTH_ENABLED) {
  const bt = require("../../../services/bluetoothPrinter");
  verificarBluetooth = bt.verificarBluetooth;
  escanearImpresoras = bt.escanearImpresoras;
  conectarImpresora = bt.conectarImpresora;
  imprimirTicket = bt.imprimirTicket;
}

// ─── Subcomponente: item de ticket ya generado ────────────────────────────────

const TicketItem = ({ ticket }) => {
  const formatFecha = (iso) => {
    if (!iso) return "--";
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.ticketItem}>
      <View style={styles.ticketIcono}>
        <MaterialCommunityIcons
          name="ticket-confirmation"
          size={16}
          color={colors.accent}
        />
      </View>
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketFolio}>{ticket.folio_ticket}</Text>
        <Text style={styles.ticketBanco}>{ticket.banco_descarga}</Text>
        <Text style={styles.ticketFecha}>
          {formatFecha(ticket.fecha_impresion)}
        </Text>
      </View>
      <View style={styles.ticketPersona}>
        <Text style={styles.ticketPersonaTexto} numberOfLines={1}>
          {ticket.persona?.nombre} {ticket.persona?.primer_apellido}
        </Text>
      </View>
    </View>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const TicketDescargaSection = ({
  vale,
  detalleRenta,
  viajes = [],
  totalViajes = 0,
  datosPendientesGuardados = false,
}) => {
  const {
    tickets,
    loading,
    registrando,
    totalTickets,
    esMaterialDescarga,
    registrarTicket,
  } = useTicketsDescarga({ vale, detalleRenta });

  const [modalVisible, setModalVisible] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  // NUEVOS:
  const [mostrarModalImpresoras, setMostrarModalImpresoras] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [impresoras, setImpresoras] = useState([]);
  const [ticketPendiente, setTicketPendiente] = useState(null); // ticket esperando impresora

  // Si el material no aplica, no renderizar nada
  if (!esMaterialDescarga) {
    return null;
  }

  const tieneAsignacion =
    datosPendientesGuardados || !!(vale?.id_operador && vale?.id_vehiculo);

  const puedeGenerar =
    esMaterialDescarga &&
    vale?.estado === "en_proceso" &&
    tieneAsignacion &&
    (totalTickets === 0 || totalViajes >= totalTickets);
  const numeroSiguienteTicket = totalTickets + 1;

  // Razón por la que no puede generar (para feedback al usuario)
  const razonBloqueado = () => {
    if (vale?.estado !== "en_proceso")
      return "Solo disponible en vales en proceso";
    if (!vale?.id_operador || !vale?.id_vehiculo)
      return "Asigna operador y vehículo primero";
    if (totalTickets > 0 && totalViajes < totalTickets) {
      return `Registra el viaje ${totalTickets + 1} para habilitar el siguiente ticket`;
    }
    return null;
  };

  // ─── Flujo de impresión ───────────────────────────────────────────────────

  const handlePresionarBoton = useCallback(() => {
    if (!puedeGenerar) {
      const razon = razonBloqueado();
      if (razon) Alert.alert("No disponible", razon);
      return;
    }
    setModalVisible(true);
  }, [puedeGenerar]);

  const handleConfirmarBanco = useCallback(
    async (bancoDescarga) => {
      console.log("[TicketDescargaSection] Banco confirmado:", bancoDescarga);
      setModalVisible(false);

      // 1. Registrar el ticket en BD
      const ticketData = await registrarTicket(bancoDescarga);
      if (!ticketData) return;

      console.log(
        "[TicketDescargaSection] Ticket creado:",
        ticketData.folio_ticket,
      );

      if (!BLUETOOTH_ENABLED) {
        Alert.alert(
          "Ticket Registrado",
          `Folio: ${ticketData.folio_ticket}\nBanco: ${ticketData.banco_descarga}\n\nImpresora Bluetooth no disponible.`,
        );
        return;
      }

      // 2. Verificar Bluetooth y escanear impresoras
      try {
        const bluetoothActivo = await verificarBluetooth();
        if (!bluetoothActivo) {
          Alert.alert(
            "Bluetooth desactivado",
            "Activa el Bluetooth para conectar la impresora.",
          );
          return;
        }

        setEscaneando(true);
        setImpresoras([]);
        setTicketPendiente(ticketData); // guardar para imprimir cuando seleccionen impresora
        setMostrarModalImpresoras(true);

        const dispositivosEncontrados = await escanearImpresoras();
        setImpresoras(dispositivosEncontrados);
      } catch (error) {
        console.error("[TicketDescargaSection] Error escaneando:", error);
        Alert.alert("Error", "No se pudieron buscar impresoras.");
      } finally {
        setEscaneando(false);
      }
    },
    [registrarTicket],
  );

  const handleSeleccionarImpresora = useCallback(
    async (dispositivo) => {
      try {
        setImprimiendo(true);
        console.log(
          "[TicketDescargaSection] Conectando a:",
          dispositivo.name,
          dispositivo.address,
        );

        const device = await conectarImpresora(dispositivo.address);
        const lineas = generarContenidoTicketDescarga(
          vale,
          detalleRenta,
          ticketPendiente,
        );

        console.log(
          "[TicketDescargaSection] Imprimiendo",
          lineas.length,
          "líneas",
        );
        await imprimirTicket(device, lineas);

        console.log("[TicketDescargaSection] Impresion exitosa");
        setMostrarModalImpresoras(false);
        setTicketPendiente(null);
        Alert.alert(
          "Listo",
          `Ticket ${ticketPendiente.folio_ticket} impreso correctamente.`,
        );
      } catch (error) {
        console.error("[TicketDescargaSection] Error al imprimir:", error);
        Alert.alert(
          "Error al imprimir",
          `El ticket fue registrado pero no se pudo imprimir.\n\n${error.message}`,
        );
      } finally {
        setImprimiendo(false);
      }
    },
    [vale, detalleRenta, ticketPendiente],
  );

  const handleCerrarModalImpresoras = useCallback(() => {
    if (escaneando) {
      Alert.alert("Escaneo en curso", "¿Deseas cancelar la búsqueda?", [
        { text: "Continuar", style: "cancel" },
        {
          text: "Cancelar",
          style: "destructive",
          onPress: () => {
            setEscaneando(false);
            setMostrarModalImpresoras(false);
            setTicketPendiente(null);
          },
        },
      ]);
    } else {
      setMostrarModalImpresoras(false);
      setTicketPendiente(null);
    }
  }, [escaneando]);

  const handleCancelarModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="dump-truck"
          size={20}
          color={colors.secondary}
        />
        <Text style={styles.titulo}>Tickets de Descarga</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{totalTickets}</Text>
        </View>
      </View>

      {/* Lista de tickets generados */}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loader}
        />
      ) : tickets.length === 0 ? (
        <View style={styles.sinTickets}>
          <MaterialCommunityIcons
            name="ticket-outline"
            size={32}
            color={colors.textSecondary}
          />
          <Text style={styles.sinTicketsTexto}>Sin tickets generados</Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {tickets.map((ticket) => (
            <TicketItem key={ticket.id_ticket} ticket={ticket} />
          ))}
        </View>
      )}

      {/* Botón para generar ticket */}
      <TouchableOpacity
        style={[
          styles.botonGenerar,
          (!puedeGenerar || imprimiendo || registrando) &&
            styles.botonDeshabilitado,
        ]}
        onPress={handlePresionarBoton}
        disabled={imprimiendo || registrando}
        activeOpacity={0.8}
      >
        {imprimiendo || registrando ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          <>
            <MaterialCommunityIcons
              name="printer-pos"
              size={20}
              color={puedeGenerar ? colors.surface : colors.textSecondary}
            />
            <Text
              style={[
                styles.botonTexto,
                !puedeGenerar && styles.botonTextoDeshabilitado,
              ]}
            >
              {totalTickets === 0
                ? "Imprimir Primer Ticket de Descarga"
                : `Imprimir Ticket #${String(numeroSiguienteTicket).padStart(2, "0")}`}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Razón de bloqueo */}
      {!puedeGenerar && razonBloqueado() && (
        <Text style={styles.razonBloqueo}>{razonBloqueado()}</Text>
      )}

      {/* Modal banco de descarga */}
      <BancoDescargaModal
        visible={modalVisible}
        onConfirmar={handleConfirmarBanco}
        onCancelar={handleCancelarModal}
        numeroTicket={numeroSiguienteTicket}
        loading={registrando}
      />

      {/* Modal selector de impresora — igual que ImprimirTicketButton */}
      {BLUETOOTH_ENABLED && (
        <Modal
          visible={mostrarModalImpresoras}
          transparent
          animationType="slide"
          onRequestClose={handleCerrarModalImpresoras}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Seleccionar impresora</Text>
                <TouchableOpacity onPress={handleCerrarModalImpresoras}>
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
                  <Text style={styles.estadoTexto}>Buscando impresoras...</Text>
                </View>
              ) : impresoras.length === 0 ? (
                <View style={styles.estadoContainer}>
                  <MaterialCommunityIcons
                    name="printer-off"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.estadoTexto}>
                    No se encontraron impresoras.{"\n"}Asegúrate de que estén
                    encendidas.
                  </Text>
                  <TouchableOpacity
                    style={styles.btnReintentar}
                    onPress={() => {
                      setMostrarModalImpresoras(false);
                      setTimeout(handleConfirmarBanco, 300);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="refresh"
                      size={16}
                      color={colors.secondary}
                    />
                    <Text style={styles.btnReintentarTexto}>Reintentar</Text>
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
                      disabled={imprimiendo}
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
                      {imprimiendo ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.secondary}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={colors.textSecondary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// ─── Generador de contenido para impresora térmica ────────────────────────────

const SEPARADOR = "--------------------------------";
const ALINEACION = { IZQUIERDA: "left", CENTRO: "center", DERECHA: "right" };

const formatearFecha = (fecha) => {
  if (!fecha) return "N/A";
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

const formatearHora = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/**
 * Genera las líneas ESC/POS para el ticket de descarga
 */
const generarContenidoTicketDescarga = (vale, detalleRenta, ticketData) => {
  const empresa = vale.obras?.empresas?.empresa || "CONSTRUCCION";
  const cc = vale.obras?.cc || "";
  const nombreObra = vale.obras?.obra || "N/A";
  const obra = cc ? `${cc}-${nombreObra}` : nombreObra;
  const material = detalleRenta?.material?.material || "N/A";
  const placas = vale.vehiculos?.placas || "N/A";
  const capacidad = detalleRenta?.capacidad_m3
    ? `${detalleRenta.capacidad_m3} m3`
    : "N/A";
  const fechaVale = formatearFecha(vale.fecha_creacion);
  const horaVale = formatearHora(vale.fecha_creacion);
  const fechaTicket = formatearFecha(ticketData.fecha_impresion || new Date());
  const horaTicket = formatearHora(ticketData.fecha_impresion || new Date());
  const qrUrl =
    vale.qr_verification_url ||
    `https://web-acarreos.vercel.app/vale/${vale.folio}`;

  console.log("[generarContenidoTicketDescarga] Generando ticket:", {
    folio_ticket: ticketData.folio_ticket,
    banco: ticketData.banco_descarga,
    empresa,
    obra,
    material,
    placas,
  });

  return [
    {
      tipo: "texto",
      contenido: `${empresa}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: "VALE DE DESCARGA\n",
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `FOLIO: ${ticketData.folio_ticket}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: `${fechaVale} ${horaVale}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "OBRA:\n",
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `${obra}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `MATERIAL: ${material}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `PLACAS: ${placas}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `CAPACIDAD: ${capacidad}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "BANCO DE DESCARGA:\n",
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `${ticketData.banco_descarga}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "ESTADO: EN PROCESO\n",
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: `IMPRESO: ${fechaTicket} ${horaTicket}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: "Escanear para verificar",
      opciones: { align: ALINEACION.CENTRO },
    },
    { tipo: "qr", contenido: qrUrl, tamano: 120 },
  ];
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8EAF0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  badgeTexto: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  loader: {
    paddingVertical: 20,
  },
  sinTickets: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  sinTicketsTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  lista: {
    marginBottom: 12,
    gap: 6,
  },
  ticketItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  ticketIcono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  ticketInfo: {
    flex: 1,
  },
  ticketFolio: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  ticketBanco: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "600",
    marginTop: 2,
  },
  ticketFecha: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  ticketPersona: {
    maxWidth: 100,
  },
  ticketPersonaTexto: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "right",
  },
  botonGenerar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    marginTop: 4,
  },
  botonDeshabilitado: {
    backgroundColor: "#E8EAF0",
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface,
  },
  botonTextoDeshabilitado: {
    color: colors.textSecondary,
  },
  razonBloqueo: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
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
  estadoTexto: {
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
  },
  btnReintentarTexto: {
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
  impresoraInfo: { flex: 1 },
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

export default TicketDescargaSection;
