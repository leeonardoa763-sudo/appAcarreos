/**
 * hooks/queries/valesSelect.js
 *
 * SELECT compartido para queries de vales completos.
 * Usado en AcarreosScreen y useValeByFolio para garantizar
 * que ambos traigan exactamente los mismos campos y no haya
 * desincronización de campos como es_material_descarga.
 */

/**
 * Select ligero para la lista — solo campos que muestra ValeCard y usan los filtros.
 * No incluye vale_material_viajes ni precios_renta (se cargan al abrir el detalle).
 */
export const VALE_SELECT_LISTA = `
  *,
  operadores:id_operador (
    nombre_completo
  ),
  vehiculos:id_vehiculo (
    placas
  ),
  persona_completador:id_persona_completador (
    nombre,
    primer_apellido,
    segundo_apellido
  ),
  vale_material_detalles (
    requisicion,
    folio_vale_fisico,
    es_planta_asfaltos,
    material:id_material (
      id_material,
      material,
      id_tipo_de_material
    )
  ),
  vale_renta_detalle (
    hora_inicio,
    hora_fin
  )
`;

export const VALE_SELECT_COMPLETO = `
  *,
  obras (
    id_obra,
    obra,
    cc,
    latitud,
    longitud,
    radio_validacion_metros,
    empresas (
      id_empresa,
      empresa,
      sufijo,
      logo
    )
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
    sindicatos:id_sindicato (
      sindicato
    )
  ),
  vehiculos:id_vehiculo (
    placas,
    capacidad_m3,
    sindicatos:id_sindicato (
      sindicato
    )
  ),
  vale_material_detalles (
    *,
    material:id_material (
      id_material,
      material,
      id_tipo_de_material
    ),
    bancos:id_banco (
      id_banco,
      banco
    ),
    sindicatos:id_sindicato (
      sindicato
    ),
    vale_material_viajes (
      id_viaje,
      numero_viaje,
      hora_registro,
      peso_ton,
      volumen_m3,
      folio_vale_fisico,
      costo_viaje,
      precio_m3,
      id_banco_override,
      distancia_km_override,
      precio_m3_override,
      costo_viaje_override,
      foto_evidencia_url,
      latitud_registro,
      longitud_registro,
      distancia_obra_metros,
      bancos_override:id_banco_override (
        id_banco,
        banco
      )
    )
  ),
  vale_renta_detalle (
    *,
    material:id_material (
      material,
      es_material_descarga
    ),
    sindicatos:id_sindicato (
      sindicato
    ),
    precios_renta (
      costo_hr,
      costo_dia
    ),
    vale_renta_viajes (
      id_viaje,
      numero_viaje,
      hora_registro
    )
  ),
  tickets_descarga (
    numero_ticket,
    banco_descarga,
    id_material_ticket,
    material:id_material_ticket ( material )
  )
`;
