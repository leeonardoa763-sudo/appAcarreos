/**
 * services/ticketGenerator.js
 *
 * Genera el contenido del ticket en formato ESC/POS
 * para impresoras térmicas de 48mm
 *
 * PROPÓSITO:
 * - Formatear datos del vale para impresión física
 * - Generar líneas de texto con formato ESC/POS
 * - Compatible con impresoras de 48mm (384 dots)
 */

import { BluetoothEscposPrinter } from "@vardrz/react-native-bluetooth-escpos-printer";

const ALINEACION = {
  IZQUIERDA: BluetoothEscposPrinter.PRINTER_ALIGN.LEFT,
  CENTRO: BluetoothEscposPrinter.PRINTER_ALIGN.CENTER,
  DERECHA: BluetoothEscposPrinter.PRINTER_ALIGN.RIGHT,
};

const SEPARADOR = "--------------------------------";

/**
 * Formatea fecha legible
 */
const formatearFecha = (fecha) => {
  if (!fecha) return "N/A";
  const date = new Date(fecha);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

/**
 * Formatea hora legible
 */
const formatearHora = (fecha) => {
  if (!fecha) return "";
  const date = new Date(fecha);
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/**
 * Traduce estado del vale a texto legible
 */
const traducirEstado = (estado) => {
  const estados = {
    en_proceso: "EN PROCESO",
    emitido: "EMITIDO",
    verificado: "VERIFICADO",
    conciliado: "CONCILIADO",
    archivado: "ARCHIVADO",
  };
  return estados[estado] || estado?.toUpperCase() || "N/A";
};

/**
 * Genera líneas del ticket de vale de MATERIAL
 * @param {object} vale - Datos completos del vale
 * @returns {Array} - Array de líneas para imprimirTicket()
 */
export const generarTicketMaterial = (vale) => {
  const detalle = vale?.vale_material_detalles?.[0] || {};
  const cc = vale.obras?.cc || "";
  const nombreObra = vale.obras?.obra || "N/A";
  const obra = cc ? `${cc}-${nombreObra}` : nombreObra;
  const empresa = vale.obras?.empresas?.empresa || "CONSTRUCCION";
  const operador = vale.operadores?.nombre_completo || "N/A";
  const placas = vale.vehiculos?.placas || "N/A";
  const material = detalle.material?.material || "N/A";
  const banco = detalle.bancos?.banco || "N/A";
  const capacidad = detalle.capacidad_m3 ? `${detalle.capacidad_m3} m3` : "N/A";
  const cantidad = detalle.cantidad_pedida_m3
    ? `${detalle.cantidad_pedida_m3} m3`
    : "N/A";
  const distancia = detalle.distancia_km ? `${detalle.distancia_km} km` : "N/A";
  const fecha = formatearFecha(vale.fecha_creacion);
  const hora = formatearHora(vale.fecha_creacion);
  const estado = traducirEstado(vale.estado);
  const folio = vale.folio || "N/A";
  const qrUrl =
    vale.qr_verification_url || `https://web-acarreos.vercel.app/vale/${folio}`;

  return [
    // Encabezado empresa
    {
      tipo: "texto",
      contenido: `${empresa}\n`,
      opciones: {
        align: ALINEACION.CENTRO,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1,
      },
    },
    {
      tipo: "texto",
      contenido: "VALE DE MATERIAL\n",
      opciones: {
        align: ALINEACION.CENTRO,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1,
      },
    },
    {
      tipo: "texto",
      contenido: `${folio}\n`,
      opciones: {
        align: ALINEACION.CENTRO,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1,
      },
    },
    {
      tipo: "texto",
      contenido: `${fecha} ${hora}\n`,
      opciones: { align: ALINEACION.CENTRO, fonttype: 0 },
    },
    // Estado
    {
      tipo: "texto",
      contenido: `ESTADO: ${estado}\n`,
      opciones: { align: ALINEACION.CENTRO, fonttype: 1 },
    },
    {
      tipo: "texto",
      contenido: `${SEPARADOR}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    // Obra y banco
    {
      tipo: "texto",
      contenido: `OBRA:\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    {
      tipo: "texto",
      contenido: `${obra}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 1 },
    },
    {
      tipo: "texto",
      contenido: `BANCO: ${banco}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 1 },
    },
    {
      tipo: "texto",
      contenido: `${SEPARADOR}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    // Material
    {
      tipo: "texto",
      contenido: `MATERIAL: ${material}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 1 },
    },
    {
      tipo: "texto",
      contenido: `CAPACIDAD: ${capacidad}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    {
      tipo: "texto",
      contenido: `DISTANCIA: ${distancia}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    {
      tipo: "texto",
      contenido: `CANTIDAD: ${cantidad}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    {
      tipo: "texto",
      contenido: `${SEPARADOR}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    // Operador
    {
      tipo: "texto",
      contenido: `OPERADOR:\n${operador}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 1 },
    },
    {
      tipo: "texto",
      contenido: `PLACAS: ${placas}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    {
      tipo: "texto",
      contenido: `${SEPARADOR}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    // QR
    {
      tipo: "texto",
      contenido: "Escanear para verificar\n",
      opciones: { align: ALINEACION.CENTRO, fonttype: 0 },
    },
    {
      tipo: "qr",
      contenido: qrUrl,
      tamano: 120,
    },
    {
      tipo: "texto",
      contenido: `${folio}\n`,
      opciones: { align: ALINEACION.CENTRO, fonttype: 0 },
    },
  ];
};
