// components/acarreos/rentaHelpers/TicketDescargaSection.js

// 1. React
import React, { useState, useCallback, useEffect, useRef } from "react";

// 2. React Native
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../../config/colors";
import { BLUETOOTH_ENABLED, IS_WEB } from "../../../config/features";
import { urlAyudaVale } from "../../../config/ayuda";

// 5. Local - Hooks
import { useTicketsDescarga } from "../../../hooks/useTicketsDescarga";

// 6. Local - Componentes
import BotonAyuda from "../../common/BotonAyuda";
import BancoDescargaModal from "./BancoDescargaModal";
import ModalImprimirTicketRenta from "./ModalImprimirTicketRenta";
import MaterialTicketModal from "./MaterialTicketModal";

let solicitarPermisos;
if (BLUETOOTH_ENABLED) {
  const bt = require("../../../services/bluetoothPrinter");
  solicitarPermisos = bt.solicitarPermisos;
}

// ─── Subcomponente: item de ticket ya generado ────────────────────────────────

const TicketItem = ({ ticket, onReimprimir }) => {
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

  const yaReimpreso = ticket.reimprimir_count >= 1;

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
        {ticket.material?.material && (
          <Text style={styles.ticketMaterial}>{ticket.material.material}</Text>
        )}
        <Text style={styles.ticketFecha}>
          {formatFecha(ticket.fecha_impresion)}
        </Text>
      </View>
      <View style={styles.ticketPersona}>
        <Text style={styles.ticketPersonaTexto} numberOfLines={1}>
          {ticket.persona?.nombre} {ticket.persona?.primer_apellido}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.botonReimprimir,
          yaReimpreso && styles.botonReimprimirAgotado,
        ]}
        onPress={() => onReimprimir(ticket)}
        disabled={yaReimpreso}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={yaReimpreso ? "printer-check" : "printer-pos"}
          size={18}
          color={yaReimpreso ? colors.textSecondary : colors.secondary}
        />
      </TouchableOpacity>
    </View>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const TicketDescargaSection = ({
  vale,
  detalleRenta,
  viajes = [],
  totalViajes = 0,
  onTotalTicketsChange,
  esResidente = false,
  esChecador = false,
}) => {
  const {
    tickets,
    loading,
    registrando,
    eliminandoTicket,
    totalTickets,
    esMaterialDescarga,
    registrarTicket,
    reimprimirTicket,
    eliminarUltimoTicket,
  } = useTicketsDescarga({ vale, detalleRenta });

  useEffect(() => {
    onTotalTicketsChange?.(totalTickets);
  }, [totalTickets]);

  // En pipas de agua el ticket registra el POZO al que se rellena agua, no un
  // banco de descarga, y el material es siempre Agua (no se elige).
  const esPipa = !!vale?.es_pipa_agua;

  const [modalVisible, setModalVisible] = useState(false);
  const [mostrarModalMaterial, setMostrarModalMaterial] = useState(false);
  const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);
  const [ticketPendiente, setTicketPendiente] = useState(null);
  const [bancoSeleccionado, setBancoSeleccionado] = useState(null);
  const [modoReimpresion, setModoReimpresion] = useState(false);
  const permisosRef = useRef(false);

  // Pedir permisos BT en mount, antes de que se abra cualquier Modal apilado.
  // PermissionsAndroid.requestMultiple se bloquea si hay un Modal RN encima.
  useEffect(() => {
    if (!BLUETOOTH_ENABLED || !solicitarPermisos || permisosRef.current) return;
    permisosRef.current = true;
    solicitarPermisos().catch(() => {});
  }, []);

  if (!esMaterialDescarga) {
    return null;
  }

  const tieneAsignacion = !!(vale?.id_operador && vale?.id_vehiculo);

  const puedeGenerar =
    esMaterialDescarga &&
    vale?.estado === "en_proceso" &&
    tieneAsignacion &&
    (totalTickets === 0 || totalViajes >= totalTickets);

  const numeroSiguienteTicket = totalTickets + 1;

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

  const handlePresionarBoton = useCallback(async () => {
    if (!puedeGenerar) {
      const razon = razonBloqueado();
      if (razon) Alert.alert("No disponible", razon);
      return;
    }
    setModalVisible(true);
  }, [puedeGenerar]);

  const handleConfirmarBanco = useCallback(
    async (bancoDescarga) => {
      setModalVisible(false);

      // Pipas: el material siempre es Agua (el del vale), no se elige. Se salta
      // el modal de material y se registra el ticket directo.
      if (esPipa) {
        const materialDelVale = {
          id_material: detalleRenta?.id_material ?? null,
          material: detalleRenta?.material?.material ?? "Agua",
        };
        const ticketData = await registrarTicket(bancoDescarga, materialDelVale);
        if (!ticketData) return;
        setTicketPendiente(ticketData);
        setMostrarModalImpresion(true);
        return;
      }

      setBancoSeleccionado(bancoDescarga);
      setMostrarModalMaterial(true);
    },
    [esPipa, registrarTicket, detalleRenta],
  );

  const handleConfirmarMaterial = useCallback(
    async (materialSeleccionado) => {
      setMostrarModalMaterial(false);
      const ticketData = await registrarTicket(
        bancoSeleccionado,
        materialSeleccionado,
      );
      if (!ticketData) return;
      setTicketPendiente(ticketData);
      setMostrarModalImpresion(true);
    },
    [registrarTicket, bancoSeleccionado],
  );

  const handleCancelarMaterial = useCallback(() => {
    setMostrarModalMaterial(false);
    setBancoSeleccionado(null);
  }, []);

  const handleCancelarModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleReimprimirTicket = useCallback(
    async (ticket) => {
      const datos = await reimprimirTicket(ticket);
      if (!datos) return;
      setTicketPendiente(datos);
      setModoReimpresion(true);
      setMostrarModalImpresion(true);
    },
    [reimprimirTicket],
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={esPipa ? "water-pump" : "dump-truck"}
          size={20}
          color={colors.secondary}
        />
        <Text style={styles.titulo}>
          {esPipa ? "Tickets de Pozo" : "Tickets de Descarga"}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{totalTickets}</Text>
        </View>
        <BotonAyuda url={urlAyudaVale(vale, "ticket")} />
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
            <TicketItem
              key={ticket.id_ticket}
              ticket={ticket}
              onReimprimir={handleReimprimirTicket}
            />
          ))}
        </View>
      )}

      {/* Botón eliminar último ticket — solo cuando el ticket no tiene viaje aún */}
      {(esResidente || esChecador) && totalTickets > 0 && totalTickets > totalViajes && (
        <TouchableOpacity
          style={[styles.botonEliminarTicket, eliminandoTicket && styles.botonDeshabilitado]}
          onPress={() => {
            const ultimoTicket = tickets[tickets.length - 1];
            Alert.alert(
              "Eliminar Ticket",
              `¿Eliminar el Ticket #${totalTickets} (${ultimoTicket?.folio_ticket})? Esta accion no se puede deshacer.`,
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Eliminar",
                  style: "destructive",
                  onPress: () => eliminarUltimoTicket?.(ultimoTicket.id_ticket),
                },
              ],
            );
          }}
          disabled={eliminandoTicket}
          activeOpacity={0.7}
        >
          {eliminandoTicket ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="delete-circle-outline"
                size={18}
                color={colors.danger}
              />
              <Text style={styles.botonEliminarTicketTexto}>
                Eliminar Ticket #{totalTickets}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Aviso — en web el Bluetooth del navegador no puede hablar con impresoras térmicas */}
      {IS_WEB && (
        <View style={styles.avisoWeb}>
          <MaterialCommunityIcons
            name="alert-outline"
            size={18}
            color={colors.warning}
          />
          <Text style={styles.avisoWebTexto}>
            Estás en la versión web: el ticket se registra, pero la impresión
            Bluetooth no va a funcionar aquí. Usa la app desde el celular
            para imprimirlo.
          </Text>
        </View>
      )}

      {/* Botón para generar ticket */}
      <TouchableOpacity
        style={[
          styles.botonGenerar,
          (!puedeGenerar || registrando) && styles.botonDeshabilitado,
        ]}
        onPress={handlePresionarBoton}
        disabled={registrando}
        activeOpacity={0.8}
      >
        {registrando ? (
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
                ? esPipa
                  ? "Imprimir Primer Ticket de Pozo"
                  : "Imprimir Primer Ticket de Descarga"
                : `Imprimir Ticket #${String(numeroSiguienteTicket).padStart(2, "0")}`}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Razón de bloqueo */}
      {!puedeGenerar && razonBloqueado() && (
        <Text style={styles.razonBloqueo}>{razonBloqueado()}</Text>
      )}

      {/* Modal banco de descarga / pozo */}
      <BancoDescargaModal
        visible={modalVisible}
        onConfirmar={handleConfirmarBanco}
        onCancelar={handleCancelarModal}
        numeroTicket={numeroSiguienteTicket}
        loading={registrando}
        esPipa={esPipa}
      />

      {/* Modal selector de material */}
      <MaterialTicketModal
        visible={mostrarModalMaterial}
        materialDefault={detalleRenta?.material}
        numeroTicket={numeroSiguienteTicket}
        onConfirmar={handleConfirmarMaterial}
        onCancelar={handleCancelarMaterial}
      />

      {/* Modal selector de impresora */}
      <ModalImprimirTicketRenta
        visible={mostrarModalImpresion}
        valeData={vale}
        generarLineas={() => {
          if (!ticketPendiente) return [];
          return generarContenidoTicketDescarga(
            vale,
            detalleRenta,
            ticketPendiente,
          );
        }}
        resumenDatos={{
          folio: ticketPendiente?.folio_ticket,
          operador:
            vale?.operadores?.nombre_completo ?? vale?.operadores?.nombre,
          placas: vale?.vehiculos?.placas,
          descripcion: `${esPipa ? "Pozo" : "Banco"}: ${ticketPendiente?.banco_descarga ?? ""}`,
        }}
        onImpreso={() => {
          setMostrarModalImpresion(false);
          setTicketPendiente(null);
          setModoReimpresion(false);
        }}
        onSinImpresora={() => {
          setMostrarModalImpresion(false);
          setTicketPendiente(null);
          setModoReimpresion(false);
        }}
      />
    </View>
  );
};

// ─── Generador de contenido para impresora térmica ────────────────────────────

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

const generarContenidoTicketDescarga = (vale, detalleRenta, ticketData) => {
  const esPipa = !!vale?.es_pipa_agua;
  const empresa = vale.obras?.empresas?.empresa || "CONSTRUCCION";
  const cc = vale.obras?.cc || "";
  const nombreObra = vale.obras?.obra || "N/A";
  const obra = cc ? `${cc}-${nombreObra}` : nombreObra;
  const material =
    ticketData.material?.material || detalleRenta?.material?.material || "N/A";
  const placas = vale.vehiculos?.placas || "N/A";
  // La capacidad viene del vehiculo asignado; vale_renta_detalle solo la trae
  // en vales viejos donde se capturo a mano
  const capacidadRaw =
    vale.vehiculos?.capacidad_m3 ?? detalleRenta?.capacidad_m3;
  const capacidad = capacidadRaw ? `${capacidadRaw} m3` : "N/A";
  const fechaVale = formatearFecha(vale.fecha_creacion);
  const horaVale = formatearHora(vale.fecha_creacion);
  const fechaTicket = formatearFecha(ticketData.fecha_impresion || new Date());
  const horaTicket = formatearHora(ticketData.fecha_impresion || new Date());
  const qrUrl =
    vale.qr_verification_url ||
    `https://web-acarreos.vercel.app/vale/${vale.folio}`;

  return [
    {
      tipo: "texto",
      contenido: `${empresa}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: esPipa ? "VALE DE PIPA DE AGUA\n" : "VALE DE DESCARGA\n",
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
      contenido: esPipa ? "POZO:\n" : "BANCO DE DESCARGA:\n",
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
    fontSize: 10,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  ticketBanco: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: "600",
    marginTop: 2,
  },
  ticketMaterial: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: "600",
    marginTop: 1,
  },
  ticketFecha: {
    fontSize: 10,
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
  botonReimprimir: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  botonReimprimirAgotado: {
    borderColor: colors.textSecondary,
    backgroundColor: colors.background,
  },
  botonEliminarTicket: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 6,
  },
  botonEliminarTicketTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  avisoWeb: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF6E7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 12,
    gap: 8,
    marginBottom: 10,
  },
  avisoWebTexto: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 17,
  },
});

export default TicketDescargaSection;
