/**
 * components/acarreos/ValeDetalleRenta.js
 *
 * Componente para mostrar y completar vales de RENTA
 * Extraído de ValeDetalleModal para mejor organización
 *
 * FUNCIONALIDAD:
 * - Muestra detalles del vale de renta
 * - Permite capturar hora fin y número de viajes
 * - Soporta renta por día completo
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

import StatusBadge from "../common/StatusBadge";
import FormTimePicker from "../forms/FormTimePicker";
import FormNumberInput from "../forms/FormNumberInput";
import FormCheckbox from "../forms/FormCheckbox";
import SuccessModal from "../common/SuccessModal";
import PrimaryButton from "../common/PrimaryButton";
import GenerarPDFButton from "../vale/GenerarPDFButton";

const ValeDetalleRenta = ({ vale, onClose, onRefresh }) => {
  // Estados
  const [horaFin, setHoraFin] = useState(null);
  const [numeroViajes, setNumeroViajes] = useState(1);
  const [esRentaPorDia, setEsRentaPorDia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [updatedVale, setUpdatedVale] = useState(null);
  const [triggerPDF, setTriggerPDF] = useState(false);

  const isInitialized = useRef(false);
  const lastValeId = useRef(null);

  const detalleRenta = vale?.vale_renta_detalle?.[0];
  const canComplete = vale?.estado === "en_proceso" && detalleRenta;

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

    if (detalleRenta) {
      setHoraFin(null);
      setNumeroViajes(1);
      setEsRentaPorDia(false);
    }
  }, [vale?.id_vale, detalleRenta]);

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

  const formatTime = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  // Completar vale
  const handleGuardarHoraFin = useCallback(async () => {
    if (!canComplete) return;

    // Validaciones
    if (!esRentaPorDia && !horaFin) {
      Alert.alert("Error", "Por favor selecciona la hora de fin");
      return;
    }

    try {
      setSaving(true);

      const horaInicio = new Date(detalleRenta.hora_inicio);
      let horaFinFinal;
      let totalHoras = 0;
      let totalDias = 0;

      if (esRentaPorDia) {
        totalDias = 1;
        totalHoras = 0;
        horaFinFinal = null;
      } else {
        horaFinFinal = horaFin.toISOString();
        const diffMs = horaFin - horaInicio;
        totalHoras = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

        if (totalHoras <= 0) {
          Alert.alert(
            "Error",
            "La hora de fin debe ser posterior a la hora de inicio"
          );
          setSaving(false);
          return;
        }
      }

      // Intentar usar RPC optimizado
      const { data, error } = await supabase.rpc("completar_vale_renta", {
        p_id_vale: vale.id_vale,
        p_id_detalle: detalleRenta.id_vale_renta_detalle,
        p_hora_fin: horaFinFinal,
        p_total_horas: totalHoras,
        p_total_dias: totalDias,
        p_numero_viajes: numeroViajes,
      });

      if (error) {
        // Fallback: queries separadas
        const { error: errorDetalle } = await supabase
          .from("vale_renta_detalle")
          .update({
            hora_fin: horaFinFinal,
            total_horas: totalHoras,
            total_dias: totalDias,
            numero_viajes: numeroViajes,
          })
          .eq("id_vale_renta_detalle", detalleRenta.id_vale_renta_detalle);

        if (errorDetalle) throw errorDetalle;

        const { error: valeError } = await supabase
          .from("vales")
          .update({ estado: "emitido" })
          .eq("id_vale", vale.id_vale);

        if (valeError) throw valeError;
      }

      // Crear vale actualizado para success modal
      const valeActualizado = {
        ...vale,
        estado: "emitido",
        vale_renta_detalle: [
          {
            ...detalleRenta,
            hora_fin: horaFinFinal,
            total_horas: totalHoras,
            total_dias: totalDias,
            numero_viajes: numeroViajes,
          },
        ],
      };

      setUpdatedVale(valeActualizado);
      setSuccessData({
        totalHoras,
        totalDias,
        numeroViajes,
        esRentaPorDia,
      });
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo completar el vale. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }, [
    canComplete,
    esRentaPorDia,
    horaFin,
    numeroViajes,
    detalleRenta,
    vale?.id_vale,
  ]);

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

  // ValeDetalleRenta.js - línea ~75 (después del if (!vale))
  if (!vale || !detalleRenta) {
    console.log("[ValeDetalleRenta] Vale o detalle nulo");
    console.log("[ValeDetalleRenta] Vale:", !!vale);
    console.log("[ValeDetalleRenta] detalleRenta:", !!detalleRenta);
    return null;
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        {/* Detalles de Renta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de Renta</Text>

          {detalleRenta.capacidad_m3 && (
            <InfoRow
              icon="truck"
              label="Capacidad"
              value={`${detalleRenta.capacidad_m3} m³`}
            />
          )}

          {detalleRenta.material?.material && (
            <InfoRow
              icon="package-variant"
              label="Material"
              value={detalleRenta.material.material}
            />
          )}

          <InfoRow
            icon="clock-start"
            label="Hora Inicio"
            value={formatTime(detalleRenta.hora_inicio)}
          />

          {detalleRenta.hora_fin && (
            <>
              <InfoRow
                icon="clock-end"
                label="Hora Fin"
                value={formatTime(detalleRenta.hora_fin)}
              />

              <InfoRow
                icon="clock-outline"
                label="Total Horas"
                value={`${detalleRenta.total_horas} hrs`}
              />

              <InfoRow
                icon="truck-check"
                label="Número de Viajes"
                value={detalleRenta.numero_viajes || 0}
              />

              <InfoRow
                icon="calendar-check"
                label="Emitido el"
                value={`${formatDate(
                  vale.fecha_actualizacion || vale.fecha_creacion
                )} a las ${formatTime(
                  vale.fecha_actualizacion || vale.fecha_creacion
                )}`}
              />
            </>
          )}

          {detalleRenta.notas_adicionales && (
            <InfoRow
              icon="note-text"
              label="Notas"
              value={detalleRenta.notas_adicionales}
            />
          )}
        </View>

        {/* Formulario para Completar */}
        {canComplete && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completar Vale</Text>
            <Text style={styles.sectionSubtitle}>
              Captura la hora de fin y el número de viajes realizados
            </Text>

            <FormCheckbox
              label="Renta por día completo"
              value={esRentaPorDia}
              onChange={setEsRentaPorDia}
            />

            <FormTimePicker
              label="Hora de Fin"
              value={horaFin}
              onChange={setHoraFin}
              disabled={esRentaPorDia}
            />

            <FormNumberInput
              label="Número de Viajes"
              value={numeroViajes}
              onChange={setNumeroViajes}
              min={1}
              max={99}
              step={1}
            />

            <PrimaryButton
              title="Guardar y Completar Vale"
              onPress={handleGuardarHoraFin}
              loading={saving}
              icon="check-circle"
              backgroundColor={colors.accent}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Éxito */}
      <SuccessModal
        visible={showSuccessModal}
        title="Vale de Renta Completado"
        message={
          successData?.esRentaPorDia
            ? `Renta por día completo registrada.\nViajes: ${successData?.numeroViajes}\n\n¿Deseas generar el PDF ahora?`
            : `Total de horas: ${successData?.totalHoras}\nViajes: ${successData?.numeroViajes}\n\n¿Deseas generar el PDF ahora?`
        }
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
          tipoVale="renta"
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

export default ValeDetalleRenta;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
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
});
