/**
 * components/acarreos/helpersMaterial/TicketsMaterialSection.js
 *
 * Sección de tickets para vales de MATERIAL.
 * Análogo a TicketDescargaSection de renta pero para material.
 *
 * FLUJO:
 * 1. Primer ticket disponible apenas hay operador y vehículo asignados
 * 2. Camión va al banco con el ticket impreso
 * 3. Camión regresa → se registra el viaje
 * 4. Aparece botón opcional para imprimir ticket del siguiente viaje
 * 5. Repetir hasta completar el vale
 *
 * PROPS:
 * - vale: object
 * - detalle: object — vale_material_detalles[0]
 * - totalViajes: number — viajes ya registrados
 * - operadorYVehiculoGuardados: boolean — override para primer ticket
 */

// 1. React
import React, { useState, useCallback, useEffect } from "react";

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
import { BLUETOOTH_ENABLED } from "../../../config/features";

// 5. Local - Hooks
import { useTicketsMaterial } from "../../../hooks/useTicketsMaterial";

// 6. Local - Componentes
import ModalImprimirTicketRenta from "../rentaHelpers/ModalImprimirTicketRenta";

// 7. Imports condicionales Bluetooth
let generarTicketMaterialViaje;
if (BLUETOOTH_ENABLED) {
  const tg = require("../../../services/ticketGenerator");
  generarTicketMaterialViaje = tg.generarTicketMaterialViaje;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Generador de líneas ESC/POS para el ticket de material ───────────────────

const ALINEACION = { IZQUIERDA: "left", CENTRO: "center", DERECHA: "right" };

const fFecha = (fecha) => {
  if (!fecha) return "N/A";
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

const fHora = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const generarContenidoTicketMaterial = (vale, detalle, ticketData) => {
  const empresa = vale.obras?.empresas?.empresa || "CONSTRUCCION";
  const cc = vale.obras?.cc || "";
  const nombreObra = vale.obras?.obra || "N/A";
  const obra = cc ? `${cc}-${nombreObra}` : nombreObra;
  const material = detalle?.material?.material || "N/A";
  const banco = detalle?.bancos?.banco || "N/A";
  const placas = vale.vehiculos?.placas || "N/A";
  const operador = vale.operadores?.nombre_completo || "N/A";
  const capacidad = vale.vehiculos?.capacidad_m3
    ? `${vale.vehiculos.capacidad_m3} m3`
    : detalle?.capacidad_m3
      ? `${detalle.capacidad_m3} m3`
      : "N/A";
  const distancia = detalle?.distancia_km
    ? `${detalle.distancia_km} km`
    : "N/A";
  const qrUrl =
    vale.qr_verification_url ||
    `https://web-acarreos.vercel.app/vale/${vale.folio}`;
  const fechaTicket = fFecha(ticketData.fecha_impresion);
  const horaTicket = fHora(ticketData.fecha_impresion);
  const impresoPor = ticketData.persona
    ? `${ticketData.persona.nombre} ${ticketData.persona.primer_apellido}`
    : "N/A";

  return [
    {
      tipo: "texto",
      contenido: `${empresa}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: "TICKET DE MATERIAL\n",
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: `${ticketData.folio_ticket}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
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
    {
      tipo: "texto",
      contenido: `MATERIAL: ${material}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `BANCO: ${banco}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },

    {
      tipo: "texto",
      contenido: `DISTANCIA: ${distancia}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    { tipo: "separador" },
    ...(detalle?.requisicion
      ? [
          {
            tipo: "texto",
            contenido: `REQUISICION: ${String(detalle.requisicion)}\n`,
            opciones: { align: ALINEACION.IZQUIERDA, bold: true },
          },
        ]
      : []),
    {
      tipo: "texto",
      contenido: `OPERADOR:\n${operador}\n`,
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
      contenido: `IMPRESO: ${fechaTicket} ${horaTicket}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: `POR: ${impresoPor}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: "Escanear para verificar\n",
      opciones: { align: ALINEACION.CENTRO },
    },
    { tipo: "qr", contenido: qrUrl, tamano: 120 },
  ];
};

// ─── Subcomponente: item de ticket ya generado ────────────────────────────────

const TicketItem = ({ ticket, onReimprimir }) => {
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
        <Text style={styles.ticketFecha}>
          {formatFecha(ticket.fecha_impresion)}
        </Text>
        <Text style={styles.ticketPersona} numberOfLines={1}>
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

const TicketsMaterialSection = ({
  vale,
  detalle,
  totalViajes,
  operadorYVehiculoGuardados = false,
  onTotalTicketsChange,
}) => {
  const {
    tickets,
    loading,
    registrando,
    totalTickets,
    calcularPuedeImprimir,
    registrarTicket,
    reimprimirTicket,
  } = useTicketsMaterial(vale);

  useEffect(() => {
    onTotalTicketsChange?.(totalTickets);
  }, [totalTickets]);

  const [ticketPendiente, setTicketPendiente] = useState(null);
  const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);
  const [modoReimpresion, setModoReimpresion] = useState(false);

  const puedeImprimir = calcularPuedeImprimir(
    totalViajes,
    operadorYVehiculoGuardados,
  );
  const numeroSiguienteTicket = totalTickets + 1;

  const razonBloqueado = () => {
    if (!vale?.id_operador && !operadorYVehiculoGuardados)
      return "Asigna operador y vehículo primero";
    if (totalTickets > 0 && totalViajes < totalTickets)
      return `Registra el viaje ${totalTickets} para imprimir el siguiente ticket`;
    return null;
  };

  // ─── Flujo imprimir ticket ────────────────────────────────────────────────

  const handleImprimirTicket = useCallback(async () => {
    if (!puedeImprimir) {
      const razon = razonBloqueado();
      if (razon) Alert.alert("No disponible", razon);
      return;
    }

    const ticketData = await registrarTicket();
    if (!ticketData) return;

    setTicketPendiente(ticketData);
    setModoReimpresion(false);
    setMostrarModalImpresion(true);
  }, [puedeImprimir, registrarTicket]);

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
          name="ticket-outline"
          size={20}
          color={colors.secondary}
        />
        <Text style={styles.titulo}>Tickets de Material</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{totalTickets}</Text>
        </View>
      </View>

      {/* Lista de tickets */}
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

      {/* Botón imprimir ticket */}
      <TouchableOpacity
        style={[
          styles.botonImprimir,
          (!puedeImprimir || registrando) && styles.botonDeshabilitado,
        ]}
        onPress={handleImprimirTicket}
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
              color={puedeImprimir ? colors.surface : colors.textSecondary}
            />
            <Text
              style={[
                styles.botonTexto,
                !puedeImprimir && styles.botonTextoDeshabilitado,
              ]}
            >
              {totalTickets === 0
                ? "Imprimir Primer Ticket"
                : `Imprimir Ticket #${String(numeroSiguienteTicket).padStart(2, "0")}`}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Razón de bloqueo */}
      {!puedeImprimir && razonBloqueado() && (
        <Text style={styles.razonBloqueo}>{razonBloqueado()}</Text>
      )}

      {/* Modal impresión — reutilizando ModalImprimirTicketRenta */}
      <ModalImprimirTicketRenta
        visible={mostrarModalImpresion}
        valeData={vale}
        generarLineas={() => {
          if (!ticketPendiente) return [];
          return generarContenidoTicketMaterial(vale, detalle, ticketPendiente);
        }}
        resumenDatos={{
          folio: ticketPendiente?.folio_ticket,
          operador: vale?.operadores?.nombre_completo,
          placas: vale?.vehiculos?.placas,
          descripcion: `${detalle?.material?.material ?? "Material"} — ${detalle?.bancos?.banco ?? ""}`,
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
  ticketFecha: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ticketPersona: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
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
  botonImprimir: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
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
});

export default TicketsMaterialSection;
