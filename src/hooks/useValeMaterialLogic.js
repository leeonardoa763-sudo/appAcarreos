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

  const [submitting, setSubmitting] = useState(false);
  const { flags } = useFeatureFlags();

  // Funcion interna: crea UN vale con un folio ya calculado
  const _insertarVale = async (
    formData,
    obraData,
    userProfile,
    folio,
    materiales,
  ) => {
    try {
      // Verificar folio unico
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

      // DESPUÉS:
      const estadoInicial = "en_proceso";
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
            // fecha_programada: solo si el Residente activó "Programar para mañana"
            fecha_programada: formData.programarManana
              ? (() => {
                  const manana = new Date();
                  manana.setDate(manana.getDate() + 1);
                  // Usar fecha local, no UTC
                  const y = manana.getFullYear();
                  const m = String(manana.getMonth() + 1).padStart(2, "0");
                  const d = String(manana.getDate()).padStart(2, "0");
                  return `${y}-${m}-${d}`;
                })()
              : null,
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
        id_sindicato: formData.sindicatoId,
        capacidad_m3: parseFloat(formData.capacidad),
        distancia_km: parseFloat(formData.distancia),
        cantidad_pedida_m3: null,
        peso_ton: null,
        notas_adicionales: formData.notasAdicionales || null,
        requisicion: formData.requisicion || null,
        folio_vale_fisico: null,
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
      throw error;
    }
  };

  // Funcion publica: crea UN vale (flujo original)
  const crearVale = async (
    formData,
    obraData,
    userProfile,
    generateFolio,
    materiales,
  ) => {
    setSubmitting(true);
    try {
      const folio = await generateFolio(obraData);
      const resultado = await _insertarVale(
        formData,
        obraData,
        userProfile,
        folio,
        materiales,
      );
      return resultado;
    } catch (error) {
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Funcion publica: crea N vales con folios consecutivos sin colisiones
  const crearValesEnLote = async (
    formData,
    obraData,
    userProfile,
    generateFolio,
    materiales,
    cantidad,
  ) => {
    setSubmitting(true);
    try {
      // PASO 1: Calcular el folio base una sola vez
      const folioBase = await generateFolio(obraData);

      // PASO 2: Derivar todos los folios en memoria antes de insertar cualquiera
      // Formato: SUF-CC-00001 → extraer numero y generar secuencia
      const partes = folioBase.split("-");
      const numeroBase = parseInt(partes[partes.length - 1], 10);
      const prefijo = partes.slice(0, partes.length - 1).join("-") + "-";

      const folios = Array.from({ length: cantidad }, (_, i) => {
        const numero = numeroBase + i;
        return `${prefijo}${String(numero).padStart(5, "0")}`;
      });

      // PASO 3: Insertar vales secuencialmente con sus folios pre-calculados
      let creados = 0;
      for (const folio of folios) {
        await _insertarVale(formData, obraData, userProfile, folio, materiales);
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
    submitting,
    crearVale,
    crearValesEnLote,
    tipoMaterialSeleccionado: materialSeleccionado?.id_tipo_de_material ?? null,
  };
};
