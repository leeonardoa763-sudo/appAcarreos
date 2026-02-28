/**
 * hooks/useValeMaterialLogic.js
 *
 * Hook para manejar la lógica de tipo de material y creación de vales
 */

import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import { generateVerificationUrl } from "../utils/qrGenerator";
import { calcularCostoValeMaterial } from "../utils/preciosMaterial";
import { useFeatureFlags } from "./useFeatureFlags";

export const useValeMaterialLogic = (materiales) => {
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [generarCopiaRoja, setGenerarCopiaRoja] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { flags } = useFeatureFlags();

  // Efecto: Determinar tipo de copia según material y feature flags
  useEffect(() => {
    if (!materiales || materiales.length === 0) return;

    const materialId = materialSeleccionado?.id_material;
    if (!materialId) {
      setGenerarCopiaRoja(true);
      return;
    }

    const material = materiales.find((m) => m.id_material === materialId);
    if (!material) return;

    const tipoDeMaterial = material.id_tipo_de_material;

    /*
     * LÓGICA ORIGINAL (flujo dos pasos para todos):
     * const nuevaCopiaRoja = true;
     *
     * Reemplazada por lógica condicional via FEATURE_FLAGS
     */
    let nuevaCopiaRoja = true;

    if (tipoDeMaterial === 3 && !flags.TIPO3_FLUJO_DOS_PASOS) {
      // Tepetate en flujo directo: no genera copia roja
      nuevaCopiaRoja = false;
    }

    if (tipoDeMaterial === 2 && !flags.TIPO2_GENERAR_PDF_ROJO) {
      // Carpeta asfáltica: tampoco genera copia roja
      nuevaCopiaRoja = false;
    }

    if (generarCopiaRoja !== nuevaCopiaRoja) {
      setGenerarCopiaRoja(nuevaCopiaRoja);
    }
  }, [materialSeleccionado, materiales]);

  // Función: Crear vale de material
  const crearVale = async (
    formData,
    obraData,
    userProfile,
    generateFolio,
    materiales,
  ) => {
    console.log("[useValeMaterialLogic] Iniciando creación de vale...");
    setSubmitting(true);

    try {
      // PASO 1: Generar folio
      const folio = await generateFolio(obraData);
      console.log("[useValeMaterialLogic] Folio generado:", folio);

      // PASO 2: Verificar folio único
      const { data: verificacion } = await supabase
        .from("vales")
        .select("folio")
        .eq("folio", folio)
        .maybeSingle();

      if (verificacion) {
        throw new Error(`El folio ${folio} ya existe`);
      }

      // PASO 3: URL de verificación
      const verificationUrl = generateVerificationUrl(folio);

      // PASO 4: Determinar estado inicial según tipo de material y feature flags
      const tipoDeMaterial = materiales.find(
        (m) => m.id_material === formData.materialId,
      )?.id_tipo_de_material;

      const esTipo3DirectFlow =
        tipoDeMaterial === 3 && !flags.TIPO3_FLUJO_DOS_PASOS;

      /*
       * LÓGICA ORIGINAL:
       * estado: generarCopiaRoja ? "en_proceso" : "emitido"
       *
       * Nueva lógica: Tipo 3 en flujo directo va a "emitido" inmediatamente.
       * Tipo 2 y el resto van a "en_proceso".
       */
      const estadoInicial = esTipo3DirectFlow ? "emitido" : "en_proceso";

      const { data: valeNuevo, error: errorVale } = await supabase
        .from("vales")
        .insert([
          {
            folio: folio,
            tipo_vale: "material",
            id_obra: obraData.id_obra,
            id_empresa: obraData.empresas.id_empresa,
            id_persona_creador: userProfile.id_persona,
            id_operador: formData.completarDespues
              ? null
              : formData.selectedOperador?.id_operador,
            id_vehiculo: formData.completarDespues
              ? null
              : formData.selectedVehiculo?.id_vehiculo,
            estado: estadoInicial,
            qr_verification_url: verificationUrl,
            // Tepetate flujo directo: la misma persona es computadora y emisora
            ...(esTipo3DirectFlow && {
              id_persona_completador: userProfile.id_persona,
              fecha_completado: new Date().toISOString(),
            }),
          },
        ])
        .select()
        .single();

      if (errorVale) {
        console.error(
          "[useValeMaterialLogic] Error insertando vale:",
          errorVale,
        );
        throw errorVale;
      }

      console.log("[useValeMaterialLogic] Vale insertado:", valeNuevo.id_vale);

      console.log("[useValeMaterialLogic] Vale insertado:", valeNuevo.id_vale);

      // PASO 5: NO calcular precio en creación inicial
      // Ahora TODOS los vales se completan después de creados
      console.log(
        "[useValeMaterialLogic] Creando vale sin precio - se completará después",
      );

      // PASO 6: Insertar detalles
      const detalleInsert = {
        id_vale: valeNuevo.id_vale,
        id_material: formData.materialId,
        id_banco: formData.bancoId,
        capacidad_m3: parseFloat(formData.capacidad),
        distancia_km: parseFloat(formData.distancia),
        cantidad_pedida_m3: parseFloat(formData.cantidadSolicitada),
        peso_ton: null,
        notas_adicionales: formData.notasAdicionales || null,
        requisicion: formData.requisicion || null,
        // NUEVO: Folio vale físico, solo para tipo 3 en flujo directo
        folio_vale_fisico: esTipo3DirectFlow
          ? parseInt(formData.folioValeFisico, 10)
          : null,
      };

      const { error: errorDetalle } = await supabase
        .from("vale_material_detalles")
        .insert([detalleInsert]);

      if (errorDetalle) {
        console.error(
          "[useValeMaterialLogic] Error insertando detalles:",
          errorDetalle,
        );
        throw errorDetalle;
      }

      console.log("[useValeMaterialLogic] Detalles insertados correctamente");

      // PASO 6.5: Si es Tepetate flujo directo, calcular y guardar precio inmediatamente
      if (esTipo3DirectFlow) {
        try {
          const { data: vehiculoData } = await supabase
            .from("vehiculos")
            .select("id_sindicato")
            .eq("id_vehiculo", formData.selectedVehiculo?.id_vehiculo)
            .single();

          if (vehiculoData) {
            const costos = await calcularCostoValeMaterial(
              tipoDeMaterial,
              vehiculoData.id_sindicato,
              parseFloat(formData.distancia),
              parseFloat(formData.cantidadSolicitada),
            );

            await supabase
              .from("vale_material_detalles")
              .update({
                volumen_real_m3: parseFloat(formData.cantidadSolicitada),
                precio_m3: costos.precioM3,
                costo_total: costos.costoTotal,
                id_precios_material: costos.idPreciosMaterial,
                tarifa_primer_km: costos.tarifaPrimerKm,
                tarifa_subsecuente: costos.tarifaSubsecuente,
              })
              .eq("id_vale", valeNuevo.id_vale);
          }
        } catch (errorPrecio) {
          // No bloqueamos el flujo si falla el precio, el vale ya quedó emitido
          console.error(
            "[useValeMaterialLogic] Error calculando precio tipo3:",
            errorPrecio,
          );
        }
      }

      // PASO 7: Consultar vale completo
      const { data: valeCompleto, error: errorConsulta } = await supabase
        .from("vales")
        .select(
          `
        *,
        obras:id_obra (
          id_obra,
          obra,
          cc,
          empresas:id_empresa (
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
        operadores:id_operador (
          nombre_completo
        ),
        vehiculos:id_vehiculo (
          placas,
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
          )
        )
      `,
        )
        .eq("id_vale", valeNuevo.id_vale)
        .single();

      if (errorConsulta) {
        console.error(
          "[useValeMaterialLogic] Error consultando vale:",
          errorConsulta,
        );
        throw errorConsulta;
      }

      if (!valeCompleto?.obras || !valeCompleto?.vale_material_detalles) {
        console.error("[useValeMaterialLogic] Vale incompleto:", valeCompleto);
        throw new Error("El vale no tiene todos los datos necesarios");
      }

      console.log("[useValeMaterialLogic] Vale creado exitosamente");

      return { valeCompleto, folio };
    } catch (error) {
      console.error("[useValeMaterialLogic] Error completo:", error);
      console.error("[useValeMaterialLogic] Stack:", error.stack);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    materialSeleccionado,
    setMaterialSeleccionado,
    generarCopiaRoja,
    submitting,
    crearVale,
    tipoMaterialSeleccionado: materialSeleccionado?.id_tipo_de_material ?? null,
  };
};
