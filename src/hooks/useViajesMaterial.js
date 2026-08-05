/**
 * hooks/useViajesMaterial.js
 *
 * Hook para registrar y cargar viajes de un vale de material.
 * Análogo a useViajesRenta pero con lógica de:
 * - Captura de peso en toneladas (opcional según tipo)
 * - Conversión ton → m³ usando peso_especifico
 * - Cálculo de costo por viaje al momento de registrar
 * - Folio vale físico (solo tipo 3 / tepetate)
 * - Tiempo mínimo entre viajes, calculado por distancia al banco
 *   (ver utils/tiempoEntreViajes.js)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";
import { calcularCostoValeMaterial } from "../utils/preciosMaterial";
import { esDentroJornada } from "../utils/jornadaLaboral";
import {
  resolverTiempoMinimo,
  motivoEsValido,
} from "../utils/tiempoEntreViajes";

const MINUTOS_DEFAULT = 20;

export const useViajesMaterial = (
  idDetalleMaterial,
  idVale,
  detalle,
  idObra,
  fechaCreacionVale,
  esProgramado = false,
) => {
  const { userProfile } = useAuth();
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eliminandoViaje, setEliminandoViaje] = useState(false);
  const [minutosRestantes, setMinutosRestantes] = useState(0);
  const [minMinutosEntreViajes, setMinMinutosEntreViajes] =
    useState(MINUTOS_DEFAULT);
  const [origenTiempoMinimo, setOrigenTiempoMinimo] = useState("fallback");
  const intervaloRef = useRef(null);

  // ─── Banco y distancia efectivos ──────────────────────────────────────────
  // En tipo 3 el banco puede cambiarse por viaje (ModalCambiarBanco escribe los
  // *_override). El siguiente ciclo sale del último banco usado, no del que
  // quedó congelado en el detalle al crear el vale.
  const ultimoViaje = viajes.length > 0 ? viajes[viajes.length - 1] : null;
  const idBancoEfectivo = ultimoViaje?.id_banco_override ?? detalle?.id_banco ?? null;
  const distanciaEfectivaKm =
    ultimoViaje?.distancia_km_override ?? detalle?.distancia_km ?? null;
  // El alias es bancos_override (plural) en todo el repo — valesSelect,
  // historialQueries, los PDFs y ticketGenerator lo leen asi.
  const bancoEfectivoNombre =
    ultimoViaje?.bancos_override?.banco ?? detalle?.bancos?.banco ?? null;

  // ─── Cargar configuración de tiempo mínimo ────────────────────────────────

  const cargarConfiguracion = useCallback(async () => {
    if (!idObra) return;
    try {
      // Si la migración 20260804_tiempo_dinamico_y_motivos aún no corrió, el
      // select con las columnas nuevas falla entero. Se reintenta con el select
      // viejo para no perder min_minutos_entre_viajes — el umbral queda como
      // estaba antes de este cambio en vez de caer al default genérico.
      let obra = null;
      const { data, error } = await supabase
        .from("obras")
        .select(
          "min_minutos_entre_viajes, velocidad_promedio_kmh, minutos_carga_descarga, factor_tolerancia_tiempo",
        )
        .eq("id_obra", idObra)
        .single();

      if (error) {
        const { data: basico, error: errorBasico } = await supabase
          .from("obras")
          .select("min_minutos_entre_viajes")
          .eq("id_obra", idObra)
          .single();
        if (errorBasico) throw errorBasico;
        obra = basico;
      } else {
        obra = data;
      }

      // El piso histórico es opcional. Si la vista no existe o falla, se sigue
      // con la fórmula: nunca puede impedir registrar un viaje.
      //
      // Se filtra por es_planta_asfaltos porque un vale de planta se carga a la
      // obra pero descarga en la Planta de Asfaltos: es otra ruta desde el
      // mismo banco, con otra distancia (distancias_banco_planta) y otro
      // tiempo. Mezclarlas daria un piso que no describe ninguna de las dos.
      let historico = null;
      if (idBancoEfectivo) {
        const { data: fila, error: errorHistorico } = await supabase
          .from("ciclos_banco_obra")
          .select("n_ciclos, p05_minutos")
          .eq("id_obra", idObra)
          .eq("id_banco", idBancoEfectivo)
          .eq("es_planta_asfaltos", !!detalle?.es_planta_asfaltos)
          .maybeSingle();
        if (!errorHistorico) historico = fila;
      }

      const { minutos, origen } = resolverTiempoMinimo({
        distanciaKm: distanciaEfectivaKm,
        obra,
        historico,
      });

      setMinMinutosEntreViajes(minutos);
      setOrigenTiempoMinimo(origen);
    } catch (error) {
      console.error("[useViajesMaterial] Error cargando configuracion:", error);
      setOrigenTiempoMinimo("fallback");
    }
  }, [idObra, idBancoEfectivo, distanciaEfectivaKm, detalle?.es_planta_asfaltos]);

  // ─── Cargar viajes existentes ─────────────────────────────────────────────

  const cargarViajes = useCallback(async () => {
    if (!idDetalleMaterial) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vale_material_viajes")
        .select(
          `
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
          foto_evidencia_url,
          latitud_registro,
          longitud_registro,
          distancia_obra_metros,
          registro_anticipado,
          minutos_minimos_calculados,
          minutos_faltantes_anticipado,
          motivo_anticipado_codigo,
          motivo_anticipado_texto,
          foto_omitida,
          motivo_sin_foto_codigo,
          motivo_sin_foto_texto,
          bancos_override:id_banco_override (id_banco, banco),
          persona:id_persona_registro (
            nombre,
            primer_apellido
          )
        `,
        )
        .eq("id_detalle_material", idDetalleMaterial)
        .order("numero_viaje", { ascending: true });

      if (error) throw error;
      setViajes(data || []);
    } catch (error) {
      console.error("[useViajesMaterial] Error cargando viajes:", error);
    } finally {
      setLoading(false);
    }
  }, [idDetalleMaterial]);

  // ─── Calcular minutos restantes ───────────────────────────────────────────

  const calcularMinutosRestantes = useCallback(
    (viajesActuales) => {
      const ahora = new Date();

      if (viajesActuales.length === 0) return 0;

      const ultimoViaje = viajesActuales[viajesActuales.length - 1];
      const horaUltimo = new Date(ultimoViaje.hora_registro);
      const diffMinutos = (ahora - horaUltimo) / (1000 * 60);
      const restantes = minMinutosEntreViajes - diffMinutos;
      return restantes > 0 ? Math.ceil(restantes) : 0;
    },
    [minMinutosEntreViajes],
  );

  // ─── Iniciar cuenta regresiva ─────────────────────────────────────────────

  const iniciarCuentaRegresiva = useCallback(
    (viajesActuales) => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      const restantes = calcularMinutosRestantes(viajesActuales);
      setMinutosRestantes(restantes);

      if (restantes > 0) {
        intervaloRef.current = setInterval(() => {
          const nuevosRestantes = calcularMinutosRestantes(viajesActuales);
          setMinutosRestantes(nuevosRestantes);
          if (nuevosRestantes <= 0) {
            clearInterval(intervaloRef.current);
            intervaloRef.current = null;
          }
          // 15 s y no 30: con umbrales cortos (5-8 min en bancos cercanos) un
          // desfase de medio minuto es proporcionalmente grande.
        }, 15000);
      }
    },
    [calcularMinutosRestantes],
  );

  const puedeRegistrar = useCallback(() => {
    return minutosRestantes <= 0;
  }, [minutosRestantes]);

  // ─── Calcular m³ desde toneladas ──────────────────────────────────────────

  const calcularVolumenDesdeTomeladas = useCallback(
    async (pesoTon) => {
      const { data, error } = await supabase
        .from("peso_especifico")
        .select("peso_especifico")
        .eq("id_material", detalle.id_material)
        .eq("id_banco", detalle.id_banco)
        .single();

      if (error || !data) {
        throw new Error(
          "No se encontró el peso específico para este material y banco",
        );
      }

      const factor = parseFloat(data.peso_especifico);
      if (!factor || factor <= 0) throw new Error("Peso específico inválido");

      return parseFloat((pesoTon / factor).toFixed(3));
    },
    [detalle?.id_material, detalle?.id_banco],
  );


  // ─── Registrar viaje ──────────────────────────────────────────────────────

  const registrarViaje = useCallback(
    async ({
      pesoTon,
      volumenDirecto,
      folioValeFisico,
      motivoAnticipado = null,
    } = {}) => {
      const esAdministrador = userProfile?.roles?.role === "Administrador";
      const esChecador = userProfile?.roles?.role === "CHECADOR";

      if (esChecador && detalle?.es_planta_asfaltos) {
        Alert.alert(
          "No disponible",
          "Este vale es de la Planta de Asfaltos. Solo un perfil de Planta de Asfaltos puede registrar viajes aqui.",
        );
        return false;
      }

      if (!esAdministrador && !esDentroJornada(fechaCreacionVale, esProgramado)) {
        Alert.alert(
          "Vale fuera de jornada",
          "Este vale fue creado en una jornada anterior y ya no puede recibir viajes. Usa un vale del dia de hoy.",
          [{ text: "Entendido" }],
        );
        return false;
      }

      // El tiempo mínimo ya no es un muro: se puede pasar dejando un motivo
      // escrito, que se guarda con el viaje. Sin motivo válido sigue siendo un
      // bloqueo — nunca se salta el umbral sin dejar rastro.
      // A diferencia de la jornada, aquí el Administrador NO está exento: es
      // justamente quien captura vales fuera de campo, el caso que se audita.
      const minutosFaltantes = minutosRestantes;
      const esRegistroAnticipado = !puedeRegistrar();

      if (esRegistroAnticipado && !motivoEsValido(motivoAnticipado)) {
        Alert.alert(
          "No disponible",
          `Faltan ${minutosFaltantes} min para registrar el siguiente viaje.`,
          [{ text: "OK" }],
        );
        return false;
      }

      if (!userProfile?.id_persona) {
        Alert.alert("Error", "No se pudo obtener la información del usuario.");
        return false;
      }

      if (!detalle) {
        Alert.alert("Error", "No se encontró el detalle del vale.");
        return false;
      }

      return new Promise((resolve) => {
        // Con motivo anticipado el usuario ya confirmo en el modal de motivo;
        // un segundo dialogo encadenado solo lo entrena a aceptar sin leer.
        const confirmar = async () => {
          try {
            setRegistrando(true);

            // PASO 1: Calcular volumen m³
            let volumenM3;
            if (volumenDirecto != null) {
              volumenM3 = parseFloat(volumenDirecto);
            } else if (pesoTon != null) {
              volumenM3 = await calcularVolumenDesdeTomeladas(
                parseFloat(pesoTon),
              );
            } else {
              throw new Error(
                "Se requiere peso en toneladas o volumen en m³",
              );
            }

            if (!volumenM3 || volumenM3 <= 0) {
              throw new Error("El volumen calculado no es válido");
            }

            // PASO 2: Obtener obra, sindicato y tipo de material en una sola query.
            // id_obra es lo que decide si aplica la tarifa propia de la
            // obra o la del sindicato (ver utils/preciosMaterial.js).
            const { data: valeData, error: errorVale } = await supabase
              .from("vales")
              .select(
                `id_obra,
                vehiculos:id_vehiculo(id_sindicato),
                vale_material_detalles!inner(
                  material:id_material(id_tipo_de_material)
                )`,
              )
              .eq("id_vale", idVale)
              .single();

            if (errorVale || !valeData)
              throw new Error("No se pudo obtener datos del vale");

            const idSindicato = valeData.vehiculos?.id_sindicato;
            const idTipoDeMaterial =
              valeData.vale_material_detalles?.[0]?.material?.id_tipo_de_material;

            if (!idSindicato)
              throw new Error(
                "No se pudo obtener el sindicato del vehículo",
              );
            if (!idTipoDeMaterial)
              throw new Error("No se pudo obtener el tipo de material");

            const costos = await calcularCostoValeMaterial(
              idTipoDeMaterial,
              idSindicato,
              detalle.distancia_km,
              volumenM3,
              valeData.id_obra,
            );

            // PASO 3: Insertar viaje
            const { data: viajeNuevo, error: errorInsert } =
              await supabase
                .from("vale_material_viajes")
                .insert({
                  id_detalle_material: idDetalleMaterial,
                  numero_viaje: viajes.length + 1,
                  hora_registro: new Date().toISOString(),
                  id_persona_registro: userProfile.id_persona,
                  peso_ton: pesoTon != null ? parseFloat(pesoTon) : null,
                  volumen_m3: volumenM3,
                  precio_m3: costos.precioM3,
                  costo_viaje: costos.costoTotal,
                  id_precios_material: costos.idPreciosMaterial,
                  id_precios_material_obra: costos.idPreciosMaterialObra,
                  tarifa_primer_km: costos.tarifaPrimerKm,
                  tarifa_subsecuente: costos.tarifaSubsecuente,
                  folio_vale_fisico: folioValeFisico || null,
                  // Se guarda siempre, no solo cuando es anticipado: es
                  // lo unico que permite auditar despues si el umbral
                  // quedo bien calibrado contra los ciclos reales.
                  minutos_minimos_calculados: minMinutosEntreViajes,
                  registro_anticipado: esRegistroAnticipado,
                  minutos_faltantes_anticipado: esRegistroAnticipado
                    ? minutosFaltantes
                    : null,
                  motivo_anticipado_codigo: esRegistroAnticipado
                    ? motivoAnticipado.codigo
                    : null,
                  motivo_anticipado_texto: esRegistroAnticipado
                    ? motivoAnticipado.texto?.trim() || null
                    : null,
                })
                .select(
                  `
                  id_viaje,
                  numero_viaje,
                  hora_registro,
                  peso_ton,
                  volumen_m3,
                  precio_m3,
                  costo_viaje,
                  folio_vale_fisico,
                  foto_evidencia_url,
                  latitud_registro,
                  longitud_registro,
                  distancia_obra_metros,
                  registro_anticipado,
                  minutos_minimos_calculados,
                  minutos_faltantes_anticipado,
                  motivo_anticipado_codigo,
                  motivo_anticipado_texto,
                  foto_omitida,
                  motivo_sin_foto_codigo,
                  motivo_sin_foto_texto,
                  persona:id_persona_registro (
                    nombre,
                    primer_apellido
                  )
                `,
                )
                .single();

            if (errorInsert) throw errorInsert;

            // PASO 4: Acumular totales en vale_material_detalles
            const totalVolumen = viajes.reduce(
              (acc, v) => acc + parseFloat(v.volumen_m3 || 0),
              volumenM3,
            );
            const totalCosto = viajes.reduce(
              (acc, v) =>
                acc +
                parseFloat(v.costo_viaje_override ?? v.costo_viaje ?? 0),
              costos.costoTotal,
            );
            const totalPeso =
              pesoTon != null
                ? viajes.reduce(
                    (acc, v) => acc + parseFloat(v.peso_ton || 0),
                    parseFloat(pesoTon),
                  )
                : null;

            const { error: errorDetalles } = await supabase
              .from("vale_material_detalles")
              .update({
                volumen_real_m3: totalVolumen,
                costo_total: totalCosto,
                ...(totalPeso != null && { peso_ton: totalPeso }),
                precio_m3: costos.precioM3,
                id_precios_material: costos.idPreciosMaterial,
                id_precios_material_obra: costos.idPreciosMaterialObra,
                tarifa_primer_km: costos.tarifaPrimerKm,
                tarifa_subsecuente: costos.tarifaSubsecuente,
              })
              .eq("id_detalle_material", idDetalleMaterial);

            if (errorDetalles) throw errorDetalles;

            const viajesActualizados = [...viajes, viajeNuevo];
            setViajes(viajesActualizados);
            iniciarCuentaRegresiva(viajesActualizados);
            resolve(viajeNuevo);
          } catch (error) {
            console.error(
              "[useViajesMaterial] Error registrando viaje:",
              error,
            );
            Alert.alert(
              "Error",
              `No se pudo registrar el viaje: ${error.message}`,
              [{ text: "OK" }],
            );
            resolve(false);
          } finally {
            setRegistrando(false);
          }
        };

        if (esRegistroAnticipado) {
          confirmar();
          return;
        }

        Alert.alert(
          "Registrar Viaje",
          `Se registrará el viaje ${viajes.length + 1}. Esta acción no se puede revertir. ¿Deseas continuar?`,
          [
            { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
            { text: "Confirmar", style: "default", onPress: confirmar },
          ],
        );
      });
    },
    [
      puedeRegistrar,
      minutosRestantes,
      minMinutosEntreViajes,
      viajes,
      idDetalleMaterial,
      idVale,
      detalle,
      userProfile,
      calcularVolumenDesdeTomeladas,
      iniciarCuentaRegresiva,
      fechaCreacionVale,
      esProgramado,
    ],
  );

  // ─── Eliminar último viaje ────────────────────────────────────────────────

  const eliminarUltimoViaje = useCallback(
    async (idViaje) => {
      try {
        setEliminandoViaje(true);
        const { error } = await supabase
          .from("vale_material_viajes")
          .delete()
          .eq("id_viaje", idViaje);
        if (error) throw error;

        const viajesRestantes = viajes.slice(0, -1);

        const totalVolumen = viajesRestantes.reduce(
          (acc, v) => acc + parseFloat(v.volumen_m3 || 0),
          0,
        );
        const totalCosto = viajesRestantes.reduce(
          (acc, v) => acc + parseFloat(v.costo_viaje_override ?? v.costo_viaje ?? 0),
          0,
        );
        const tienePeso = viajesRestantes.some((v) => v.peso_ton != null);
        const totalPeso = tienePeso
          ? viajesRestantes.reduce(
              (acc, v) => acc + parseFloat(v.peso_ton || 0),
              0,
            )
          : null;

        const { error: errorDetalles } = await supabase
          .from("vale_material_detalles")
          .update({
            volumen_real_m3: totalVolumen,
            costo_total: totalCosto,
            ...(totalPeso != null && { peso_ton: totalPeso }),
          })
          .eq("id_detalle_material", idDetalleMaterial);

        if (errorDetalles) throw errorDetalles;

        setViajes(viajesRestantes);
        return true;
      } catch (error) {
        console.error("[useViajesMaterial] Error eliminando viaje:", error);
        Alert.alert("Error", "No se pudo eliminar el viaje.");
        return false;
      } finally {
        setEliminandoViaje(false);
      }
    },
    [viajes, idDetalleMaterial],
  );

  // ─── Completar vale ───────────────────────────────────────────────────────

  const completarVale = useCallback(
    async ({ idPersona, notasAdicionales } = {}) => {
      const t0 = Date.now();
      try {
        setSaving(true);

        const tUpdates = Date.now();
        const [{ error }, { error: errorNotas }] = await Promise.all([
          supabase
            .from("vales")
            .update({
              estado: "emitido",
              id_persona_completador: idPersona,
              fecha_completado: new Date().toISOString(),
            })
            .eq("id_vale", idVale),
          supabase
            .from("vale_material_detalles")
            .update({
              notas_adicionales: notasAdicionales ?? null,
            })
            .eq("id_detalle_material", idDetalleMaterial),
        ]);

        if (error) throw error;
        if (errorNotas) throw errorNotas;
        console.log(`[PERF][completar] updates BD (paralelo): ${Date.now() - tUpdates}ms`);

        const tQuery = Date.now();
        const { data: valeCompleto, error: errorConsulta } = await supabase
          .from("vales")
          .select(
            `
            *,
            obras:id_obra (obra, cc, empresas:id_empresa (empresa, sufijo, logo)),
            persona:id_persona_creador (nombre, primer_apellido, segundo_apellido),
            persona_completador:id_persona_completador (nombre, primer_apellido, segundo_apellido),
            operadores:id_operador (nombre_completo),
            vehiculos:id_vehiculo (placas, capacidad_m3, sindicatos:id_sindicato (sindicato)),
            vale_material_detalles (
            *,
            material:id_material (id_material, material, id_tipo_de_material),
            bancos:id_banco (id_banco, banco),
            sindicatos:id_sindicato (sindicato),
            vale_material_viajes (
                id_viaje,
                numero_viaje,
                hora_registro,
                peso_ton,
                volumen_m3,
                folio_vale_fisico,
                precio_m3,
                costo_viaje,
                id_banco_override,
                distancia_km_override,
                precio_m3_override,
                costo_viaje_override,
                foto_evidencia_url,
                latitud_registro,
                longitud_registro,
                distancia_obra_metros,
                bancos_override:id_banco_override (id_banco, banco)
              )
            )
            `,
          )
          .eq("id_vale", idVale)
          .single();

        if (errorConsulta) throw errorConsulta;
        console.log(`[PERF][completar] query valeCompleto: ${Date.now() - tQuery}ms`);
        console.log(`[PERF][completar] total completarVale: ${Date.now() - t0}ms`);
        return valeCompleto;
      } catch (error) {
        console.error("[useViajesMaterial] Error completando vale:", error);
        Alert.alert("Error", `No se pudo completar el vale: ${error.message}`);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [idVale, idDetalleMaterial],
  );

  // ─── Actualizar foto de un viaje ─────────────────────────────────────────

  // motivoSinFoto solo se usa cuando NO hay foto: registra por qué no se tomó,
  // en vez de dejar el viaje sin evidencia y sin explicación (o con una foto de
  // la nada, que es lo que pasaba cuando la foto era obligatoria).
  const actualizarFotoViaje = useCallback(
    async (idViaje, fotoUrl, latitud, longitud, distanciaObra, motivoSinFoto = null) => {
      const omitida = !fotoUrl && motivoEsValido(motivoSinFoto);
      const campos = {
        foto_evidencia_url: fotoUrl ?? null,
        latitud_registro: latitud ?? null,
        longitud_registro: longitud ?? null,
        distancia_obra_metros: distanciaObra ?? null,
        foto_omitida: omitida,
        motivo_sin_foto_codigo: omitida ? motivoSinFoto.codigo : null,
        motivo_sin_foto_texto: omitida
          ? motivoSinFoto.texto?.trim() || null
          : null,
      };

      try {
        const { error } = await supabase
          .from("vale_material_viajes")
          .update(campos)
          .eq("id_viaje", idViaje);

        if (error) throw error;

        setViajes((prev) =>
          prev.map((v) => (v.id_viaje === idViaje ? { ...v, ...campos } : v)),
        );

        return true;
      } catch (error) {
        console.error(
          "[useViajesMaterial] Error actualizando foto viaje:",
          error,
        );
        Alert.alert(
          "Error",
          omitida
            ? "No se pudo guardar el motivo. Intenta de nuevo."
            : "No se pudo guardar la foto del viaje.",
        );
        return false;
      }
    },
    [],
  );

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  useEffect(() => {
    cargarViajes();
  }, [cargarViajes]);

  // minMinutosEntreViajes va en las deps porque el umbral llega de forma
  // asincrona (obras + vista de historico). Sin el, la cuenta regresiva se
  // quedaria congelada con el valor por defecto.
  useEffect(() => {
    if (!loading) {
      iniciarCuentaRegresiva(viajes);
    }
  }, [loading, minMinutosEntreViajes]);

  useEffect(() => {
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, []);

  return {
    viajes,
    loading,
    registrando,
    saving,
    eliminandoViaje,
    totalViajes: viajes.length,
    puedeRegistrar: puedeRegistrar(),
    minutosRestantes,
    minutosMinimos: minMinutosEntreViajes,
    origenTiempoMinimo,
    distanciaEfectivaKm,
    bancoEfectivoNombre,
    registrarViaje,
    completarVale,
    actualizarFotoViaje,
    eliminarUltimoViaje,
    recargarViajes: cargarViajes,
  };
};
