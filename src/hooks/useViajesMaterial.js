/**
 * hooks/useViajesMaterial.js
 *
 * Hook para registrar y cargar viajes de un vale de material.
 * Análogo a useViajesRenta pero con lógica de:
 * - Captura de peso en toneladas (opcional según tipo)
 * - Conversión ton → m³ usando peso_especifico
 * - Cálculo de costo por viaje al momento de registrar
 * - Folio vale físico (solo tipo 3 / tepetate)
 * - Tiempo mínimo entre viajes (min_minutos_entre_viajes de obras)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";
import { calcularCostoValeMaterial } from "../utils/preciosMaterial";

const MINUTOS_DEFAULT = 20;

export const useViajesMaterial = (
  idDetalleMaterial,
  idVale,
  detalle,
  idObra,
) => {
  const { userProfile } = useAuth();
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [minutosRestantes, setMinutosRestantes] = useState(0);
  const [minMinutosEntreViajes, setMinMinutosEntreViajes] =
    useState(MINUTOS_DEFAULT);
  const intervaloRef = useRef(null);

  // ─── Cargar configuración de tiempo mínimo ────────────────────────────────

  const cargarConfiguracion = useCallback(async () => {
    if (!idObra) return;
    try {
      const { data, error } = await supabase
        .from("obras")
        .select("min_minutos_entre_viajes")
        .eq("id_obra", idObra)
        .single();

      if (error) throw error;

      const valor = data?.min_minutos_entre_viajes ?? MINUTOS_DEFAULT;
      setMinMinutosEntreViajes(valor);
    } catch (error) {
      console.error("[useViajesMaterial] Error cargando configuracion:", error);
    }
  }, [idObra]);

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
        }, 30000);
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

  // ─── Obtener sindicato del vehículo ───────────────────────────────────────

  const obtenerSindicatoVehiculo = useCallback(async (idVehiculo) => {
    const { data, error } = await supabase
      .from("vehiculos")
      .select("id_sindicato")
      .eq("id_vehiculo", idVehiculo)
      .single();

    if (error || !data)
      throw new Error("No se pudo obtener el sindicato del vehículo");
    return data.id_sindicato;
  }, []);

  // ─── Registrar viaje ──────────────────────────────────────────────────────

  const registrarViaje = useCallback(
    async ({ pesoTon, volumenDirecto, folioValeFisico } = {}) => {
      if (!puedeRegistrar()) {
        Alert.alert(
          "No disponible",
          `Debes esperar ${minutosRestantes} min antes de registrar el siguiente viaje.`,
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
        Alert.alert(
          "Registrar Viaje",
          `Se registrará el viaje ${viajes.length + 1}. Esta acción no se puede revertir. ¿Deseas continuar?`,
          [
            {
              text: "Cancelar",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "Confirmar",
              style: "default",
              onPress: async () => {
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

                  // PASO 2: Obtener sindicato del vehículo y calcular costo
                  const { data: valeData, error: errorVale } = await supabase
                    .from("vales")
                    .select(
                      "id_vehiculo, vale_material_detalles!inner(id_tipo_de_material:id_material(id_tipo_de_material))",
                    )
                    .eq("id_vale", idVale)
                    .single();

                  if (errorVale || !valeData)
                    throw new Error("No se pudo obtener datos del vale");

                  const idSindicato = await obtenerSindicatoVehiculo(
                    valeData.id_vehiculo,
                  );

                  const { data: materialData, error: errorMaterial } =
                    await supabase
                      .from("material")
                      .select("id_tipo_de_material")
                      .eq("id_material", detalle.id_material)
                      .single();

                  if (errorMaterial || !materialData)
                    throw new Error("No se pudo obtener el tipo de material");

                  const costos = await calcularCostoValeMaterial(
                    materialData.id_tipo_de_material,
                    idSindicato,
                    detalle.distancia_km,
                    volumenM3,
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
                        tarifa_primer_km: costos.tarifaPrimerKm,
                        tarifa_subsecuente: costos.tarifaSubsecuente,
                        folio_vale_fisico: folioValeFisico || null,
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
                    (acc, v) => acc + parseFloat(v.costo_viaje || 0),
                    costos.costoTotal,
                  );
                  const totalPeso =
                    pesoTon != null
                      ? viajes.reduce(
                          (acc, v) => acc + parseFloat(v.peso_ton || 0),
                          parseFloat(pesoTon),
                        )
                      : null;

                  await supabase
                    .from("vale_material_detalles")
                    .update({
                      volumen_real_m3: totalVolumen,
                      costo_total: totalCosto,
                      ...(totalPeso != null && { peso_ton: totalPeso }),
                      precio_m3: costos.precioM3,
                      id_precios_material: costos.idPreciosMaterial,
                      tarifa_primer_km: costos.tarifaPrimerKm,
                      tarifa_subsecuente: costos.tarifaSubsecuente,
                    })
                    .eq("id_detalle_material", idDetalleMaterial);

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
              },
            },
          ],
        );
      });
    },
    [
      puedeRegistrar,
      minutosRestantes,
      viajes,
      idDetalleMaterial,
      idVale,
      detalle,
      userProfile,
      calcularVolumenDesdeTomeladas,
      obtenerSindicatoVehiculo,
      iniciarCuentaRegresiva,
    ],
  );

  // ─── Completar vale ───────────────────────────────────────────────────────

  const completarVale = useCallback(
    async ({ fotoUrl, ubicacion, distanciaObra, idPersona } = {}) => {
      try {
        setSaving(true);

        const { error } = await supabase
          .from("vales")
          .update({
            estado: "emitido",
            id_persona_completador: idPersona,
            fecha_completado: new Date().toISOString(),
          })
          .eq("id_vale", idVale);

        if (error) throw error;

        const { error: errorEvidencia } = await supabase
          .from("vale_material_detalles")
          .update({
            foto_evidencia_url: fotoUrl ?? null,
            latitud_completado: ubicacion?.latitud ?? null,
            longitud_completado: ubicacion?.longitud ?? null,
            distancia_obra_metros: distanciaObra ?? null,
          })
          .eq("id_detalle_material", idDetalleMaterial);

        if (errorEvidencia) throw errorEvidencia;

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
                folio_vale_fisico
            )
            )
            `,
          )
          .eq("id_vale", idVale)
          .single();

        if (errorConsulta) throw errorConsulta;
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

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  useEffect(() => {
    cargarViajes();
  }, [cargarViajes]);

  useEffect(() => {
    if (!loading) {
      iniciarCuentaRegresiva(viajes);
    }
  }, [loading]);

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
    totalViajes: viajes.length,
    puedeRegistrar: puedeRegistrar(),
    minutosRestantes,
    registrarViaje,
    completarVale,
    recargarViajes: cargarViajes,
  };
};
