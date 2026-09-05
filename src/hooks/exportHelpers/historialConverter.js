/**
 * hooks/exportHelpers/historialConverter.js
 *
 * TRANSFORMACION A CSV DEL HISTORIAL DE VALES
 *
 * Una sola tabla para material, renta y pipas: una fila por viaje registrado,
 * con la columna "Tipo Vale" para distinguirlas. El CSV se arma con el
 * convertToCSV de csvConverter.js — aqui solo se define la forma de la fila.
 *
 * SIN CELDAS VACIAS: toda columna que no aplique al tipo de la fila cae en "-"
 * (texto) o "0" (numerico), nunca en blanco. Misma convencion que csvConverter.
 */

import {
  getNombreCompleto,
  formatFechaHoraCompleta,
  generarUrlQR,
} from "./csvConverter";
import { getWeekNumber, formatDateOnly } from "../../utils/dateUtils";
import {
  TIPOS_HISTORIAL,
  resolverBancoNombre,
  resolverSindicatoNombre,
} from "./historialQueries";
import { tarifaRentaEfectiva } from "../../utils/preciosRenta";
import {
  MOTIVOS_ANTICIPADO,
  MOTIVOS_SIN_FOTO,
  etiquetaMotivo,
} from "../../utils/tiempoEntreViajes";

/** Texto: "-" cuando no hay dato. */
const txt = (valor) =>
  valor === null || valor === undefined || valor === "" ? "-" : String(valor);

/** Numerico: "0" cuando no hay dato. Un 0 real se conserva. */
const num = (valor) =>
  valor === null || valor === undefined || valor === "" ? "0" : String(valor);

/** Motivo de excepcion en una sola celda: etiqueta del codigo + texto libre. */
const motivoLegible = (motivos, codigo, texto) => {
  if (!codigo) return "-";
  const label = etiquetaMotivo(motivos, codigo);
  return texto ? `${label}: ${texto}` : label;
};

const ETIQUETA_TIPO = {
  [TIPOS_HISTORIAL.MATERIAL]: "Material",
  [TIPOS_HISTORIAL.RENTA]: "Renta",
  [TIPOS_HISTORIAL.PIPAS]: "Pipa de Agua",
};

const ETIQUETA_ESTADO = {
  borrador: "Borrador",
  en_proceso: "En proceso",
  emitido: "Emitido",
  verificado: "Verificado",
  conciliado: "Conciliado",
  cancelado: "Cancelado",
};

export const HISTORIAL_HEADERS = [
  // Identificacion
  { key: "tipo_vale", label: "Tipo Vale" },
  { key: "folio_vale", label: "Folio Vale" },
  { key: "numero_viaje", label: "Num. Viaje" },
  { key: "folio_viaje", label: "Folio Viaje" },
  // Vale
  { key: "estado", label: "Estado" },
  { key: "obra", label: "Obra" },
  { key: "cc", label: "CC" },
  { key: "empresa", label: "Empresa" },
  { key: "requisicion", label: "Requisicion" },
  { key: "folio_vale_fisico", label: "Vale Fisico (Vale)" },
  // Fechas
  { key: "fecha_creacion", label: "Fecha Creacion" },
  { key: "semana", label: "Semana" },
  { key: "fecha_programada", label: "Fecha Programada" },
  { key: "fecha_completado", label: "Fecha Completado" },
  // Autorizaciones
  { key: "creado_por", label: "Creado Por" },
  { key: "completado_por", label: "Completado Por" },
  { key: "verificado_sindicato", label: "Verificado Sindicato" },
  { key: "fecha_verificacion", label: "Fecha Verificacion" },
  // Cancelacion
  { key: "fecha_cancelacion", label: "Fecha Cancelacion" },
  { key: "motivo_cancelacion", label: "Motivo Cancelacion" },
  // Unidad
  { key: "operador", label: "Operador" },
  { key: "placas", label: "Placas" },
  { key: "sindicato", label: "Sindicato" },
  { key: "capacidad_m3", label: "Capacidad (m3)" },
  // Material
  { key: "material", label: "Material" },
  { key: "banco", label: "Banco" },
  { key: "distancia_km", label: "Distancia (km)" },
  // Viaje
  { key: "hora_registro", label: "Hora Registro Viaje" },
  { key: "registrado_por", label: "Registrado Por" },
  { key: "volumen_m3", label: "Volumen Viaje (m3)" },
  { key: "peso_ton", label: "Peso Viaje (ton)" },
  { key: "precio_m3", label: "Precio por m3" },
  { key: "costo_viaje", label: "Costo Viaje" },
  { key: "folio_vale_fisico_viaje", label: "Vale Fisico (Viaje)" },
  // Excepciones (solo material: la restriccion de tiempo no aplica a renta)
  { key: "registro_anticipado", label: "Registro Anticipado" },
  { key: "minutos_minimos", label: "Min. Minimos Calculados" },
  { key: "minutos_faltantes", label: "Min. Faltantes al Registrar" },
  { key: "motivo_anticipado", label: "Motivo Registro Anticipado" },
  { key: "sin_foto", label: "Sin Foto Evidencia" },
  { key: "motivo_sin_foto", label: "Motivo Sin Foto" },
  // Renta
  { key: "tipo_renta", label: "Tipo Renta" },
  { key: "hora_inicio", label: "Hora Inicio" },
  { key: "hora_fin", label: "Hora Fin" },
  { key: "total_horas", label: "Total Horas" },
  { key: "total_dias", label: "Total Dias" },
  { key: "tarifa_hora", label: "Tarifa por Hora" },
  { key: "tarifa_dia", label: "Tarifa por Dia" },
  { key: "carga_porcentaje", label: "Carga Viaje (%)" },
  // Cierre
  { key: "costo_total_vale", label: "Costo Total Vale" },
  { key: "notas", label: "Notas" },
  { key: "link_qr", label: "Link QR" },
];

/**
 * Transforma las filas aplanadas de fetchViajesHistorial a filas de CSV.
 *
 * @param {Array<{tipo, vale, detalle, viaje}>} filas
 * @returns {Array<Object>}
 */
export const transformHistorialData = (filas) => {
  return filas.map(({ tipo, vale, detalle, viaje }) => {
    const esMaterial = tipo === TIPOS_HISTORIAL.MATERIAL;

    const semana = vale.fecha_creacion
      ? `Semana ${getWeekNumber(new Date(vale.fecha_creacion))}`
      : "-";

    // Vales tipo 3: cada viaje puede sobreescribir banco, distancia, precio y
    // costo del detalle. Se usa ?? y no || para no convertir un 0 real en el
    // valor de respaldo.
    const distanciaKm = esMaterial
      ? (viaje.distancia_km_override ?? detalle.distancia_km)
      : null;
    const precioM3 = esMaterial
      ? (viaje.precio_m3_override ?? viaje.precio_m3)
      : null;
    const costoViaje = esMaterial
      ? (viaje.costo_viaje_override ?? viaje.costo_viaje)
      : null;

    return {
      tipo_vale: ETIQUETA_TIPO[tipo] || "-",
      folio_vale: txt(vale.folio),
      numero_viaje: num(viaje.numero_viaje),
      folio_viaje:
        vale.folio && viaje.numero_viaje
          ? `${vale.folio}-${String(viaje.numero_viaje).padStart(2, "0")}`
          : "-",

      estado: ETIQUETA_ESTADO[vale.estado] || txt(vale.estado),
      obra: txt(vale.obras?.obra),
      cc: txt(vale.obras?.cc),
      empresa: txt(vale.obras?.empresas?.empresa),
      requisicion: esMaterial ? txt(detalle.requisicion) : "-",
      folio_vale_fisico: esMaterial ? txt(detalle.folio_vale_fisico) : "-",

      fecha_creacion: formatFechaHoraCompleta(vale.fecha_creacion),
      semana,
      fecha_programada: vale.fecha_programada
        ? formatDateOnly(vale.fecha_programada)
        : "-",
      fecha_completado: formatFechaHoraCompleta(vale.fecha_completado),

      creado_por: getNombreCompleto(vale.persona),
      completado_por: getNombreCompleto(vale.persona_completador),
      verificado_sindicato: vale.verificado_por_sindicato ? "Si" : "No",
      fecha_verificacion: formatFechaHoraCompleta(vale.fecha_verificacion),

      fecha_cancelacion: formatFechaHoraCompleta(vale.fecha_cancelacion),
      motivo_cancelacion: txt(vale.motivo_cancelacion),

      // nombre_completo es columna generada en la BD; no aplica getNombreCompleto
      operador: txt(vale.operadores?.nombre_completo),
      placas: txt(vale.vehiculos?.placas),
      sindicato: txt(resolverSindicatoNombre(vale, detalle)),
      capacidad_m3: num(detalle.capacidad_m3 ?? vale.vehiculos?.capacidad_m3),

      // Renta normal declara el material por viaje; material/pipas/vales viejos
      // lo siguen resolviendo desde el detalle.
      material: txt(viaje.material?.material ?? detalle.material?.material),
      // Renta normal captura banco de descarga por viaje (las 4 categorias
      // nuevas lo piden); pipas no tienen este concepto (usan pozo, en otra
      // tabla que este select no trae).
      banco: esMaterial
        ? txt(resolverBancoNombre(detalle, viaje))
        : tipo === TIPOS_HISTORIAL.RENTA
          ? txt(viaje.banco_descarga)
          : "-",
      distancia_km: esMaterial ? num(distanciaKm) : "0",

      hora_registro: formatFechaHoraCompleta(viaje.hora_registro),
      registrado_por: getNombreCompleto(viaje.persona),
      volumen_m3: esMaterial ? num(viaje.volumen_m3) : "0",
      peso_ton: esMaterial ? num(viaje.peso_ton) : "0",
      precio_m3: esMaterial ? num(precioM3) : "0",
      costo_viaje: esMaterial ? num(costoViaje) : "0",
      folio_vale_fisico_viaje: esMaterial
        ? txt(viaje.folio_vale_fisico)
        : "-",

      // La restriccion de tiempo solo existe en material; en renta y pipas
      // estas columnas quedan en "-" / "0" por diseno, no por falta de dato.
      registro_anticipado:
        esMaterial && viaje.registro_anticipado ? "Si" : "No",
      minutos_minimos: esMaterial ? num(viaje.minutos_minimos_calculados) : "0",
      minutos_faltantes: esMaterial
        ? num(viaje.minutos_faltantes_anticipado)
        : "0",
      motivo_anticipado: esMaterial
        ? motivoLegible(
            MOTIVOS_ANTICIPADO,
            viaje.motivo_anticipado_codigo,
            viaje.motivo_anticipado_texto,
          )
        : "-",
      // La foto es por viaje en material y por vale en renta/pipas
      sin_foto: (esMaterial ? viaje.foto_omitida : detalle.foto_omitida)
        ? "Si"
        : "No",
      motivo_sin_foto: motivoLegible(
        MOTIVOS_SIN_FOTO,
        esMaterial
          ? viaje.motivo_sin_foto_codigo
          : detalle.motivo_sin_foto_codigo,
        esMaterial ? viaje.motivo_sin_foto_texto : detalle.motivo_sin_foto_texto,
      ),

      tipo_renta: esMaterial
        ? "-"
        : detalle.es_renta_por_dia
          ? "Por dia"
          : "Por hora",
      hora_inicio: esMaterial ? "-" : formatFechaHoraCompleta(detalle.hora_inicio),
      hora_fin: esMaterial ? "-" : formatFechaHoraCompleta(detalle.hora_fin),
      total_horas: esMaterial ? "0" : num(detalle.total_horas),
      total_dias: esMaterial ? "0" : num(detalle.total_dias),
      tarifa_hora: esMaterial ? "0" : num(tarifaRentaEfectiva(detalle).costo_hr),
      tarifa_dia: esMaterial ? "0" : num(tarifaRentaEfectiva(detalle).costo_dia),
      carga_porcentaje: esMaterial ? "0" : num(viaje.carga_porcentaje),

      costo_total_vale: num(detalle.costo_total),
      notas: txt(detalle.notas_adicionales),
      link_qr: generarUrlQR(vale.folio),
    };
  });
};

/**
 * Nombre del archivo segun el periodo elegido.
 * Se usa formato ISO local (no toISOString, que corre la fecha por UTC).
 */
export const nombreArchivoHistorial = (fechaDesde, fechaHasta) => {
  const iso = (fecha) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
      fecha.getDate(),
    ).padStart(2, "0")}`;

  if (fechaDesde && fechaHasta) {
    return `historial_vales_${iso(fechaDesde)}_a_${iso(fechaHasta)}.csv`;
  }
  return `historial_vales_completo_${iso(new Date())}.csv`;
};
