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

export const useValeMaterialLogic = (materiales) => {
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [generarCopiaRoja, setGenerarCopiaRoja] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Efecto: Determinar tipo de copia según material
  useEffect(() => {
    if (!materiales || materiales.length === 0) return;

    const materialId = materialSeleccionado?.id_material;
    if (!materialId) {
      setGenerarCopiaRoja(true);
      return;
    }

    const material = materiales.find((m) => m.id_material === materialId);
    if (!material) return;

    const nuevaCopiaRoja = true; // todas seran rojas

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
    materiales
  ) => {
    console.log("[useValeMaterialLogic] Iniciando creación de vale...");
    setSubmitting(true);

    try {
      // PASO 1: Generar folio
      const folio = await generateFolio();
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

      // PASO 4: Insertar vale
      const { data: valeNuevo, error: errorVale } = await supabase
        .from("vales")
        .insert([
          {
            folio: folio,
            tipo_vale: "material",
            id_obra: obraData.id_obra,
            id_empresa: obraData.empresas.id_empresa,
            id_persona_creador: userProfile.id_persona,
            id_operador: formData.selectedOperador?.id_operador,
            id_vehiculo: formData.selectedVehiculo?.id_vehiculo,
            estado: generarCopiaRoja ? "en_proceso" : "emitido",
            qr_verification_url: verificationUrl,
          },
        ])
        .select()
        .single();

      if (errorVale) {
        console.error(
          "[useValeMaterialLogic] Error insertando vale:",
          errorVale
        );
        throw errorVale;
      }

      console.log("[useValeMaterialLogic] Vale insertado:", valeNuevo.id_vale);

      console.log("[useValeMaterialLogic] Vale insertado:", valeNuevo.id_vale);

      // PASO 5: NO calcular precio en creación inicial
      // Ahora TODOS los vales se completan después de creados
      console.log(
        "[useValeMaterialLogic] Creando vale sin precio - se completará después"
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
      };

      const { error: errorDetalle } = await supabase
        .from("vale_material_detalles")
        .insert([detalleInsert]);

      if (errorDetalle) {
        console.error(
          "[useValeMaterialLogic] Error insertando detalles:",
          errorDetalle
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
            material
          ),
          bancos:id_banco (
            id_banco,
            banco
          )
        )
      `
        )
        .eq("id_vale", valeNuevo.id_vale)
        .single();

      if (errorConsulta) {
        console.error(
          "[useValeMaterialLogic] Error consultando vale:",
          errorConsulta
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
  };
};
