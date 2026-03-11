/**
 * hooks/queries/valesSelect.js
 *
 * SELECT compartido para queries de vales completos.
 * Usado en AcarreosScreen y useValeByFolio para garantizar
 * que ambos traigan exactamente los mismos campos y no haya
 * desincronización de campos como es_material_descarga.
 */

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
    )
  )
`;
