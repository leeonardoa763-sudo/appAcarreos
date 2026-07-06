/**
 * config/tutorialFakeData.js
 *
 * Datos 100% ficticios para la simulación interactiva del tutorial CHECADOR
 * (paso "Asignar Vehículo"). Nunca deben tocar Supabase ni mezclarse con
 * datos reales. id_vale es un string a propósito (los id reales son
 * numéricos), para que sea imposible que colisione con un id real.
 *
 * TUTORIAL_VALE_FAKE usa exactamente la forma que espera
 * generarTicketMaterial(vale) en src/services/ticketGenerator.js.
 */

export const TUTORIAL_VEHICULO_FAKE = {
  id_vehiculo: "tutorial-demo-vehiculo",
  placas: "DEMO-001",
  capacidad_m3: 7,
  operador_sugerido: {
    id_operador: "tutorial-demo-operador",
    nombre_completo: "Juan Pérez (Demo)",
  },
  sindicatos: { sindicato: "Sindicato Demo" },
};

export const TUTORIAL_VALE_FAKE = {
  id_vale: "tutorial-demo-001",
  folio: "DEMO-00001",
  tipo_vale: "material",
  estado: "en_proceso",
  fecha_creacion: new Date().toISOString(),
  qr_verification_url: "https://web-acarreos.vercel.app/vale/DEMO-00001",
  obras: {
    cc: "000",
    obra: "Obra Demo (Tutorial)",
    empresas: { empresa: "CONSTRUCCIONES DEMO" },
  },
  operadores: { nombre_completo: "Juan Pérez (Demo)" },
  vehiculos: { placas: "DEMO-001", capacidad_m3: 7 },
  vale_material_detalles: [
    {
      material: { material: "Grava", id_tipo_de_material: 1 },
      bancos: { banco: "Banco El Roble (Demo)" },
      distancia_km: 12,
      cantidad_pedida_m3: 20,
      vale_material_viajes: [],
    },
  ],
};

/**
 * TUTORIAL_VALE_DISPONIBLE_FAKE usa la forma EXACTA que arma
 * useVehiculoQR.js -> _cargarValesDisponibles() (query real a la tabla
 * `vales` para la lista de vales asignables). Es una forma distinta a
 * TUTORIAL_VALE_FAKE (esa sigue el shape de VALE_SELECT_COMPLETO) porque
 * la propia app usa dos formas distintas según el consumidor real:
 * - `empresas` va al nivel raíz del vale (no anidado en `obras`).
 * - el banco se alía como `banco` (singular), no `bancos`.
 * Se reutiliza tal cual en los componentes reales CardVehiculo,
 * ConfirmarOperadorCard y ListaValesDisponibles (src/componets/modals/asignarVehiculo/),
 * que son puros/controlados por props — no hacen I/O propio.
 */
export const TUTORIAL_VALE_DISPONIBLE_FAKE = {
  id_vale: "tutorial-demo-001",
  folio: "DEMO-00001",
  tipo_vale: "material",
  estado: "en_proceso",
  id_operador: null,
  id_vehiculo: null,
  fecha_creacion: new Date().toISOString(),
  empresas: { empresa: "CONSTRUCCIONES DEMO", sufijo: "DEMO" },
  obras: { obra: "Obra Demo (Tutorial)", cc: "000" },
  vale_material_detalles: [
    {
      id_sindicato: "tutorial-demo-sindicato",
      es_planta_asfaltos: false,
      banco: { id_banco: "tutorial-demo-banco", banco: "Banco El Roble (Demo)" },
      material: { id_tipo_de_material: 1, material: "Grava" },
    },
  ],
};

export const TUTORIAL_OPERADORES_SINDICATO_FAKE = [
  { id_operador: "tutorial-demo-operador", nombre_completo: "Juan Pérez (Demo)" },
  { id_operador: "tutorial-demo-operador-2", nombre_completo: "Pedro Gómez (Demo)" },
];
