import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { HIDE_ON_WEB } from "../../config/features";
import crossAlert from "../../utils/crossAlert";
import BotonAyuda from "../common/BotonAyuda";
import ModalRegistrarViaje from "./rentaHelpers/ModalRegistrarViaje";
import ModalImprimirTicketRenta from "./rentaHelpers/ModalImprimirTicketRenta";

const CARGA_LABEL = { 100: "100% de carga", 75: "75% de carga", 50: "50% de carga" };

const ALINEACION_TICKET = { IZQUIERDA: "left", CENTRO: "center" };

const formatearFechaTicket = (fecha) =>
  new Date(fecha).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

const formatearHoraTicket = (fecha) =>
  new Date(fecha).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/**
 * Contenido del ticket termico de un viaje de renta normal (no pipa): folio
 * por viaje (VALE-01, VALE-02...), obra, material/carga/banco de ESE viaje y
 * placas. Mismo formato que generarContenidoTicketDescarga en
 * TicketDescargaSection.js, adaptado a que el material ahora es por viaje.
 */
const generarContenidoTicketViaje = (vale, viaje) => {
  const empresa = vale?.obras?.empresas?.empresa || "CONSTRUCCION";
  const cc = vale?.obras?.cc || "";
  const nombreObra = vale?.obras?.obra || "N/A";
  const obra = cc ? `${cc}-${nombreObra}` : nombreObra;
  const material = viaje?.material?.material || "N/A";
  const carga = viaje?.carga_porcentaje ? `${viaje.carga_porcentaje}%` : "N/A";
  const banco = viaje?.banco_descarga || "N/A";
  const placas = vale?.vehiculos?.placas || "N/A";
  const folioTicket = `${vale?.folio || "N/A"}-${String(
    viaje?.numero_viaje ?? 0,
  ).padStart(2, "0")}`;
  const ahora = new Date();
  const qrUrl =
    vale?.qr_verification_url ||
    `https://web-acarreos.vercel.app/vale/${vale?.folio}`;

  return [
    {
      tipo: "texto",
      contenido: `${empresa}\n`,
      opciones: { align: ALINEACION_TICKET.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: "TICKET DE VIAJE\n",
      opciones: { align: ALINEACION_TICKET.CENTRO, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `FOLIO: ${folioTicket}\n`,
      opciones: { align: ALINEACION_TICKET.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: `${formatearFechaTicket(ahora)} ${formatearHoraTicket(ahora)}\n`,
      opciones: { align: ALINEACION_TICKET.CENTRO },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "OBRA:\n",
      opciones: { align: ALINEACION_TICKET.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `${obra}\n`,
      opciones: { align: ALINEACION_TICKET.IZQUIERDA, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `MATERIAL: ${material}\n`,
      opciones: { align: ALINEACION_TICKET.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `CARGA: ${carga}\n`,
      opciones: { align: ALINEACION_TICKET.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `PLACAS: ${placas}\n`,
      opciones: { align: ALINEACION_TICKET.IZQUIERDA },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "BANCO DE DESCARGA:\n",
      opciones: { align: ALINEACION_TICKET.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `${banco}\n`,
      opciones: { align: ALINEACION_TICKET.IZQUIERDA, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "Escanear para verificar",
      opciones: { align: ALINEACION_TICKET.CENTRO },
    },
    { tipo: "qr", contenido: qrUrl, tamano: 120 },
  ];
};

const formatHora = (isoString) => {
  if (!isoString) return "--:--";
  const fecha = new Date(isoString);
  return fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ViajeItem = ({ viaje }) => {
  const detalleMaterial = [
    viaje.material?.material,
    CARGA_LABEL[viaje.carga_porcentaje],
    viaje.banco_descarga,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.viajeItem}>
      <View style={styles.viajeIcono}>
        <MaterialCommunityIcons
          name="truck-check"
          size={16}
          color={colors.accent}
        />
      </View>
      <View style={styles.viajeInfo}>
        <Text style={styles.viajeNumero}>Viaje {viaje.numero_viaje}</Text>
        <Text style={styles.viajeHora}>{formatHora(viaje.hora_registro)}</Text>
        {!!detalleMaterial && (
          <Text style={styles.viajeMaterial}>{detalleMaterial}</Text>
        )}
      </View>
      <Text style={styles.viajePersona}>
        {viaje.persona?.nombre} {viaje.persona?.primer_apellido}
      </Text>
    </View>
  );
};

const ViajesRentaSection = ({
  vale,
  viajes,
  loading,
  registrando,
  totalViajes,
  onRegistrarViaje,
  esResidente = false,
  esChecador = false,
  onEliminarUltimoViaje,
  eliminandoViaje = false,
  totalTickets = 0,
  esMaterialDescarga = false,
  // Pipas: material fijo desde la creacion del vale (siempre Agua) — no aplica
  // el modal de categoria/subcategoria/carga, se registra directo como antes.
  esPipa = false,
  idCategoriaPlaneada = null,
  onMarcarTicketImpreso,
  // La resuelve el padre (ValeDetalleRenta) con urlAyudaVale: esta seccion no
  // recibe el vale, asi que no puede saber a que guia pertenece.
  ayudaUrl,
}) => {
  const tieneTicketPendiente = !esMaterialDescarga || totalTickets > totalViajes;
  const [mostrarModalMaterial, setMostrarModalMaterial] = useState(false);
  const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);
  const [viajeParaImprimir, setViajeParaImprimir] = useState(null);

  // Candado: no se puede registrar el viaje N+1 hasta marcar impreso el
  // ticket del viaje N (mismo candado que tenia el sistema viejo de tickets
  // de descarga, ahora guardado en la propia fila del viaje).
  const ultimoViaje = viajes[viajes.length - 1];
  const ticketViajeAnteriorPendiente =
    !esPipa && !!ultimoViaje && !ultimoViaje.ticket_impreso;

  const handlePresionarRegistrar = () => {
    if (esPipa) {
      onRegistrarViaje();
    } else {
      setMostrarModalMaterial(true);
    }
  };

  const handleConfirmarMaterial = async (idMaterial, cargaPorcentaje, bancoDescarga) => {
    const viajeCreado = await onRegistrarViaje(idMaterial, cargaPorcentaje, bancoDescarga);
    if (viajeCreado) {
      setMostrarModalMaterial(false);
      setViajeParaImprimir(viajeCreado);
      setMostrarModalImpresion(true);
    }
  };

  const handleTicketResuelto = async () => {
    if (viajeParaImprimir) {
      await onMarcarTicketImpreso?.(viajeParaImprimir.id_viaje);
    }
    setMostrarModalImpresion(false);
    setViajeParaImprimir(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="truck-fast"
          size={20}
          color={colors.secondary}
        />
        <Text style={styles.titulo}>Viajes Registrados</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{totalViajes}</Text>
        </View>
        <BotonAyuda url={ayudaUrl} />
      </View>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loader}
        />
      ) : (
        <>
          {viajes.length === 0 ? (
            <View style={styles.sinViajes}>
              <MaterialCommunityIcons
                name="truck-outline"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={styles.sinViajesTexto}>Sin viajes registrados</Text>
            </View>
          ) : (
            <View style={styles.lista}>
              {viajes.map((viaje) => (
                <ViajeItem key={viaje.id_viaje} viaje={viaje} />
              ))}
            </View>
          )}

          {(esResidente || esChecador) && totalViajes > 0 && (
            <TouchableOpacity
              style={[styles.botonEliminarViaje, eliminandoViaje && styles.botonDeshabilitado]}
              onPress={() => {
                const ultimoViaje = viajes[viajes.length - 1];
                crossAlert(
                  "Eliminar Viaje",
                  `¿Eliminar el Viaje #${totalViajes}? Esta accion no se puede deshacer.`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar",
                      style: "destructive",
                      onPress: () => onEliminarUltimoViaje?.(ultimoViaje.id_viaje),
                    },
                  ],
                );
              }}
              disabled={eliminandoViaje}
              activeOpacity={0.7}
            >
              {eliminandoViaje ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="delete-circle-outline"
                    size={18}
                    color={colors.danger}
                  />
                  <Text style={styles.botonEliminarViajeTexto}>
                    Eliminar Viaje #{totalViajes}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Registrar viaje — fuera de alcance en web */}
          {!HIDE_ON_WEB && (
            <>
              <TouchableOpacity
                style={[
                  styles.botonRegistrar,
                  (!tieneTicketPendiente || registrando || ticketViajeAnteriorPendiente) &&
                    styles.botonDeshabilitado,
                ]}
                onPress={handlePresionarRegistrar}
                disabled={!tieneTicketPendiente || registrando || ticketViajeAnteriorPendiente}
                activeOpacity={0.8}
              >
                {registrando ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="plus-circle"
                      size={20}
                      color={
                        tieneTicketPendiente && !ticketViajeAnteriorPendiente
                          ? colors.surface
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.botonTexto,
                        (!tieneTicketPendiente || ticketViajeAnteriorPendiente) &&
                          styles.botonTextoDeshabilitado,
                      ]}
                    >
                      {totalViajes === 0
                        ? "Registrar Primer Viaje"
                        : `Registrar Viaje ${totalViajes + 1}`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {esMaterialDescarga && !tieneTicketPendiente && (
                <Text style={styles.avisoTicket}>
                  Imprime el ticket antes de registrar el siguiente viaje
                </Text>
              )}
              {ticketViajeAnteriorPendiente && (
                <Text style={styles.avisoTicket}>
                  Imprime el ticket del Viaje {totalViajes} antes de registrar
                  el siguiente
                </Text>
              )}
            </>
          )}
        </>
      )}

      {!esPipa && (
        <>
          <ModalRegistrarViaje
            visible={mostrarModalMaterial}
            onClose={() => setMostrarModalMaterial(false)}
            numeroViaje={totalViajes + 1}
            idObra={vale?.id_obra}
            idCategoriaPlaneada={idCategoriaPlaneada}
            registrando={registrando}
            onConfirmar={handleConfirmarMaterial}
          />
          <ModalImprimirTicketRenta
            visible={mostrarModalImpresion}
            valeData={vale}
            generarLineas={() => generarContenidoTicketViaje(vale, viajeParaImprimir)}
            resumenDatos={{
              folio: `${vale?.folio || "N/A"}-${String(
                viajeParaImprimir?.numero_viaje ?? 0,
              ).padStart(2, "0")}`,
              operador: vale?.operadores?.nombre_completo,
              placas: vale?.vehiculos?.placas,
              descripcion: [
                viajeParaImprimir?.material?.material,
                CARGA_LABEL[viajeParaImprimir?.carga_porcentaje],
                viajeParaImprimir?.banco_descarga,
              ]
                .filter(Boolean)
                .join(" · "),
            }}
            onImpreso={handleTicketResuelto}
            onSinImpresora={handleTicketResuelto}
          />
        </>
      )}
    </View>
  );
};

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
  sinViajes: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  sinViajesTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  lista: {
    marginBottom: 12,
    gap: 6,
  },
  viajeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  viajeIcono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  viajeInfo: {
    flex: 1,
  },
  viajeNumero: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  viajeHora: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  viajeMaterial: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: "600",
    marginTop: 2,
  },
  viajePersona: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 110,
    textAlign: "right",
  },
  botonRegistrar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
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
  avisoTicket: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  botonEliminarViaje: {
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
  botonEliminarViajeTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
});

export default ViajesRentaSection;
