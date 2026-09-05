/**
 * hooks/exportHelpers/historialQueries.js
 *
 * CONSULTA DEL HISTORIAL DE VALES (pantalla HistorialValesScreen)
 *
 * Una sola query alimenta los dos modos de la pantalla: ver la lista de folios
 * en la app y exportar el CSV. Asi los dos ven exactamente los mismos vales.
 *
 * A diferencia de exportHelpers/valesQueries.js (que exporta por semana ISO),
 * aqui el periodo es libre: mes, rango de fechas o todo el historico.
 *
 * PAGINACION - NO QUITAR:
 * PostgREST corta cada respuesta en max-rows (1000 por defecto en Supabase) sin
 * avisar. Una consulta de "todos los vales" sin paginar devolveria 1000 vales y
 * un CSV silenciosamente incompleto. Por eso se itera con .range() hasta que una
 * pagina vuelva incompleta.
 */

import { supabase } from "../../config/supabase";
import { filtrarValesMaterialPorRol } from "../../utils/plantaAsfaltos";
import { esValePipa } from "../../utils/pipasAgua";

/**
 * Select propio en vez de VALE_SELECT_COMPLETO — mismo criterio que el resto de
 * exportHelpers, que tambien escriben el suyo.
 *
 * Motivo concreto: VALE_SELECT_COMPLETO no trae id_persona_registro en los
 * viajes, asi que la columna "Registrado Por" saldria vacia en todo el CSV.
 * Agregarlo alla obligaria a tocar la query que usa ValeDetalleModal en
 * produccion; aqui el cambio queda aislado.
 *
 * No se embebe id_persona_verificador: no esta confirmado que tenga FK y un
 * embed invalido tumba la query entera. Se exportan en su lugar las columnas
 * verificado_por_sindicato y fecha_verificacion, que vienen en la cabecera.
 */
const HISTORIAL_SELECT = `
  id_vale,
  folio,
  tipo_vale,
  es_pipa_agua,
  estado,
  fecha_creacion,
  fecha_programada,
  fecha_completado,
  verificado_por_sindicato,
  fecha_verificacion,
  fecha_cancelacion,
  motivo_cancelacion,
  id_obra,
  obras (
    obra,
    cc,
    empresas ( empresa )
  ),
  persona:id_persona_creador (
    nombre,
    primer_apellido,
    segundo_apellido
  ),
  persona_completador:id_persona_completador (
    nombre,
    primer_apellido,
    segundo_apellido
  ),
  operadores:id_operador (
    nombre_completo,
    id_sindicato,
    sindicatos:id_sindicato ( sindicato )
  ),
  vehiculos:id_vehiculo (
    placas,
    capacidad_m3,
    sindicatos:id_sindicato ( sindicato )
  ),
  vale_material_detalles (
    id_material,
    id_banco,
    id_sindicato,
    es_planta_asfaltos,
    capacidad_m3,
    distancia_km,
    cantidad_pedida_m3,
    volumen_real_m3,
    peso_ton,
    precio_m3,
    costo_total,
    requisicion,
    folio_vale_fisico,
    notas_adicionales,
    foto_omitida,
    motivo_sin_foto_codigo,
    motivo_sin_foto_texto,
    material:id_material ( material, id_tipo_de_material ),
    bancos:id_banco ( banco ),
    sindicatos:id_sindicato ( sindicato ),
    vale_material_viajes (
      id_viaje,
      numero_viaje,
      hora_registro,
      peso_ton,
      volumen_m3,
      precio_m3,
      costo_viaje,
      folio_vale_fisico,
      id_banco_override,
      distancia_km_override,
      precio_m3_override,
      costo_viaje_override,
      registro_anticipado,
      minutos_minimos_calculados,
      minutos_faltantes_anticipado,
      motivo_anticipado_codigo,
      motivo_anticipado_texto,
      foto_omitida,
      motivo_sin_foto_codigo,
      motivo_sin_foto_texto,
      bancos_override:id_banco_override ( banco ),
      persona:id_persona_registro (
        nombre,
        primer_apellido,
        segundo_apellido
      )
    )
  ),
  vale_renta_detalle (
    id_material,
    id_sindicato,
    capacidad_m3,
    hora_inicio,
    hora_fin,
    total_horas,
    total_dias,
    es_renta_por_dia,
    es_turno_nocturno,
    costo_total,
    notas_adicionales,
    foto_omitida,
    motivo_sin_foto_codigo,
    motivo_sin_foto_texto,
    costo_hr_aplicado,
    costo_dia_aplicado,
    material:id_material ( material ),
    sindicatos:id_sindicato ( sindicato ),
    precios_renta ( costo_hr, costo_dia ),
    vale_renta_viajes (
      id_viaje,
      numero_viaje,
      hora_registro,
      id_material,
      carga_porcentaje,
      banco_descarga,
      material:id_material ( material ),
      persona:id_persona_registro (
        nombre,
        primer_apellido,
        segundo_apellido
      )
    )
  )
`;

/** Filas por peticion. Menor que max-rows para no depender de su valor. */
const PAGE_SIZE = 500;

/** Tope duro de vales. Al alcanzarlo se devuelve truncado = true. */
export const MAX_VALES = 5000;

/** Estados incluidos siempre. "cancelado" se agrega solo si el usuario lo pide. */
const ESTADOS_BASE = [
  "borrador",
  "en_proceso",
  "emitido",
  "verificado",
  "conciliado",
];

export const TIPOS_HISTORIAL = {
  TODOS: "todos",
  MATERIAL: "material",
  RENTA: "renta",
  PIPAS: "pipas",
};

const ROL_PLANTA_ASFALTOS = "Planta de Asfaltos";

/**
 * Banco del viaje. En vales tipo 3 cada viaje puede sobreescribir el banco del
 * detalle, asi que el override manda.
 */
export const resolverBancoId = (detalle, viaje) =>
  viaje?.id_banco_override ?? detalle?.id_banco ?? null;

export const resolverBancoNombre = (detalle, viaje) =>
  viaje?.bancos_override?.banco ?? detalle?.bancos?.banco ?? null;

/**
 * El sindicato vive en varios lugares del vale y no siempre esta poblado en
 * todos. Se toma el primero que exista, del mas especifico al mas general.
 */
export const resolverSindicatoId = (vale, detalle) =>
  detalle?.id_sindicato ?? vale?.operadores?.id_sindicato ?? null;

export const resolverSindicatoNombre = (vale, detalle) =>
  detalle?.sindicatos?.sindicato ??
  vale?.operadores?.sindicatos?.sindicato ??
  vale?.vehiculos?.sindicatos?.sindicato ??
  null;

/**
 * Trae todos los vales que cumplen los filtros de cabecera (obra, fecha, tipo,
 * estado), paginando. El resto de filtros se aplica despues sobre las filas.
 */
const fetchValesPaginado = async ({
  obrasIds,
  fechaDesde,
  fechaHasta,
  tipo,
  incluirCancelados,
}) => {
  const estados = incluirCancelados
    ? [...ESTADOS_BASE, "cancelado"]
    : ESTADOS_BASE;

  const vales = [];
  let offset = 0;
  let truncado = false;

  for (;;) {
    let query = supabase
      .from("vales")
      .select(HISTORIAL_SELECT)
      .in("id_obra", obrasIds)
      .in("estado", estados)
      .order("fecha_creacion", { ascending: false })
      .order("id_vale", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    // Pipas y renta comparten tipo_vale; se separan despues por es_pipa_agua.
    if (tipo === TIPOS_HISTORIAL.MATERIAL) {
      query = query.eq("tipo_vale", "material");
    } else if (
      tipo === TIPOS_HISTORIAL.RENTA ||
      tipo === TIPOS_HISTORIAL.PIPAS
    ) {
      query = query.eq("tipo_vale", "renta");
    }

    if (fechaDesde) query = query.gte("fecha_creacion", fechaDesde.toISOString());
    if (fechaHasta) query = query.lte("fecha_creacion", fechaHasta.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    const pagina = data || [];
    vales.push(...pagina);

    if (pagina.length < PAGE_SIZE) break;

    if (vales.length >= MAX_VALES) {
      truncado = true;
      break;
    }

    offset += PAGE_SIZE;
  }

  return { vales, truncado };
};

/**
 * Aplica las reglas de visibilidad por rol, identicas a las de AcarreosScreen.
 * Planta de Asfaltos no ve renta ni pipas; Residente y CHECADOR no ven los
 * vales de planta.
 */
const filtrarPorRolYTipo = (vales, tipo, userRole) => {
  const esPlantaAsfaltos = userRole === ROL_PLANTA_ASFALTOS;

  const material = filtrarValesMaterialPorRol(
    vales.filter((v) => v.tipo_vale === "material"),
    userRole,
  );

  const renta = esPlantaAsfaltos
    ? []
    : vales.filter((v) => v.tipo_vale === "renta" && !esValePipa(v));

  const pipas = esPlantaAsfaltos
    ? []
    : vales.filter((v) => v.tipo_vale === "renta" && esValePipa(v));

  if (tipo === TIPOS_HISTORIAL.MATERIAL) return material;
  if (tipo === TIPOS_HISTORIAL.RENTA) return renta;
  if (tipo === TIPOS_HISTORIAL.PIPAS) return pipas;
  return [...material, ...renta, ...pipas];
};

/**
 * Aplana a una fila por viaje registrado.
 *
 * Se recorren TODOS los detalles, no solo el [0] como hace valesQueries.js:
 * ese atajo pierde filas cuando un vale tiene mas de un detalle.
 *
 * Los vales sin viajes registrados no producen ninguna fila.
 */
const aplanarViajes = (vales) => {
  const filas = [];

  vales.forEach((vale) => {
    const tipoFila = esValePipa(vale)
      ? TIPOS_HISTORIAL.PIPAS
      : vale.tipo_vale === "material"
        ? TIPOS_HISTORIAL.MATERIAL
        : TIPOS_HISTORIAL.RENTA;

    (vale.vale_material_detalles || []).forEach((detalle) => {
      (detalle.vale_material_viajes || []).forEach((viaje) => {
        filas.push({ tipo: tipoFila, vale, detalle, viaje });
      });
    });

    (vale.vale_renta_detalle || []).forEach((detalle) => {
      (detalle.vale_renta_viajes || []).forEach((viaje) => {
        filas.push({ tipo: tipoFila, vale, detalle, viaje });
      });
    });
  });

  return filas;
};

/**
 * Filtros que no se pueden resolver en SQL sin recurrir a la sintaxis de
 * recursos embebidos de PostgREST (!inner), que cambia la forma del resultado.
 * Como obra + fecha + tipo + estado ya acotan el volumen, estos se aplican en
 * memoria — mismo criterio que useAcarreosFilters.applyFilters.
 */
const aplicarFiltrosDeFila = (filas, { materialId, sindicatoId, bancoId }) => {
  let resultado = filas;

  if (materialId) {
    resultado = resultado.filter(
      // Renta normal declara el material por viaje; material/pipas/vales viejos
      // lo tienen en el detalle.
      (f) => f.viaje?.id_material === materialId || f.detalle?.id_material === materialId,
    );
  }

  if (sindicatoId) {
    resultado = resultado.filter(
      (f) => resolverSindicatoId(f.vale, f.detalle) === sindicatoId,
    );
  }

  if (bancoId) {
    resultado = resultado.filter(
      (f) => resolverBancoId(f.detalle, f.viaje) === bancoId,
    );
  }

  return resultado;
};

/**
 * Punto de entrada unico.
 *
 * @param {Object} filtros
 * @param {number[]} filtros.obrasIds
 * @param {Date|null} filtros.fechaDesde   null = sin limite inferior
 * @param {Date|null} filtros.fechaHasta   null = sin limite superior
 * @param {string} filtros.tipo            ver TIPOS_HISTORIAL
 * @param {boolean} filtros.incluirCancelados
 * @param {number|null} filtros.materialId
 * @param {number|null} filtros.sindicatoId
 * @param {number|null} filtros.bancoId
 * @param {string} filtros.userRole
 * @returns {Promise<{ filas: Array, totalVales: number, truncado: boolean }>}
 */
export const fetchViajesHistorial = async (filtros) => {
  const { obrasIds, tipo, userRole } = filtros;

  if (!Array.isArray(obrasIds) || obrasIds.length === 0) {
    return { filas: [], totalVales: 0, truncado: false };
  }

  const { vales, truncado } = await fetchValesPaginado(filtros);

  const visibles = filtrarPorRolYTipo(vales, tipo, userRole);
  const filas = aplicarFiltrosDeFila(aplanarViajes(visibles), filtros);

  filas.sort((a, b) => {
    const fechaA = new Date(a.vale.fecha_creacion).getTime();
    const fechaB = new Date(b.vale.fecha_creacion).getTime();
    if (fechaA !== fechaB) return fechaB - fechaA;
    if (a.vale.folio !== b.vale.folio) {
      return String(a.vale.folio).localeCompare(String(b.vale.folio));
    }
    return (a.viaje.numero_viaje || 0) - (b.viaje.numero_viaje || 0);
  });

  const totalVales = new Set(filas.map((f) => f.vale.id_vale)).size;

  return { filas, totalVales, truncado };
};

/**
 * Colapsa las filas a un vale por folio, para la lista de la app.
 * Conserva el orden de las filas (ya vienen ordenadas por fecha desc).
 */
export const foliosDesdeFilas = (filas) => {
  const vistos = new Map();

  filas.forEach(({ tipo, vale }) => {
    if (vistos.has(vale.id_vale)) {
      vistos.get(vale.id_vale).totalViajes += 1;
      return;
    }
    vistos.set(vale.id_vale, {
      id_vale: vale.id_vale,
      folio: vale.folio,
      tipo,
      // ValeDetalleModal decide que componente montar segun tipo_vale y hace su
      // propio fetch con VALE_SELECT_COMPLETO; con estos dos campos le basta.
      tipo_vale: vale.tipo_vale,
      estado: vale.estado,
      fecha_creacion: vale.fecha_creacion,
      obra: vale.obras?.obra || null,
      totalViajes: 1,
    });
  });

  return Array.from(vistos.values());
};
