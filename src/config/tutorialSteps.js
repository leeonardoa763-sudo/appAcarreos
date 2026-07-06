/**
 * config/tutorialSteps.js
 *
 * Contenido del tutorial guiado (spotlight) por rol.
 * Agregar un tutorial nuevo = agregar una key aquí, sin tocar el motor
 * (useSpotlightTutorial) ni los componentes de UI del tutorial.
 *
 * Cada paso:
 * - targetId: debe coincidir con el `tutorialId` del botón real a resaltar.
 *   null = paso sin spotlight (tarjeta centrada, ej. bienvenida).
 * - icon: nombre de MaterialCommunityIcons.
 * - interactive: true en pasos donde el avance ocurre al presionar el botón
 *   real resaltado (no con el botón "Siguiente" genérico). Ver ValesScreen.js
 *   (estado tutorialArmed) y TutorialAsignarVehiculoFlow.js.
 *
 * El tour de CHECADOR termina tras la simulación interactiva de "Asignar
 * Vehículo" (incluye imprimir el primer ticket en Acarreos). El paso de
 * "Registrar Viaje" queda pendiente para un segundo tutorial futuro.
 */

/**
 * Oculta temporalmente el botón de ayuda "?" (puerta de entrada al tutorial)
 * mientras se sigue puliendo la experiencia. El código del tutorial queda
 * intacto — solo se quita el punto de entrada. Cambiar a `true` para
 * volver a mostrarlo.
 */
export const TUTORIAL_HELP_BUTTON_ENABLED = false;

export const TUTORIAL_TOURS = {
  CHECADOR: [
    {
      id: "bienvenida",
      targetId: null,
      icon: "hand-wave",
      title: "Bienvenido, Checador",
      text: "Este tutorial te muestra las 2 acciones que usarás todos los días en obra. Solo toma unos segundos.",
    },
    {
      id: "asignar-vehiculo",
      targetId: "asignar-vehiculo",
      icon: "truck-plus",
      title: "1. Asignar Vehículo",
      interactive: true,
      text: "Cuando llegue un camión a la obra, presiona este botón para escanear su código QR y vincularlo a un vale en proceso. Los vales los realizan los residentes, si no tienes vales pide nuevos en el grupo de WhatsApp asignado. Pruébalo ahora: toca \"Entendido, lo intento\" y luego presiona el botón para ver cómo funciona.",
    },
  ],
};

export const getTourForRole = (role) => TUTORIAL_TOURS[role] || [];
