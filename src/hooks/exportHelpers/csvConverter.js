/**
 * hooks/exportHelpers/csvConverter.js
 *
 * FUNCIONES PARA CONVERSIÓN A CSV
 * - Escape de caracteres especiales
 * - Conversión de arrays a CSV
 * - Transformación de datos de vales
 */

import {
  getWeekNumber,
  formatDateOnly,
  formatDateTimeForCSV,
} from "../../utils/dateUtils";

/**
 * Escapa caracteres especiales para CSV
 */
export const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Convierte array de objetos a formato CSV
 */
export const convertToCSV = (data, headers) => {
  const headerRow = headers.map((h) => escapeCsvValue(h.label)).join(",");

  const dataRows = data.map((row) => {
    return headers.map((h) => escapeCsvValue(row[h.key])).join(",");
  });

  const csvContent = [headerRow, ...dataRows].join("\n");

  return csvContent;
};

/**
 * Construye nombre completo de persona
 * Exportado para reuso en historialConverter.js
 */
export const getNombreCompleto = (persona) => {
  if (!persona) return "-";
  return `${persona.nombre} ${persona.primer_apellido} ${
    persona.segundo_apellido || ""
  }`.trim();
};

/**
 * Formatea fecha y hora completa para CSV
 * Exportado para reuso en historialConverter.js
 */
export const formatFechaHoraCompleta = (fechaISO) => {
  if (!fechaISO) return "-";
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const año = fecha.getFullYear();
  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${año} ${horas}:${minutos}`;
};

/**
 * Genera URL del QR para verificación
 * Exportado para reuso en historialConverter.js
 */
export const generarUrlQR = (folio) => {
  if (!folio) return "-";
  return `https://web-acarreos.vercel.app/vale/${folio}`;
};

/**
 * Transforma datos de vales de material a formato CSV
 */
export const transformMaterialData = (vales) => {
  return vales.map((vale, index) => {
    const detalle = vale.vale_material_detalles?.[0] || {};
    const weekNum = getWeekNumber(new Date(vale.fecha_creacion));

    return {
      folio: vale.folio || "-",
      fecha: formatDateOnly(vale.fecha_creacion),
      semana: `Semana ${weekNum}`,
      estado: vale.estado || "-",
      obra: vale.obras?.obra || "-",
      residente: getNombreCompleto(vale.persona),
      operador: getNombreCompleto(vale.operadores),
      placas: vale.vehiculos?.placas || "-",
      material: detalle.material?.material || "-",
      banco: detalle.bancos?.banco || "-",
      requisicion: detalle.requisicion || "-",
      folio_vale_fisico: detalle.folio_vale_fisico || "-",
      capacidad: detalle.capacidad_m3 || "0",
      distancia: detalle.distancia_km || "0",
      cantidad_pedida: detalle.cantidad_pedida_m3 || "0",
      volumen_real: detalle.volumen_real_m3 || "0",
      peso: detalle.peso_ton || "0",
      precio_m3: detalle.precio_m3 || "0",
      costo_total: detalle.costo_total || "0",
      creado_por: getNombreCompleto(vale.persona),
      fecha_creacion: formatFechaHoraCompleta(vale.fecha_creacion),
      completado_por: getNombreCompleto(vale.persona_completador),
      fecha_completado: formatFechaHoraCompleta(vale.fecha_completado),
      notas: detalle.notas_adicionales || "-",
      link_qr: generarUrlQR(vale.folio),
    };
  });
};

/**
 * Transforma datos de vales de renta a formato CSV
 */
export const transformRentaData = (vales) => {
  return vales.map((vale, index) => {
    const detalle = vale.vale_renta_detalle?.[0] || {};
    const weekNum = getWeekNumber(new Date(vale.fecha_creacion));

    return {
      folio: vale.folio || "-",
      fecha: formatDateOnly(vale.fecha_creacion),
      semana: `Semana ${weekNum}`,
      estado: vale.estado || "-",
      obra: vale.obras?.obra || "-",
      residente: getNombreCompleto(vale.persona),
      operador: getNombreCompleto(vale.operadores),
      placas: vale.vehiculos?.placas || "-",
      material_movido: detalle.material?.material || "-",
      tipo_renta: detalle.es_renta_por_dia ? "Por dia" : "Por hora",
      hora_inicio: detalle.hora_inicio
        ? formatDateTimeForCSV(detalle.hora_inicio)
        : "-",
      hora_fin: detalle.hora_fin ? formatDateTimeForCSV(detalle.hora_fin) : "-",
      total_horas: detalle.total_horas || "0",
      total_dias: detalle.total_dias || "0",
      tarifa_hora: detalle.precios_renta?.costo_hr || "0",
      tarifa_dia: detalle.precios_renta?.costo_dia || "0",
      costo_total: detalle.costo_total || "0",
      creado_por: getNombreCompleto(vale.persona),
      fecha_creacion: formatFechaHoraCompleta(vale.fecha_creacion),
      completado_por: getNombreCompleto(vale.persona_completador),
      fecha_completado: formatFechaHoraCompleta(vale.fecha_completado),
      notas: detalle.notas_adicionales || "-",
      link_qr: generarUrlQR(vale.folio),
    };
  });
};

/**
 * Headers para exportación de vales de material
 */
export const MATERIAL_HEADERS = [
  { key: "folio", label: "Folio" },
  { key: "fecha", label: "Fecha" },
  { key: "semana", label: "Semana" },
  { key: "estado", label: "Estado" },
  { key: "obra", label: "Obra" },
  { key: "residente", label: "Residente" },
  { key: "operador", label: "Operador" },
  { key: "placas", label: "Placas" },
  { key: "material", label: "Material" },
  { key: "banco", label: "Banco" },
  { key: "requisicion", label: "Requisición" },
  { key: "folio_vale_fisico", label: "Vale Físico" },
  { key: "capacidad", label: "Capacidad (m3)" },
  { key: "distancia", label: "Distancia (km)" },
  { key: "cantidad_pedida", label: "Cantidad Pedida (m3)" },
  { key: "volumen_real", label: "Volumen Real (m3)" },
  { key: "peso", label: "Peso (ton)" },
  { key: "precio_m3", label: "Precio por m3" },
  { key: "costo_total", label: "Costo Total" },
  { key: "creado_por", label: "Creado Por" },
  { key: "fecha_creacion", label: "Fecha Creación" },
  { key: "completado_por", label: "Completado Por" },
  { key: "fecha_completado", label: "Fecha Completado" },
  { key: "notas", label: "Notas" },
  { key: "link_qr", label: "Link QR" },
];

/**
 * Headers para exportación de vales de renta
 */
export const RENTA_HEADERS = [
  { key: "folio", label: "Folio" },
  { key: "fecha", label: "Fecha" },
  { key: "semana", label: "Semana" },
  { key: "estado", label: "Estado" },
  { key: "obra", label: "Obra" },
  { key: "residente", label: "Residente" },
  { key: "operador", label: "Operador" },
  { key: "placas", label: "Placas" },
  { key: "material_movido", label: "Material Movido" },
  { key: "tipo_renta", label: "Tipo de Renta" },
  { key: "hora_inicio", label: "Hora Inicio" },
  { key: "hora_fin", label: "Hora Fin" },
  { key: "total_horas", label: "Total Horas" },
  { key: "total_dias", label: "Total Dias" },
  { key: "tarifa_hora", label: "Tarifa por Hora" },
  { key: "tarifa_dia", label: "Tarifa por Dia" },
  { key: "costo_total", label: "Costo Total" },
  { key: "creado_por", label: "Creado Por" },
  { key: "fecha_creacion", label: "Fecha Creación" },
  { key: "completado_por", label: "Completado Por" },
  { key: "fecha_completado", label: "Fecha Completado" },
  { key: "notas", label: "Notas" },
  { key: "link_qr", label: "Link QR" },
];

/**
 * Headers para exportación de tickets de descarga
 */
export const TICKETS_HEADERS = [
  { key: "folio_ticket", label: "Folio Ticket" },
  { key: "numero_ticket", label: "Numero Ticket" },
  { key: "banco_descarga", label: "Banco de Descarga" },
  { key: "fecha_impresion", label: "Fecha Impresion" },
  { key: "folio_vale", label: "Folio Vale" },
  { key: "fecha_vale", label: "Fecha Vale" },
  { key: "semana", label: "Semana" },
  { key: "estado_vale", label: "Estado Vale" },
  { key: "obra", label: "Obra" },
  { key: "material", label: "Material" },
  { key: "operador", label: "Operador" },
  { key: "placas", label: "Placas" },
  { key: "residente", label: "Residente" },
  { key: "registrado_por", label: "Registrado Por" },
];

/**
 * Transforma datos de tickets de descarga a formato CSV
 */
export const transformTicketsData = (tickets) => {
  return tickets.map((ticket) => {
    const vale = ticket.vales || {};
    const detalle = vale.vale_renta_detalle?.[0] || {};
    const weekNum = vale.fecha_creacion
      ? getWeekNumber(new Date(vale.fecha_creacion))
      : "-";

    return {
      folio_ticket: ticket.folio_ticket || "-",
      numero_ticket: ticket.numero_ticket || "-",
      banco_descarga: ticket.banco_descarga || "-",
      fecha_impresion: formatFechaHoraCompleta(ticket.fecha_impresion),
      folio_vale: vale.folio || "-",
      fecha_vale: formatDateOnly(vale.fecha_creacion),
      semana: weekNum !== "-" ? `Semana ${weekNum}` : "-",
      estado_vale: vale.estado || "-",
      obra: vale.obras?.obra || "-",
      material: detalle.material?.material || "-",
      operador: getNombreCompleto(vale.operadores),
      placas: vale.vehiculos?.placas || "-",
      residente: getNombreCompleto(vale.persona),
      registrado_por: getNombreCompleto(ticket.persona_registro),
    };
  });
};
/**
 * Headers para exportación de viajes de material
 */
export const VIAJES_MATERIAL_HEADERS = [
  { key: "folio_vale", label: "Folio Vale" },
  { key: "fecha_vale", label: "Fecha Vale" },
  { key: "semana", label: "Semana" },
  { key: "estado", label: "Estado" },
  { key: "obra", label: "Obra" },
  { key: "operador", label: "Operador" },
  { key: "placas", label: "Placas" },
  { key: "material", label: "Material" },
  { key: "banco", label: "Banco" },
  { key: "distancia_km", label: "Distancia (km)" },
  { key: "capacidad_m3", label: "Capacidad (m3)" },
  { key: "requisicion", label: "Requisicion" },
  { key: "numero_viaje", label: "Num. Viaje" },
  { key: "folio_viaje", label: "Folio Viaje" },
  { key: "hora_registro", label: "Hora Registro" },
  { key: "volumen_m3", label: "Volumen (m3)" },
  { key: "peso_ton", label: "Peso (ton)" },
  { key: "precio_m3", label: "Precio por m3" },
  { key: "costo_viaje", label: "Costo Viaje" },
  { key: "folio_vale_fisico", label: "Vale Fisico" },
  { key: "registrado_por", label: "Registrado Por" },
  { key: "residente", label: "Residente" },
];

/**
 * Headers para exportación de viajes de renta
 */
export const VIAJES_RENTA_HEADERS = [
  { key: "folio_vale", label: "Folio Vale" },
  { key: "fecha_vale", label: "Fecha Vale" },
  { key: "semana", label: "Semana" },
  { key: "estado", label: "Estado" },
  { key: "obra", label: "Obra" },
  { key: "operador", label: "Operador" },
  { key: "placas", label: "Placas" },
  { key: "material", label: "Material Movido" },
  { key: "tipo_renta", label: "Tipo Renta" },
  { key: "hora_inicio_vale", label: "Hora Inicio Vale" },
  { key: "numero_viaje", label: "Num. Viaje" },
  { key: "hora_registro", label: "Hora Registro Viaje" },
  { key: "registrado_por", label: "Registrado Por" },
  { key: "residente", label: "Residente" },
];

/**
 * Transforma viajes de material a formato CSV
 */
export const transformViajesMaterialData = (viajes) => {
  return viajes.map((item) => {
    const { vale, detalle } = item;
    const weekNum = vale?.fecha_creacion
      ? getWeekNumber(new Date(vale.fecha_creacion))
      : "-";

    return {
      folio_vale: vale?.folio || "-",
      fecha_vale: formatDateOnly(vale?.fecha_creacion),
      semana: weekNum !== "-" ? `Semana ${weekNum}` : "-",
      estado: vale?.estado || "-",
      obra: vale?.obras?.obra || "-",
      operador: getNombreCompleto(vale?.operadores),
      placas: vale?.vehiculos?.placas || "-",
      material: detalle?.material?.material || "-",
      banco: detalle?.bancos?.banco || "-",
      distancia_km: detalle?.distancia_km || "0",
      capacidad_m3: detalle?.capacidad_m3 || "0",
      requisicion: detalle?.requisicion || "-",
      numero_viaje: item.numero_viaje || "-",
      folio_viaje:
        vale?.folio && item.numero_viaje
          ? `${vale.folio}-${String(item.numero_viaje).padStart(2, "0")}`
          : "-",
      hora_registro: formatFechaHoraCompleta(item.hora_registro),
      volumen_m3: item.volumen_m3 || "0",
      peso_ton: item.peso_ton || "0",
      precio_m3: item.precio_m3 || "0",
      costo_viaje: item.costo_viaje || "0",
      folio_vale_fisico: item.folio_vale_fisico || "-",
      registrado_por: getNombreCompleto(item.persona),
      residente: getNombreCompleto(vale?.persona),
    };
  });
};

/**
 * Transforma viajes de renta a formato CSV
 */
export const transformViajesRentaData = (viajes) => {
  return viajes.map((item) => {
    const { vale, detalle } = item;
    const weekNum = vale?.fecha_creacion
      ? getWeekNumber(new Date(vale.fecha_creacion))
      : "-";

    return {
      folio_vale: vale?.folio || "-",
      fecha_vale: formatDateOnly(vale?.fecha_creacion),
      semana: weekNum !== "-" ? `Semana ${weekNum}` : "-",
      estado: vale?.estado || "-",
      obra: vale?.obras?.obra || "-",
      operador: getNombreCompleto(vale?.operadores),
      placas: vale?.vehiculos?.placas || "-",
      material: detalle?.material?.material || "-",
      tipo_renta: detalle?.es_renta_por_dia ? "Por dia" : "Por hora",
      hora_inicio_vale: detalle?.hora_inicio
        ? formatFechaHoraCompleta(detalle.hora_inicio)
        : "-",
      numero_viaje: item.numero_viaje || "-",
      hora_registro: formatFechaHoraCompleta(item.hora_registro),
      registrado_por: getNombreCompleto(item.persona),
      residente: getNombreCompleto(vale?.persona),
    };
  });
};
