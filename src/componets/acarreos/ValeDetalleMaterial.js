/**
 * components/acarreos/ValeDetalleMaterial.js
 *
 * Componente para mostrar y completar vales de MATERIAL
 * Extraído de ValeDetalleModal para mejor organización
 *
 * FUNCIONALIDAD:
 * - Muestra detalles del vale de material
 * - Permite capturar peso (toneladas) y folio del banco
 * - Completa el vale y actualiza estado a "emitido"
 * - Genera PDF automáticamente después de completar
 *
 * USADO EN:
 * - ValeDetalleModal (wrapper principal)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";

import { calcularCostoValeMaterial } from "../../utils/preciosMaterial";
import KeyboardAvoidingScrollView from "../common//KeyboardAvoidingScrollView";

import StatusBadge from "../common/StatusBadge";
import FormDecimalInput from "../forms/FormDecimalInput";
import FormInput from "../forms/FormInput";
import SuccessModal from "../common/SuccessModal";
import PrimaryButton from "../common/PrimaryButton";
import GenerarPDFButton from "../vale/GenerarPDFButton";

const ValeDetalleMaterial = ({ vale, onClose, onRefresh }) => {
  // Estados
  const [pesoToneladas, setPesoToneladas] = useState(null);
  const [folioBanco, setFolioBanco] = useState("");
  const [savingToneladas, setSavingToneladas] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [updatedVale, setUpdatedVale] = useState(null);
  const [triggerPDF, setTriggerPDF] = useState(false);

  const isInitialized = useRef(false);
  const lastValeId = useRef(null);

  const detalleMaterial = vale?.vale_material_detalles?.[0];
  const canComplete = vale?.estado === "en_proceso" && detalleMaterial;

  // Inicializar valores cuando cambia el vale
  useEffect(() => {
    if (
      !vale ||
      (lastValeId.current === vale.id_vale && isInitialized.current)
    ) {
      return;
    }

    lastValeId.current = vale.id_vale;
    isInitialized.current = true;

    if (detalleMaterial) {
      setPesoToneladas(detalleMaterial.peso_ton || null);
      setFolioBanco(
        detalleMaterial.folio_banco ? String(detalleMaterial.folio_banco) : ""
      );
    }
  }, [vale?.id_vale, detalleMaterial]);

  // Formateo de fechas
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  // Completar vale
  const handleCompletarVale = useCallback(async () => {
    if (!canComplete) return;

    // Validaciones
    if (!pesoToneladas || pesoToneladas <= 0) {
      Alert.alert("Error", "Por favor ingresa un peso válido");
      return;
    }

    if (!folioBanco || folioBanco.trim() === "") {
      Alert.alert("Error", "Por favor ingresa el folio del banco");
      return;
    }

    // Validar formato del folio (solo números y guiones opcionales)
    const folioLimpio = folioBanco.trim();
    if (!/^[0-9-]+$/.test(folioLimpio)) {
      Alert.alert("Error", "El folio solo puede contener números y guiones");
      return;
    }

    try {
      setSavingToneladas(true);

      const detalleId = detalleMaterial?.id_detalle_material;
      if (!detalleId) {
        throw new Error("No se encontró el detalle del vale");
      }

      // Intentar usar RPC optimizado
      const { data: valeActualizado, error } = await supabase.rpc(
        "completar_vale_material",
        {
          p_id_vale: vale.id_vale,
          p_id_detalle: detalleId,
          p_peso_ton: pesoToneladas,
          p_folio_banco: folioLimpio,
          p_id_material: detalleMaterial.id_material,
          p_id_banco: detalleMaterial.id_banco,
        }
      );

      if (error) {
        // Fallback: método manual
        console.log(
          "[ValeDetalleMaterial] Usando método manual (RPC no disponible)"
        );

        // PASO 1: Obtener peso específico
        const { data: pesoEspecificoData, error: errorPeso } = await supabase
          .from("peso_especifico")
          .select("peso_especifico")
          .eq("id_material", detalleMaterial.id_material)
          .eq("id_banco", detalleMaterial.id_banco)
          .single();

        if (errorPeso) {
          console.error(
            "[ValeDetalleMaterial] Error obteniendo peso específico:",
            errorPeso
          );
          throw new Error("No se encontró el peso específico del material");
        }

        const pesoEspecifico = pesoEspecificoData?.peso_especifico || 1;

        // Calcular y redondear volumen real a 2 decimales
        const volumenRealSinRedondear = pesoToneladas / pesoEspecifico;
        const volumenReal = parseFloat(volumenRealSinRedondear.toFixed(2));

        console.log("[ValeDetalleMaterial] Peso específico:", pesoEspecifico);
        console.log(
          "[ValeDetalleMaterial] Volumen real sin redondear:",
          volumenRealSinRedondear
        );
        console.log(
          "[ValeDetalleMaterial] Volumen real redondeado:",
          volumenReal
        );

        // PASO 2: Obtener datos del material para calcular precio
        const { data: materialData, error: errorMaterial } = await supabase
          .from("material")
          .select("id_tipo_de_material")
          .eq("id_material", detalleMaterial.id_material)
          .single();

        if (errorMaterial || !materialData) {
          console.error(
            "[ValeDetalleMaterial] Error obteniendo tipo de material:",
            errorMaterial
          );
          throw new Error("No se pudo obtener el tipo de material");
        }

        console.log(
          "[ValeDetalleMaterial] Tipo de material:",
          materialData.id_tipo_de_material
        );

        // PASO 3: Obtener sindicato del vehículo
        const { data: vehiculoData, error: errorVehiculo } = await supabase
          .from("vehiculos")
          .select("id_sindicato")
          .eq("id_vehiculo", vale.id_vehiculo)
          .single();

        if (errorVehiculo || !vehiculoData) {
          console.error(
            "[ValeDetalleMaterial] Error obteniendo sindicato:",
            errorVehiculo
          );
          throw new Error("No se pudo obtener el sindicato del vehículo");
        }

        console.log(
          "[ValeDetalleMaterial] Sindicato ID:",
          vehiculoData.id_sindicato
        );

        // PASO 4: Calcular precio usando volumen real REDONDEADO
        console.log("[ValeDetalleMaterial] Calculando precio...");
        const costos = await calcularCostoValeMaterial(
          materialData.id_tipo_de_material,
          vehiculoData.id_sindicato,
          detalleMaterial.distancia_km,
          volumenReal
        );

        console.log("[ValeDetalleMaterial] Precio calculado:", {
          precio_m3: costos.precioM3,
          costo_total: costos.costoTotal,
          tarifa_primer_km: costos.tarifaPrimerKm,
          tarifa_subsecuente: costos.tarifaSubsecuente,
          id_precios_material: costos.idPreciosMaterial,
        });

        // PASO 5: Actualizar vale_material_detalles con TODOS los campos
        const { error: errorUpdate } = await supabase
          .from("vale_material_detalles")
          .update({
            peso_ton: pesoToneladas,
            volumen_real_m3: volumenReal,
            folio_banco: folioLimpio,
            precio_m3: costos.precioM3,
            costo_total: costos.costoTotal,
            id_precios_material: costos.idPreciosMaterial,
            tarifa_primer_km: costos.tarifaPrimerKm,
            tarifa_subsecuente: costos.tarifaSubsecuente,
          })
          .eq("id_detalle_material", detalleId);

        if (errorUpdate) {
          console.error(
            "[ValeDetalleMaterial] Error actualizando detalles:",
            errorUpdate
          );
          throw errorUpdate;
        }

        console.log(
          "[ValeDetalleMaterial] Vale actualizado con precio y tarifas exitosamente"
        );

        // Actualizar estado del vale a "emitido"
        const { error: errorEstado } = await supabase
          .from("vales")
          .update({ estado: "emitido" })
          .eq("id_vale", vale.id_vale);

        if (errorEstado) {
          console.error(
            "[ValeDetalleMaterial] Error actualizando estado:",
            errorEstado
          );
          throw errorEstado;
        }

        // Consultar vale completo actualizado
        const { data: valeConsultado, error: errorConsulta } = await supabase
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
          .eq("id_vale", vale.id_vale)
          .single();

        if (errorConsulta) {
          console.error(
            "[ValeDetalleMaterial] Error consultando vale:",
            errorConsulta
          );
          throw errorConsulta;
        }

        setUpdatedVale(valeConsultado);
        setSuccessData({
          pesoToneladas,
          volumenReal: volumenReal.toFixed(2),
          folioBanco: folioLimpio,
        });
      } else {
        // RPC exitoso
        setUpdatedVale(valeActualizado);
        const detalleActualizado = valeActualizado?.vale_material_detalles?.[0];
        setSuccessData({
          pesoToneladas,
          volumenReal:
            detalleActualizado?.volumen_real_m3?.toFixed(2) || "0.00",
          folioBanco: folioLimpio,
        });
      }

      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo completar el vale. Intenta de nuevo.");
    } finally {
      setSavingToneladas(false);
    }
  }, [canComplete, pesoToneladas, folioBanco, detalleMaterial, vale?.id_vale]);

  const handleCloseSuccess = useCallback(() => {
    setShowSuccessModal(false);
    onRefresh();
    onClose();
  }, [onRefresh, onClose]);

  const handleGenerarPDFAhora = useCallback(() => {
    if (!updatedVale) {
      Alert.alert("Error", "No hay datos del vale actualizado");
      return;
    }
    setTriggerPDF(true);
  }, [updatedVale]);

  if (!vale || !detalleMaterial) {
    console.log("[ValeDetalleMaterial] Vale o detalle nulo");
    console.log("[ValeDetalleMaterial] Vale:", !!vale);
    console.log("[ValeDetalleMaterial] detalleMaterial:", !!detalleMaterial);
    return null;
  }

  return (
    <>
      <KeyboardAvoidingScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Estado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <StatusBadge estado={vale.estado} size="medium" />
        </View>

        {/* Información General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>

          <InfoRow
            icon="calendar"
            label="Fecha de creación"
            value={formatDate(vale.fecha_creacion)}
          />

          <InfoRow
            icon="account-hard-hat"
            label="Operador"
            value={vale.operadores?.nombre_completo || "N/A"}
          />

          <InfoRow
            icon="car"
            label="Placas"
            value={vale.vehiculos?.placas || "N/A"}
          />
        </View>

        {/* Detalles de Material */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de Material</Text>

          <InfoRow
            icon="package-variant"
            label="Material"
            value={detalleMaterial.material?.material || "N/A"}
          />

          <InfoRow
            icon="map-marker"
            label="Banco"
            value={detalleMaterial.bancos?.banco || "N/A"}
          />

          <InfoRow
            icon="truck"
            label="Capacidad"
            value={`${detalleMaterial.capacidad_m3} m³`}
          />

          <InfoRow
            icon="map-marker-distance"
            label="Distancia"
            value={`${detalleMaterial.distancia_km} Km`}
          />

          <InfoRow
            icon="cube-outline"
            label="Cantidad Pedida"
            value={`${detalleMaterial.cantidad_pedida_m3} m³`}
          />

          {detalleMaterial.peso_ton && (
            <>
              <InfoRow
                icon="weight"
                label="Peso"
                value={`${detalleMaterial.peso_ton} Ton`}
              />

              <InfoRow
                icon="cube"
                label="Volumen Real"
                value={`${
                  detalleMaterial.volumen_real_m3?.toFixed(2) || "N/A"
                } m³`}
              />

              <InfoRow
                icon="file-document"
                label="Folio Banco"
                value={detalleMaterial.folio_banco || "N/A"}
              />
              {/* AGREGAR FECHA DE EMISIÓN */}
              {vale.estado !== "en_proceso" && (
                <InfoRow
                  icon="calendar-check"
                  label="Emitido el"
                  value={formatDate(vale.fecha_creacion)}
                />
              )}
            </>
          )}
        </View>

        {/* AGREGAR NUEVA SECCIÓN: Precios */}
        {vale.estado !== "en_proceso" && detalleMaterial.precio_m3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Precios y Costo</Text>

            <InfoRow
              icon="cash"
              label="Precio por m³"
              value={`$${parseFloat(detalleMaterial.precio_m3).toFixed(2)} MXN`}
            />

            {detalleMaterial.tarifa_primer_km && (
              <InfoRow
                icon="currency-usd"
                label="Tarifa 1er Km"
                value={`$${parseFloat(detalleMaterial.tarifa_primer_km).toFixed(
                  2
                )} MXN`}
              />
            )}

            {detalleMaterial.tarifa_subsecuente && (
              <InfoRow
                icon="currency-usd"
                label="Tarifa Subsecuente"
                value={`$${parseFloat(
                  detalleMaterial.tarifa_subsecuente
                ).toFixed(2)} MXN/km`}
              />
            )}

            {detalleMaterial.costo_total && (
              <View style={styles.totalContainer}>
                <InfoRow
                  icon="currency-usd"
                  label="Costo Total"
                  value={`$${parseFloat(detalleMaterial.costo_total).toFixed(
                    2
                  )} MXN`}
                />
              </View>
            )}
          </View>
        )}

        {/* Formulario para Completar */}
        {canComplete && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completar Vale</Text>
            <Text style={styles.sectionSubtitle}>
              Captura el peso y folio del banco para completar el vale
            </Text>

            <FormDecimalInput
              label="Peso en Toneladas"
              value={pesoToneladas}
              onChange={setPesoToneladas}
              min={0.01}
              max={999}
              decimalPlaces={2}
              placeholder="0.00"
              suffix="ton"
              disabled={false}
            />

            <FormInput
              label="Folio del Banco"
              value={folioBanco}
              onChangeText={setFolioBanco}
              placeholder="Ej: 123456789"
              keyboardType="default"
              editable={true}
              maxLength={20}
            />

            <PrimaryButton
              title="Completar Vale"
              onPress={handleCompletarVale}
              loading={savingToneladas}
              disabled={
                !pesoToneladas ||
                pesoToneladas <= 0 ||
                !folioBanco ||
                folioBanco.trim() === ""
              }
              icon="check-circle"
              backgroundColor={colors.accent}
            />

            <Text style={styles.helperText}>
              Ambos campos son requeridos para completar el vale
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </KeyboardAvoidingScrollView>

      {/* Modal de Éxito */}
      <SuccessModal
        visible={showSuccessModal}
        title="Vale Completado"
        message={`Peso: ${successData?.pesoToneladas} ton\nVolumen Real: ${successData?.volumenReal} m³\nFolio Banco: ${successData?.folioBanco}\n\n¿Deseas generar el PDF ahora?`}
        primaryAction={{
          text: "Generar PDF",
          icon: "file-pdf-box",
          onPress: () => {
            setShowSuccessModal(false);
            setTimeout(() => {
              handleGenerarPDFAhora();
            }, 300);
          },
        }}
      />

      {/* Generador de PDF */}
      {triggerPDF && updatedVale && (
        <GenerarPDFButton
          valeData={updatedVale}
          tipoVale="material"
          colorCopia="blanco"
          autoTrigger={true}
          onSuccess={() => {
            setTriggerPDF(false);
            onRefresh();
            onClose();
          }}
        />
      )}
    </>
  );
};

// Componente auxiliar para filas de información
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <MaterialCommunityIcons
      name={icon}
      size={20}
      color={colors.textSecondary}
    />
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

export default ValeDetalleMaterial;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  totalContainer: {
    backgroundColor: colors.accent + "10",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
});
