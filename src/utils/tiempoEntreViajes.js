/**
 * utils/tiempoEntreViajes.js
 *
 * Tiempo minimo entre viajes de un vale de MATERIAL, calculado por distancia
 * al banco en vez de un numero fijo por obra.
 *
 * Antes: obras.min_minutos_entre_viajes, el mismo valor para un banco a 2 km y
 * para uno a 40 km. Injusto en los cercanos, inutil en los lejanos.
 *
 * Regla de resolucion:
 *   1) Formula por distancia     → el piso fisico. Siempre se calcula.
 *   2) Piso historico de la ruta → solo si es MAS ALTO que la formula y hay
 *      >= MUESTRAS_MINIMAS_HISTORICO ciclos. Sale de la vista ciclos_banco_obra
 *      (percentil 5), que separa banco->obra de banco->planta.
 *   3) min_minutos_entre_viajes  → si el vale no tiene distancia. Es tambien el
 *      fallback si cualquier query falla: el comportamiento actual exacto.
 *
 * POR QUE EL HISTORIAL SOLO PUEDE SUBIR EL UMBRAL, NUNCA BAJARLO
 * La calibracion del 2026-08-04 sobre 9,439 viajes reales mostro que los
 * percentiles bajos del historico estan contaminados por el propio problema que
 * este feature ataca: hay ciclos registrados de 1.0 min para un banco a 5 km y
 * de 1.3 min para uno a 16 km — fisicamente imposibles. Si el historial pudiera
 * bajar el umbral, esos registros se volverian la norma del banco y la regla se
 * autodestruiria. Con MAX(formula, historial) el historial solo aporta lo que
 * si sabe: que una ruta concreta es MAS lenta de lo que dice la fisica (camino
 * malo, cola larga). Ver CLAUDE.md, seccion TIEMPO MINIMO ENTRE VIAJES.
 *
 * POR QUE PERCENTIL 5 Y NO 10
 * Cuando gana el historial, el umbral ES el percentil, asi que ese numero fija
 * por construccion cuantos viajes pediran motivo. Con p10 seria uno de cada
 * diez incluso en rutas impecables (INCASA->obra: 50 ciclos, ninguno imposible).
 * En rutas sucias el percentil ni se usa porque gana la formula, asi que bajar a
 * p05 no debilita la deteccion: solo quita friccion donde no habia nada que
 * detectar.
 *
 * NO aplica a renta ni a asfaltico: un viaje de renta no es un ciclo de acarreo
 * y el asfaltico no registra viajes.
 *
 * Todo aqui es puro — sin acceso a BD. El hook resuelve los datos y llama.
 */

// Cotas duras del resultado. Protegen contra una configuracion absurda de obra
// (velocidad de 2 km/h) o un historial degenerado.
//
// El techo se subio de 120 a 180 al ver los datos reales: GRAMOL (36 km, 200
// ciclos) tiene un p05 legitimo de 133 min, y 120 se lo recortaba. El banco mas
// lejano configurado esta a 40 km; con 180 cabe cualquier ruta real con margen.
export const PISO_MINUTOS = 5;
export const TECHO_MINUTOS = 180;

// Con menos muestras el percentil 10 es ruido. Se subio de 10 a 30 tras la
// calibracion: los bancos con 18-24 ciclos daban p10 sin sentido, y los bancos
// que de verdad importan tienen entre 80 y 5,021 ciclos.
export const MUESTRAS_MINIMAS_HISTORICO = 30;

// Defaults si la obra no los tiene configurados. Espejo de los DEFAULT de la
// migracion 20260804_tiempo_dinamico_y_motivos.sql.
//
// Calibrados con los ciclos reales de 2026-03-23 a 2026-08-04. Ajustando una
// recta a las MEDIANAS por distancia (5 km→39 min, 15→76, 21.5→87, 36→165):
// pendiente 4.06 min/km ida y vuelta → 29.5 km/h de recorrido, con 19 min de
// intercepto (carga, descarga y cola). Se usan las medianas y no los p10
// porque los p10 estan contaminados (ver arriba).
export const VELOCIDAD_DEFAULT_KMH = 30;
export const MINUTOS_CARGA_DESCARGA_DEFAULT = 19;

// El umbral debe ser un PISO PLAUSIBLE, no el ciclo tipico: con factor 1.0 se
// bloquearia la mitad de los viajes legitimos por definicion. 0.55 deja el
// umbral por debajo del percentil 25 observado en todos los bancos medidos,
// pero muy por encima de los ciclos imposibles de 1-3 min.
export const FACTOR_TOLERANCIA_DEFAULT = 0.55;

// Minimo de caracteres de un motivo escrito a mano. Sin esto se recibe "x".
export const MOTIVO_TEXTO_MIN = 10;

export const CODIGO_MOTIVO_OTRO = "otro";

/**
 * Motivos rapidos para registrar un viaje antes del tiempo minimo.
 * El codigo es lo que se guarda en BD y lo que permite agrupar despues; el
 * texto libre solo se exige cuando se elige "otro".
 */
export const MOTIVOS_ANTICIPADO = [
  { codigo: "captura_tardia", label: "Se esta capturando despues, no en campo" },
  // Mismo codigo que en MOTIVOS_SIN_FOTO a proposito: es el mismo hecho y suele
  // disparar las dos excepciones a la vez (el camion termina en el banco, ni
  // vuelve a la obra ni hay nada que fotografiar). Compartir codigo permite
  // contarlas juntas despues.
  { codigo: "viaje_final", label: "Viaje final, el camion ya no regresa a la obra" },
  { codigo: "viaje_corto", label: "El recorrido fue mas rapido de lo normal" },
  { codigo: "sin_senal", label: "No hubo senal al momento del viaje" },
  { codigo: "error_ticket", label: "Se corrige un viaje mal registrado" },
  { codigo: CODIGO_MOTIVO_OTRO, label: "Otro (especificar)" },
];

/**
 * Motivos rapidos para no tomar la foto de evidencia.
 * Existe porque cuando el vale se captura fuera de campo el usuario terminaba
 * fotografiando la nada solo para poder avanzar — una evidencia falsa es peor
 * que la ausencia declarada de evidencia.
 */
export const MOTIVOS_SIN_FOTO = [
  { codigo: "captura_tardia", label: "Se esta capturando despues, no en campo" },
  // Distinto de camion_retirado: aqui el camion nunca llega a la obra. Termina
  // su jornada en el banco, asi que no hay nada que fotografiar en el sitio.
  { codigo: "viaje_final", label: "Viaje final, el camion ya no regresa a la obra" },
  { codigo: "camion_retirado", label: "El camion ya se retiro" },
  { codigo: "camara_falla", label: "La camara no funciona o no hay permiso" },
  { codigo: "sin_visibilidad", label: "Sin visibilidad (noche, lluvia)" },
  { codigo: CODIGO_MOTIVO_OTRO, label: "Otro (especificar)" },
];

const clamp = (valor, min, max) => Math.min(Math.max(valor, min), max);

/**
 * Ciclo teorico obra → banco → obra, en minutos.
 *
 * Devuelve null si no hay distancia utilizable: el llamador debe caer al
 * fallback, no asumir cero.
 */
export function tiempoPorFormula({
  distanciaKm,
  velocidadKmh = VELOCIDAD_DEFAULT_KMH,
  minutosCargaDescarga = MINUTOS_CARGA_DESCARGA_DEFAULT,
  factorTolerancia = FACTOR_TOLERANCIA_DEFAULT,
} = {}) {
  const km = parseFloat(distanciaKm);
  const kmh = parseFloat(velocidadKmh);
  if (!Number.isFinite(km) || km <= 0) return null;
  if (!Number.isFinite(kmh) || kmh <= 0) return null;

  const fijos = Number.isFinite(parseFloat(minutosCargaDescarga))
    ? parseFloat(minutosCargaDescarga)
    : MINUTOS_CARGA_DESCARGA_DEFAULT;
  const factor = Number.isFinite(parseFloat(factorTolerancia))
    ? parseFloat(factorTolerancia)
    : FACTOR_TOLERANCIA_DEFAULT;

  // Ida y vuelta: el ciclo es de un registro de viaje al siguiente.
  const minutosRecorrido = ((km * 2) / kmh) * 60;
  return (minutosRecorrido + fijos) * factor;
}

/**
 * Resuelve el tiempo minimo aplicable y de donde salio.
 *
 * @param {object}  args
 * @param {number}  args.distanciaKm      distancia del vale (o del override del viaje)
 * @param {object}  args.obra             fila de obras con los parametros
 * @param {object}  args.historico        fila de ciclos_banco_obra, o null
 * @returns {{ minutos: number, origen: "historico"|"formula"|"fallback" }}
 */
export function resolverTiempoMinimo({
  distanciaKm,
  obra = null,
  historico = null,
} = {}) {
  const fallback = Number.isFinite(parseInt(obra?.min_minutos_entre_viajes, 10))
    ? parseInt(obra.min_minutos_entre_viajes, 10)
    : null;

  const nCiclos = parseInt(historico?.n_ciclos, 10);
  const pisoHistorico = parseFloat(historico?.p05_minutos);
  const historicoUsable =
    Number.isFinite(nCiclos) &&
    nCiclos >= MUESTRAS_MINIMAS_HISTORICO &&
    Number.isFinite(pisoHistorico) &&
    pisoHistorico > 0;

  const formula = tiempoPorFormula({
    distanciaKm,
    velocidadKmh: obra?.velocidad_promedio_kmh,
    minutosCargaDescarga: obra?.minutos_carga_descarga,
    factorTolerancia: obra?.factor_tolerancia_tiempo,
  });

  // Sin distancia no hay fisica que aplicar: manda el historial si lo hay, y si
  // no el valor configurado — el comportamiento anterior a este cambio.
  if (formula == null) {
    if (historicoUsable) {
      return {
        minutos: clamp(Math.round(pisoHistorico), PISO_MINUTOS, TECHO_MINUTOS),
        origen: "historico",
      };
    }
    return { minutos: fallback ?? PISO_MINUTOS, origen: "fallback" };
  }

  // El historial solo puede SUBIR el piso, nunca bajarlo (ver cabecera).
  if (historicoUsable && pisoHistorico > formula) {
    return {
      minutos: clamp(Math.round(pisoHistorico), PISO_MINUTOS, TECHO_MINUTOS),
      origen: "historico",
    };
  }

  return {
    minutos: clamp(Math.round(formula), PISO_MINUTOS, TECHO_MINUTOS),
    origen: "formula",
  };
}

/**
 * Frase corta que explica de donde sale el umbral, para mostrarla junto al
 * contador. Un limite que el usuario no entiende se percibe como arbitrario.
 */
export function explicacionOrigen(origen, { distanciaKm, banco } = {}) {
  const km = parseFloat(distanciaKm);
  const tieneKm = Number.isFinite(km) && km > 0;

  if (origen === "historico") {
    return banco
      ? `Este banco (${banco}) tarda mas de lo normal segun los viajes anteriores`
      : "Este banco tarda mas de lo normal segun los viajes anteriores";
  }
  if (origen === "formula") {
    return tieneKm
      ? `Calculado por la distancia al banco (${km} km)`
      : "Calculado por la distancia al banco";
  }
  return "Tiempo minimo configurado para la obra";
}

/**
 * Traduce el codigo guardado en BD a su etiqueta legible.
 * Devuelve el codigo tal cual si no esta en la lista — un motivo de una version
 * anterior de la app sigue siendo mas util que un "-".
 */
export function etiquetaMotivo(motivos, codigo) {
  if (!codigo) return "Sin especificar";
  return motivos.find((m) => m.codigo === codigo)?.label ?? codigo;
}

/**
 * Valida un motivo antes de dejar pasar la excepcion.
 * El texto libre solo es obligatorio cuando el codigo es "otro"; con un motivo
 * de la lista el texto es opcional.
 */
export function motivoEsValido(motivo) {
  if (!motivo?.codigo) return false;
  if (motivo.codigo !== CODIGO_MOTIVO_OTRO) return true;
  return (motivo.texto ?? "").trim().length >= MOTIVO_TEXTO_MIN;
}
