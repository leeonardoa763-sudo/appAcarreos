/**
 * utils/plantaAsfaltos.js
 *
 * Regla de visibilidad de vales de material segun el rol.
 *
 * Los vales de planta y los de obra son mundos separados:
 *
 * - "Planta de Asfaltos" ve los vales que la planta pide para si misma
 *   (es_planta_asfaltos = true, material que entra a la planta desde un
 *   banco) y los de carpeta asfaltica (tipo 2), que son el producto que la
 *   planta despacha a la obra. Estos ultimos se crean sin es_planta_asfaltos
 *   (ver ValeMaterialAsfalticoScreen) y nacen ya en estado "emitido".
 *   No ve los vales normales de obra que crean los residentes.
 *
 * - "Residente" y "CHECADOR" ven todo menos los vales de planta.
 *
 * - Administrador, Finanzas y Sindicato ven todo, sin filtro.
 *
 * Mismo criterio de exclusion mutua que useVehiculoQR aplica al asignar
 * vehiculos. Centralizado aqui porque AcarreosScreen y ArchivadosScreen
 * deben filtrar identico.
 */

const TIPO_MATERIAL_CARPETA_ASFALTICA = 2;

const ROL_PLANTA_ASFALTOS = "Planta de Asfaltos";
const ROLES_SOLO_OBRA = ["Residente", "CHECADOR"];

const esDeLaPlanta = (vale) =>
  !!vale?.vale_material_detalles?.[0]?.es_planta_asfaltos;

export const esValeVisibleParaPlantaAsfaltos = (vale) => {
  const detalle = vale?.vale_material_detalles?.[0];
  if (!detalle) return false;

  if (detalle.es_planta_asfaltos) return true;

  return (
    detalle.material?.id_tipo_de_material === TIPO_MATERIAL_CARPETA_ASFALTICA
  );
};

/**
 * Filtra una lista de vales de material segun el rol del usuario.
 * Devuelve la misma lista sin tocar para los roles con acceso total.
 */
export const filtrarValesMaterialPorRol = (vales, userRole) => {
  if (!Array.isArray(vales)) return [];

  if (userRole === ROL_PLANTA_ASFALTOS) {
    return vales.filter(esValeVisibleParaPlantaAsfaltos);
  }

  if (ROLES_SOLO_OBRA.includes(userRole)) {
    return vales.filter((vale) => !esDeLaPlanta(vale));
  }

  return vales;
};
