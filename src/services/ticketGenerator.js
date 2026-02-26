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

/**
 * Genera líneas del ticket de vale de RENTA
 * @param {object} vale - Datos completos del vale
 * @returns {Array} - Array de líneas para imprimirTicket()
 */
export const generarTicketRenta = (vale) => {
  const detalle = vale?.vale_renta_detalle?.[0] || {};
  const cc = vale.obras?.cc || "";
  const nombreObra = vale.obras?.obra || "N/A";
  const obra = cc ? `${cc}-${nombreObra}` : nombreObra;
  const empresa = vale.obras?.empresas?.empresa || "CONSTRUCCION";
  const operador = vale.operadores?.nombre_completo || "N/A";
  const placas = vale.vehiculos?.placas || "N/A";
  const sindicato = vale.vehiculos?.sindicatos?.sindicato || "N/A";
  const material = detalle.material?.material || "N/A";
  const capacidad = detalle.capacidad_m3 ? `${detalle.capacidad_m3} m3` : "N/A";
  const notas = detalle.notas_adicionales || null;

  const esRentaPorDia = detalle.es_renta_por_dia === true;
  const esRentaPorMedioDia = detalle.total_dias === 0.5;

  const horaInicio = detalle.hora_inicio
    ? formatearHora(detalle.hora_inicio)
    : "N/A";
  const horaFin = esRentaPorDia
    ? "Dia completo"
    : esRentaPorMedioDia
      ? "Medio dia"
      : detalle.hora_fin
        ? formatearHora(detalle.hora_fin)
        : "Pendiente";

  const totalHoras =
    esRentaPorDia || esRentaPorMedioDia
      ? null
      : detalle.total_horas
        ? `${detalle.total_horas} hrs`
        : null;

  const totalDias = esRentaPorDia
    ? "1 dia"
    : esRentaPorMedioDia
      ? "0.5 dias"
      : null;

  const fecha = formatearFecha(vale.fecha_creacion);
  const hora = formatearHora(vale.fecha_creacion);
  const estado = traducirEstado(vale.estado);
  const folio = vale.folio || "N/A";
  const qrUrl =
    vale.qr_verification_url || `https://web-acarreos.vercel.app/vale/${folio}`;

  const lineas = [
    // Encabezado
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
      contenido: "VALE DE RENTA\n",
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
    // Obra
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
      contenido: `SINDICATO: ${sindicato}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    {
      tipo: "texto",
      contenido: `${SEPARADOR}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    // Horas
    {
      tipo: "texto",
      contenido: `HORA INICIO: ${horaInicio}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
    {
      tipo: "texto",
      contenido: `HORA FIN: ${horaFin}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
  ];

  // Total horas o días según tipo
  if (totalHoras) {
    lineas.push({
      tipo: "texto",
      contenido: `TOTAL HORAS: ${totalHoras}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    });
  }

  if (totalDias) {
    lineas.push({
      tipo: "texto",
      contenido: `TOTAL DIAS: ${totalDias}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    });
  }

  lineas.push(
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
  );

  // Notas solo si existen
  if (notas) {
    lineas.push(
      {
        tipo: "texto",
        contenido: `${SEPARADOR}\n`,
        opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
      },
      {
        tipo: "texto",
        contenido: `NOTAS:\n${notas}\n`,
        opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
      },
    );
  }

  // QR
  lineas.push(
    {
      tipo: "texto",
      contenido: `${SEPARADOR}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, fonttype: 0 },
    },
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
  );

  return lineas;
};
