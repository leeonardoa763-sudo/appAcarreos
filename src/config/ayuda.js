/**
 * config/ayuda.js
 *
 * Direcciones del Centro de Ayuda (sitio aparte, proyecto `acarreos-ayuda`) y la
 * regla para resolver a qué guía y a qué paso mandar según el vale.
 *
 * Los tutoriales NO viven dentro de la app: se movieron a esa web el 2026-07-29
 * (ver "Limpieza de código muerto" en el CLAUDE.md raíz). Aquí solo están los
 * enlaces.
 *
 * Este archivo es solo datos: no abre nada. El efecto de abrir el navegador vive
 * en `src/utils/abrirAyuda.js`.
 *
 * OJO CON EL `.html`: el sitio decidió a propósito NO activar `cleanUrls` en su
 * vercel.json precisamente porque la app enlaza estas rutas ya compiladas.
 * Quitar la extensión rompe todos estos enlaces.
 */
import { esValePipa } from "../utils/pipasAgua";

export const AYUDA_BASE_URL = "https://acarreos-ayuda.vercel.app";

export const AYUDA_URLS = {
  // Portada: menú de los 4 tipos de vale.
  portada: `${AYUDA_BASE_URL}/index.html`,

  // Lecciones del residente — una sola acción, cada una es su propia página.
  crearMaterial: `${AYUDA_BASE_URL}/ayuda-material-crear-vale.html`,
  crearRenta: `${AYUDA_BASE_URL}/ayuda-renta-crear-vale.html`,
  crearAsfaltico: `${AYUDA_BASE_URL}/ayuda-asfaltico-crear-vale.html`,

  // Guías completas (el mapa del proceso). Los pasos del checador son modales
  // dentro de estas páginas, no páginas aparte.
  guiaMaterial: `${AYUDA_BASE_URL}/guia-material.html`,
  guiaRentaCamion: `${AYUDA_BASE_URL}/guia-renta-camion.html`,
  guiaRentaPipa: `${AYUDA_BASE_URL}/guia-renta-pipa.html`,
  guiaAsfaltico: `${AYUDA_BASE_URL}/guia-asfaltico.html`,
};

/**
 * Pasos del checador que existen como modal en cada guía. La app agrega
 * `#paso-<nombre>` a la URL y `js/guia-modales.js` del sitio lo lee al cargar
 * para abrir ese modal solo.
 *
 * Las listas NO son iguales a propósito: "banco" (cambiar el banco de un viaje)
 * solo existe en material, porque solo el producto de corte lo permite.
 */
const PASOS_POR_GUIA = {
  [AYUDA_URLS.guiaMaterial]: [
    "asignar",
    "ticket",
    "registrar",
    "banco",
    "completar",
  ],
  [AYUDA_URLS.guiaRentaCamion]: ["asignar", "ticket", "registrar", "completar"],
};

const TIPO_MATERIAL_CARPETA_ASFALTICA = 2;

/**
 * Pega el `#paso-...` solo si esa guía realmente tiene ese modal. Si no, devuelve
 * la guía sin ancla: es mejor caer en el mapa del proceso que en un ancla muerta.
 */
const conPaso = (urlGuia, paso) => {
  if (!paso) return urlGuia;
  const pasosDisponibles = PASOS_POR_GUIA[urlGuia];
  if (!pasosDisponibles?.includes(paso)) return urlGuia;
  return `${urlGuia}#paso-${paso}`;
};

/**
 * Devuelve la URL de ayuda para un vale y, opcionalmente, para un paso concreto
 * del checador ("asignar" | "ticket" | "registrar" | "banco" | "completar").
 *
 * Toda la ramificación por tipo de vale vive AQUÍ, para que ninguna sección de UI
 * tenga que saber a qué guía pertenece el vale que está mostrando.
 *
 * Los campos que necesita (`es_pipa_agua`, `material.id_tipo_de_material`) vienen
 * tanto en VALE_SELECT_LISTA como en VALE_SELECT_COMPLETO.
 */
export const urlAyudaVale = (vale, paso = null) => {
  if (!vale) return AYUDA_URLS.portada;

  // Pipa de agua: es tipo_vale "renta" con el sello es_pipa_agua, pero su guía
  // todavía no tiene tutoriales grabados — es una página puente. Sin paso: no
  // hay modales que abrir ahí.
  if (esValePipa(vale)) return AYUDA_URLS.guiaRentaPipa;

  if (vale.tipo_vale === "renta") {
    return conPaso(AYUDA_URLS.guiaRentaCamion, paso);
  }

  const tipoMaterial =
    vale.vale_material_detalles?.[0]?.material?.id_tipo_de_material ?? null;

  // Carpeta asfáltica: su guía es una sola parada (crear vale), sin modales de
  // checador.
  if (tipoMaterial === TIPO_MATERIAL_CARPETA_ASFALTICA) {
    return AYUDA_URLS.guiaAsfaltico;
  }

  // Pétreo (tipo 1) y producto de corte (tipo 3) comparten el mismo flujo y la
  // misma guía; las diferencias se marcan dentro de cada paso.
  return conPaso(AYUDA_URLS.guiaMaterial, paso);
};
