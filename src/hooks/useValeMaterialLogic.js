/**
 * hooks/useValeMaterialLogic.js
 *
 * Hook para manejar la lógica de tipo de material y creación de vales
 */

import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { supabase } from "../config/supabase";
import { generateVerificationUrl } from "../utils/qrGenerator";
import {
  calcularCostoValeMaterial,
  verificarTarifaMaterial,
} from "../utils/preciosMaterial";
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

    let nuevaCopiaRoja = true;

    if (tipoDeMaterial === 2 && !flags.TIPO2_GENERAR_PDF_ROJO) {
      // Carpeta asfáltica: tampoco genera copia roja
      nuevaCopiaRoja = false;
    }

    if (generarCopiaRoja !== nuevaCopiaRoja) {
      setGenerarCopiaRoja(nuevaCopiaRoja);
    }
  }, [materialSeleccionado, materiales]);

  // Función interna: crea UN vale con un folio ya calculado
  const _insertarVale = async (
    formData,
    obraData,
    userProfile,
    folio,
    materiales,
    options = {},
  ) => {
    try {
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

      const estadoInicial = options.estadoInicial || "en_proceso";
      const idOperador = options.idOperador ?? formData.selectedOperador?.id_operador ?? null;
      const idVehiculo = options.idVehiculo ?? formData.selectedVehiculo?.id_vehiculo ?? null;

      const capacidadM3 = options.capacidadM3 ??
        (formData.selectedVehiculo?.capacidad_m3 ||
          (formData.capacidad ? parseFloat(formData.capacidad) : null));

      const cantidadPedida = options.cantidadPedidaM3 ??
        (formData.cantidadMaterial ? parseFloat(formData.cantidadMaterial) : null);

      // PASO 4: Verificar la tarifa ANTES de insertar el vale.
      // El calculo de precio corre despues del insert (PASO 6); si la tarifa no
      // existia, el vale quedaba creado y sin detalle — folio quemado — y el
      // error salia como "Cannot coerce the result to a single JSON object".
      const materialSeleccionado = materiales.find(
        (m) => m.id_material === formData.materialId,
      );
      const tipoMaterial = materialSeleccionado?.id_tipo_de_material ?? null;
      const requiereTarifa = Boolean(
        tipoMaterial &&
          formData.sindicatoId &&
          formData.distancia &&
          cantidadPedida,
      );

      if (requiereTarifa) {
        await verificarTarifaMaterial(tipoMaterial, formData.sindicatoId);
      }

      const { data: valeNuevo, error: errorVale } = await supabase
        .from("vales")
        .insert([
          {
            folio: folio,
            tipo_vale: "material",
            id_obra: obraData.id_obra,
            id_empresa: obraData.empresas.id_empresa,
            id_persona_creador: userProfile.id_persona,
            id_operador: idOperador,
            id_vehiculo: idVehiculo,
            estado: estadoInicial,
            qr_verification_url: verificationUrl,
            es_programado: options.esProgramado ?? false,
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



      // PASO 5: NO calcular precio en creación inicial
      // Ahora TODOS los vales se completan después de creados

      // PASO 6: Insertar detalles
      let precioM3 = null;
      let costoTotal = null;
      let idPreciosMaterial = null;
      let tarifaPrimerKm = null;
      let tarifaSubsecuente = null;

      if (requiereTarifa) {
        const precioData = await calcularCostoValeMaterial(
          tipoMaterial,
          formData.sindicatoId,
          parseFloat(formData.distancia),
          cantidadPedida,
        );

        precioM3 = precioData.precioM3;
        costoTotal = precioData.costoTotal;
        idPreciosMaterial = precioData.idPreciosMaterial;
        tarifaPrimerKm = precioData.tarifaPrimerKm;
        tarifaSubsecuente = precioData.tarifaSubsecuente;
      }

      const detalleInsert = {
        id_vale: valeNuevo.id_vale,
        id_material: formData.materialId,
        id_banco: formData.bancoId,
        id_sindicato: formData.sindicatoId,
        capacidad_m3: capacidadM3,
        distancia_km: parseFloat(formData.distancia),
        cantidad_pedida_m3: cantidadPedida,
        volumen_real_m3: cantidadPedida,
        precio_m3: precioM3,
        costo_total: costoTotal,
        id_precios_material: idPreciosMaterial,
        tarifa_primer_km: tarifaPrimerKm,
        tarifa_subsecuente: tarifaSubsecuente,
        peso_ton: null,
        notas_adicionales: formData.notasAdicionales || null,
        requisicion: formData.requisicion || null,
        folio_vale_fisico: null,
        es_planta_asfaltos: options.esPlantaAsfaltos ?? false,
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
          ),
          sindicatos:id_sindicato (
            sindicato
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


      return { valeCompleto, folio };
    } catch (error) {
      console.error("[useValeMaterialLogic] Error completo:", error);
      console.error("[useValeMaterialLogic] Stack:", error.stack);
      throw error;
    }
  };

  // Función pública: crea UN vale (flujo original)
  const crearVale = async (
    formData,
    obraData,
    userProfile,
    generateFolio,
    materiales,
    options = {},
  ) => {
    setSubmitting(true);
    try {
      const folio = await generateFolio(obraData);
      return await _insertarVale(
        formData,
        obraData,
        userProfile,
        folio,
        materiales,
        options,
      );
    } catch (error) {
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Función pública: crea N vales con folios consecutivos sin colisiones
  const crearValesEnLote = async (
    formData,
    obraData,
    userProfile,
    generateFolio,
    materiales,
    cantidad,
    options = {},
  ) => {
    setSubmitting(true);
    try {
      const folioBase = await generateFolio(obraData);
      const partes = folioBase.split("-");
      const numeroBase = parseInt(partes[partes.length - 1], 10);
      const prefijo = partes.slice(0, partes.length - 1).join("-") + "-";

      const folios = Array.from({ length: cantidad }, (_, i) => {
        const numero = numeroBase + i;
        return `${prefijo}${String(numero).padStart(5, "0")}`;
      });

      let creados = 0;
      for (const folio of folios) {
        await _insertarVale(formData, obraData, userProfile, folio, materiales, options);
        creados++;
      }

      return { creados };
    } catch (error) {
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
    crearValesEnLote,
  };
};
