/**
 * components/acarreos/ValeDetalleRenta.js
 *
 * Componente para mostrar y completar vales de RENTA
 * Extraído de ValeDetalleModal para mejor organización
 *
 * FUNCIONALIDAD:
 * - Muestra detalles completos del vale de renta
 * - Permite capturar hora fin y número de viajes
 * - Soporta renta por día completo y medio día
 * - Muestra tarifas del sindicato y precio final
 * - Completa el vale y actualiza estado a "emitido"
 * - Genera PDF automáticamente después de completar
 *
 * USADO EN:
 * - ValeDetalleModal (wrapper principal)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";

import { useCatalogos } from "../../hooks/useCatalogos";
import FormAutocomplete from "../forms/FormAutocomplete";

import KeyboardAvoidingScrollView from "../common/KeyboardAvoidingScrollView";
import StatusBadge from "../common/StatusBadge";
import FormTimePicker from "../forms/FormTimePicker";
import FormNumberInput from "../forms/FormNumberInput";
import FormCheckbox from "../forms/FormCheckbox";
import SuccessModal from "../common/SuccessModal";
import PrimaryButton from "../common/PrimaryButton";
import GenerarPDFButton from "../vale/GenerarPDFButton";
import CustomTimePicker from "../forms/CustomTimePicker";
import { useAuth } from "../../hooks/useAuth";
import FormInput from "../forms/FormInput";
import EvidenciaCaptura from "../vale/EvidenciaCaptura";
import useEvidenciaVale from "../../hooks/useEvidenciaVale";
import { useViajesRenta } from "../../hooks/useViajesRenta";
import ViajesRentaSection from "./ViajesRentaSection";
import {
  validateHoraFinNoPosterior,
  validateTiempoMinimoRenta,
  validateMismoDiaCreacion,
} from "../../utils/validations";

const ValeDetalleRenta = ({ vale, onClose, onRefresh }) => {
  const { userProfile } = useAuth();

  const { operadores, vehiculos } = useCatalogos(["operadores", "vehiculos"]);

  const detalleRenta = vale?.vale_renta_detalle?.[0];
  const tieneDatosPendientes = !vale?.id_operador || !vale?.id_vehiculo;

  const sindicatoId = detalleRenta?.id_sindicato;
  const operadoresFiltrados = operadores.filter(
    (op) => !sindicatoId || op.id_sindicato === sindicatoId,
  );
  const vehiculosFiltrados = vehiculos.filter(
    (v) => !sindicatoId || v.id_sindicato === sindicatoId,
  );

  const [horaFin, setHoraFin] = useState(null);
  const [numeroViajes, setNumeroViajes] = useState(1);
  const [esRentaPorDia, setEsRentaPorDia] = useState(false);
  const [esRentaPorMedioDia, setEsRentaPorMedioDia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [updatedVale, setUpdatedVale] = useState(null);
  const [triggerPDF, setTriggerPDF] = useState(false);
  const [mensajeBloqueo, setMensajeBloqueo] = useState(null);

  const obraData = vale?.obras || null;

  const {
    foto,
    fotoUrl,
    ubicacion,
    distanciaObra,
    evidenciaLista,
    dentroDelRadio,
    obraTieneCoordenadas,
    radioConfigurado,
    loadingFoto,
    loadingUbicacion,
    errorFoto,
    errorUbicacion,
    tomarFoto,
    capturarUbicacion,
    resetEvidencia,
  } = useEvidenciaVale(obraData);

  const [notasAdicionales, setNotasAdicionales] = useState("");

  const isInitialized = useRef(false);
  const lastValeId = useRef(null);

  const [selectedOperador, setSelectedOperador] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [savingDatos, setSavingDatos] = useState(false);
  const [datosPendientesGuardados, setDatosPendientesGuardados] =
    useState(false);

  const canComplete = vale?.estado === "en_proceso" && detalleRenta;

  const preciosRenta = detalleRenta?.precios_renta;

  const {
    viajes,
    loading: loadingViajes,
    registrando,
    puedeRegistrar,
    totalViajes,
    registrarViaje,
  } = useViajesRenta(detalleRenta?.id_vale_renta_detalle, vale?.id_obra);
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
      setEsRentaPorMedioDia(false);
      setNotasAdicionales(detalleRenta.notas_adicionales || "");
    }
  }, [vale?.id_vale, detalleRenta]);

  useEffect(() => {
    return () => {
      isInitialized.current = false;
      lastValeId.current = null;
      setTriggerPDF(false);
      setUpdatedVale(null);
    };
  }, []);

  useEffect(() => {
    if (!canComplete || !detalleRenta) return;

    const errorDia = validateMismoDiaCreacion(vale?.fecha_creacion);
    if (errorDia) {
      setMensajeBloqueo(errorDia);
      return;
    }

    if (esRentaPorDia) {
      const error = validateTiempoMinimoRenta(detalleRenta.hora_inicio, "dia");
      setMensajeBloqueo(error);
    } else if (esRentaPorMedioDia) {
      const error = validateTiempoMinimoRenta(
        detalleRenta.hora_inicio,
        "medio_dia",
      );
      setMensajeBloqueo(error);
    } else {
      setMensajeBloqueo(null);
    }
  }, [
    canComplete,
    detalleRenta,
    esRentaPorDia,
    esRentaPorMedioDia,
    vale?.fecha_creacion,
  ]);

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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return `$${parseFloat(amount).toFixed(2)} MXN`;
  };

  const handleGuardarDatosPendientes = useCallback(async () => {
    if (!selectedOperador || !selectedVehiculo) {
      Alert.alert("Campos requeridos", "Selecciona operador y vehículo");
      return;
    }

    try {
      setSavingDatos(true);

      const { error } = await supabase
        .from("vales")
        .update({
          id_operador: selectedOperador.id_operador,
          id_vehiculo: selectedVehiculo.id_vehiculo,
        })
        .eq("id_vale", vale.id_vale);

      if (error) throw error;

      setDatosPendientesGuardados(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingDatos(false);
    }
  }, [selectedOperador, selectedVehiculo, vale.id_vale, onRefresh]);

  const handleGuardarHoraFin = useCallback(async () => {
    if (!canComplete) return;

    // Si hay datos pendientes, validar que se hayan seleccionado
    if (tieneDatosPendientes && (!selectedOperador || !selectedVehiculo)) {
      Alert.alert(
        "Datos incompletos",
        "Debes asignar operador y vehículo antes de completar",
      );
      return;
    }

    const errorDia = validateMismoDiaCreacion(vale?.fecha_creacion);
    if (errorDia) {
      Alert.alert("Vale vencido", errorDia);
      return;
    }

    if (!esRentaPorDia && !esRentaPorMedioDia) {
      if (!horaFin) {
        Alert.alert("Error", "Por favor selecciona la hora de fin");
        return;
      }

      const errorHoraFin = validateHoraFinNoPosterior(horaFin);
      if (errorHoraFin) {
        Alert.alert("Hora inválida", errorHoraFin);
        return;
      }
    }

    if (esRentaPorDia) {
      const errorTiempo = validateTiempoMinimoRenta(
        detalleRenta.hora_inicio,
        "dia",
      );
      if (errorTiempo) {
        Alert.alert("Tiempo insuficiente", errorTiempo);
        return;
      }
    }

    if (esRentaPorMedioDia) {
      const errorTiempo = validateTiempoMinimoRenta(
        detalleRenta.hora_inicio,
        "medio_dia",
      );
      if (errorTiempo) {
        Alert.alert("Tiempo insuficiente", errorTiempo);
        return;
      }
    }

    try {
      setSaving(true);

      const horaInicio = new Date(detalleRenta.hora_inicio);
      let horaFinFinal;
      let totalHoras = 0;
      let totalDias = 0;
      let costoTotal = 0;

      if (esRentaPorDia) {
        totalDias = 1;
        totalHoras = 0;
        horaFinFinal = null;
        costoTotal = parseFloat(preciosRenta.costo_dia);
      } else if (esRentaPorMedioDia) {
        totalDias = 0.5;
        totalHoras = 0;
        horaFinFinal = null;
        costoTotal = parseFloat(preciosRenta.costo_dia) / 2;
      } else {
        horaFinFinal = horaFin.toISOString();
        const diffMs = horaFin - horaInicio;
        totalHoras = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

        if (totalHoras <= 0) {
          Alert.alert(
            "Error",
            "La hora de fin debe ser posterior a la hora de inicio",
          );
          setSaving(false);
          return;
        }

        totalDias = 0;
        costoTotal = parseFloat(preciosRenta.costo_hr) * totalHoras;
      }

      // ← PASO 4.5: Usar totalViajes del hook, con fallback al campo manual
      const viajesFinales = totalViajes > 0 ? totalViajes : numeroViajes;

      const { error: errorDetalle } = await supabase
        .from("vale_renta_detalle")
        .update({
          es_renta_por_dia: esRentaPorDia,
          hora_fin: horaFinFinal,
          total_horas: totalHoras,
          total_dias: totalDias,
          numero_viajes: viajesFinales,
          costo_total: costoTotal,
          notas_adicionales: notasAdicionales.trim() || null,
        })
        .eq("id_vale_renta_detalle", detalleRenta.id_vale_renta_detalle);

      if (errorDetalle) throw errorDetalle;

      const { error: valeError } = await supabase
        .from("vales")
        .update({
          estado: "emitido",
          id_persona_completador: userProfile.id_persona,
          fecha_completado: new Date().toISOString(),
          // Si había datos pendientes, guardarlos junto con el completado
          ...(tieneDatosPendientes && {
            id_operador: selectedOperador.id_operador,
            id_vehiculo: selectedVehiculo.id_vehiculo,
          }),
        })
        .eq("id_vale", vale.id_vale);

      if (valeError) throw valeError;

      const valeActualizado = {
        ...vale,
        estado: "emitido",
        id_persona_completador: userProfile.id_persona,
        fecha_completado: new Date().toISOString(),
        persona_completador: {
          nombre: userProfile.nombre,
          primer_apellido: userProfile.primer_apellido,
          segundo_apellido: userProfile.segundo_apellido,
        },
        vale_renta_detalle: [
          {
            ...detalleRenta,
            es_renta_por_dia: esRentaPorDia,
            hora_fin: horaFinFinal,
            total_horas: totalHoras,
            total_dias: totalDias,
            numero_viajes: viajesFinales,
            costo_total: costoTotal,
            notas_adicionales: notasAdicionales.trim() || null,
          },
        ],
      };

      setUpdatedVale(valeActualizado);
      setSuccessData({
        totalHoras,
        totalDias,
        numeroViajes: viajesFinales,
        esRentaPorDia,
        esRentaPorMedioDia,
      });

      setShowSuccessModal(true);
      setTriggerPDF(false);
    } catch (error) {
      console.error("[ValeDetalleRenta] Error completando vale:", error);
      Alert.alert("Error", "No se pudo completar el vale. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }, [
    canComplete,
    esRentaPorDia,
    esRentaPorMedioDia,
    horaFin,
    numeroViajes,
    totalViajes,
    detalleRenta,
    vale?.id_vale,
    vale?.fecha_creacion,
    preciosRenta,
    userProfile,
    notasAdicionales,
  ]);

  const handleCloseSuccess = useCallback(() => {
    setShowSuccessModal(false);
    resetEvidencia();
    onRefresh();
    onClose();
  }, [onRefresh, onClose, resetEvidencia]);

  const handleGenerarPDFAhora = useCallback(() => {
    if (!updatedVale) {
      Alert.alert("Error", "No hay datos del vale actualizado");
      return;
    }
    setShowSuccessModal(false);
    setTimeout(() => {
      setTriggerPDF(true);
    }, 100);
  }, [updatedVale]);

  if (!vale || !detalleRenta) {
    return null;
  }

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={colors.textSecondary}
        />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <Text style={styles.valueText}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.folio}>{vale.folio}</Text>
          <StatusBadge estado={vale.estado} />
        </View>

        {/* Información General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>

          <InfoRow
            icon="domain"
            label="Obra"
            value={vale.obras?.obra || "N/A"}
          />
          <InfoRow
            icon="account-hard-hat"
            label="Operador"
            value={vale.operadores?.nombre_completo || "N/A"}
          />
          <InfoRow
            icon="truck"
            label="Placas"
            value={vale.vehiculos?.placas || "N/A"}
          />
          <InfoRow
            icon="home-group"
            label="Sindicato"
            value={vale.vehiculos?.sindicatos?.sindicato || "N/A"}
          />

          <InfoRow
            icon="account-plus"
            label="Creado por"
            value={
              vale.persona
                ? `${vale.persona.nombre} ${vale.persona.primer_apellido || ""} ${vale.persona.segundo_apellido || ""}`.trim()
                : "N/A"
            }
          />

          {vale.estado !== "en_proceso" &&
            vale.estado !== "borrador" &&
            vale.persona_completador && (
              <InfoRow
                icon="account-check"
                label="Completado por"
                value={`${vale.persona_completador.nombre} ${vale.persona_completador.primer_apellido || ""} ${vale.persona_completador.segundo_apellido || ""}`.trim()}
              />
            )}

          {vale.fecha_completado && (
            <InfoRow
              icon="calendar-check"
              label="Fecha completado"
              value={formatDate(vale.fecha_completado)}
            />
          )}
        </View>

        {/* Detalles de Renta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de Renta</Text>

          {detalleRenta.material?.material && (
            <InfoRow
              icon="package-variant"
              label="Material Movido"
              value={detalleRenta.material.material}
            />
          )}

          {detalleRenta.capacidad_m3 && (
            <InfoRow
              icon="truck-cargo-container"
              label="Capacidad"
              value={`${detalleRenta.capacidad_m3} m³`}
            />
          )}

          {detalleRenta.es_renta_por_dia !== null &&
            vale.estado !== "en_proceso" && (
              <InfoRow
                icon="calendar-clock"
                label="Tipo de Renta"
                value={detalleRenta.es_renta_por_dia ? "Por día" : "Por hora"}
              />
            )}

          <InfoRow
            icon="clock-start"
            label="Hora Inicio"
            value={formatTime(detalleRenta.hora_inicio)}
          />

          {detalleRenta.hora_fin && (
            <InfoRow
              icon="clock-end"
              label="Hora Fin"
              value={formatTime(detalleRenta.hora_fin)}
            />
          )}

          {detalleRenta.total_horas > 0 && (
            <InfoRow
              icon="clock-outline"
              label="Total Horas"
              value={`${detalleRenta.total_horas} hrs`}
            />
          )}

          {detalleRenta.total_dias > 0 && (
            <InfoRow
              icon="calendar-check"
              label="Total Días"
              value={`${detalleRenta.total_dias} día(s)`}
            />
          )}

          {detalleRenta.numero_viajes && (
            <InfoRow
              icon="truck-check"
              label="Número de Viajes"
              value={detalleRenta.numero_viajes}
            />
          )}

          {vale.estado !== "en_proceso" && (
            <InfoRow
              icon="calendar-check"
              label="Emitido el"
              value={formatDate(vale.fecha_creacion)}
            />
          )}

          {detalleRenta.notas_adicionales && (
            <View style={styles.notasContainer}>
              <View style={styles.notasHeader}>
                <MaterialCommunityIcons
                  name="note-text"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.notasLabel}>Notas Adicionales</Text>
              </View>
              <Text style={styles.notasText}>
                {detalleRenta.notas_adicionales}
              </Text>
            </View>
          )}
        </View>

        {/* Tarifas y Costo */}
        {vale.estado !== "en_proceso" &&
          preciosRenta &&
          userProfile?.roles?.role !== "CHECADOR" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tarifas y Costo</Text>

              {preciosRenta.costo_hr && (
                <InfoRow
                  icon="cash"
                  label="Tarifa por Hora"
                  value={formatCurrency(preciosRenta.costo_hr)}
                />
              )}

              {preciosRenta.costo_dia && (
                <InfoRow
                  icon="cash-multiple"
                  label="Tarifa por Día"
                  value={formatCurrency(preciosRenta.costo_dia)}
                />
              )}

              {detalleRenta.costo_total && (
                <View style={styles.totalContainer}>
                  <InfoRow
                    icon="currency-usd"
                    label="Costo Total"
                    value={formatCurrency(detalleRenta.costo_total)}
                  />
                </View>
              )}
            </View>
          )}

        {/* Sección Completar Vale */}
        {canComplete && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completar Vale</Text>
            <Text style={styles.sectionSubtitle}>
              Captura los datos para completar el vale
            </Text>

            {/* Datos pendientes: operador y vehículo */}
            {tieneDatosPendientes && !datosPendientesGuardados && (
              <View style={styles.datosPendientesInline}>
                <View style={styles.pendienteHeader}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.pendienteTitulo}>
                    Asignar Operador y Vehículo
                  </Text>
                </View>
                <Text style={styles.pendienteSubtitulo}>
                  Requeridos para completar el vale
                </Text>

                <FormAutocomplete
                  label="Operador"
                  value={selectedOperador?.id_operador}
                  onSelect={setSelectedOperador}
                  items={operadoresFiltrados}
                  displayField="nombre_completo"
                  valueField="id_operador"
                  placeholder="Buscar operador..."
                  disabled={savingDatos}
                />

                <FormAutocomplete
                  label="Placas del Vehículo"
                  value={selectedVehiculo?.id_vehiculo}
                  onSelect={setSelectedVehiculo}
                  items={vehiculosFiltrados}
                  displayField="placas"
                  valueField="id_vehiculo"
                  placeholder="Buscar placas..."
                  disabled={savingDatos}
                />

                {/* Botón secundario discreto */}
                <TouchableOpacity
                  style={[
                    styles.botonGuardarDatos,
                    (!selectedOperador || !selectedVehiculo) &&
                      styles.botonGuardarDatosDisabled,
                  ]}
                  onPress={handleGuardarDatosPendientes}
                  disabled={
                    savingDatos || !selectedOperador || !selectedVehiculo
                  }
                  activeOpacity={0.7}
                >
                  {savingDatos ? (
                    <ActivityIndicator size="small" color={colors.secondary} />
                  ) : (
                    <MaterialCommunityIcons
                      name="content-save"
                      size={16}
                      color={colors.secondary}
                    />
                  )}
                  <Text style={styles.botonGuardarDatosTexto}>
                    Guardar datos
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ← PASO 4.4: Sección de viajes justo arriba de los checkboxes */}
            <ViajesRentaSection
              viajes={viajes}
              loading={loadingViajes}
              registrando={registrando}
              puedeRegistrar={puedeRegistrar}
              totalViajes={totalViajes}
              onRegistrarViaje={registrarViaje}
            />

            <FormCheckbox
              label="Renta por día completo"
              value={esRentaPorDia}
              onChange={(value) => {
                setEsRentaPorDia(value);
                if (value) setEsRentaPorMedioDia(false);
              }}
            />

            <FormCheckbox
              label="Renta por medio día"
              value={esRentaPorMedioDia}
              onChange={(value) => {
                setEsRentaPorMedioDia(value);
                if (value) setEsRentaPorDia(false);
              }}
            />

            <CustomTimePicker
              label="Hora de Fin"
              value={horaFin}
              onChange={setHoraFin}
              disabled={esRentaPorDia || esRentaPorMedioDia}
            />

            <FormInput
              label="Notas (opcional)"
              value={notasAdicionales}
              onChangeText={setNotasAdicionales}
              placeholder=""
              multiline
              maxLength={200}
            />

            <EvidenciaCaptura
              folioVale={vale?.folio}
              foto={foto}
              fotoUrl={fotoUrl}
              ubicacion={ubicacion}
              distanciaObra={distanciaObra}
              dentroDelRadio={dentroDelRadio}
              obraTieneCoordenadas={obraTieneCoordenadas}
              radioConfigurado={radioConfigurado}
              loadingFoto={loadingFoto}
              loadingUbicacion={loadingUbicacion}
              errorFoto={errorFoto}
              errorUbicacion={errorUbicacion}
              onTomarFoto={tomarFoto}
              onCapturarUbicacion={capturarUbicacion}
            />

            {mensajeBloqueo && (
              <View style={styles.bloqueoContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.bloqueoText}>{mensajeBloqueo}</Text>
              </View>
            )}

            <PrimaryButton
              title="Completar Vale"
              onPress={handleGuardarHoraFin}
              loading={saving}
              disabled={
                saving ||
                !!mensajeBloqueo ||
                (!esRentaPorDia && !esRentaPorMedioDia && !horaFin) ||
                !evidenciaLista ||
                (obraTieneCoordenadas && dentroDelRadio === false)
              }
              icon="check-circle"
              backgroundColor={colors.accent}
            />

            <Text style={styles.helperText}>
              {esRentaPorDia
                ? "Renta por día completo — mínimo 8 hrs desde inicio"
                : esRentaPorMedioDia
                  ? "Renta por medio día — mínimo 4 hrs desde inicio"
                  : "Hora de fin requerida para renta por hora"}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </KeyboardAvoidingScrollView>

      {/* Modal de Éxito */}
      <SuccessModal
        visible={showSuccessModal}
        title="Vale Completado"
        message={
          successData?.esRentaPorDia
            ? `Renta por día completo\nViajes: ${successData?.numeroViajes}\n\n¿Deseas generar el PDF ahora?`
            : successData?.esRentaPorMedioDia
              ? `Renta por medio día\nViajes: ${successData?.numeroViajes}\n\n¿Deseas generar el PDF ahora?`
              : `Total de horas: ${successData?.totalHoras} hrs\nViajes: ${successData?.numeroViajes}\n\n¿Deseas generar el PDF ahora?`
        }
        primaryAction={{
          text: "Generar PDF",
          icon: "file-pdf-box",
          onPress: handleGenerarPDFAhora,
        }}
        onClose={handleCloseSuccess}
      />

      {/* Generador de PDF invisible */}
      {updatedVale && triggerPDF && (
        <View style={{ position: "absolute", left: -9999 }}>
          <GenerarPDFButton
            valeData={updatedVale}
            tipoVale="renta"
            colorCopia="blanco"
            autoTrigger={true}
            onSuccess={() => {
              setTriggerPDF(false);
              handleCloseSuccess();
            }}
          />
        </View>
      )}
    </View>
  );
};

export default ValeDetalleRenta;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  folio: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "30",
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "right",
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  totalContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
  },
  notasContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  notasHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notasLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginLeft: 8,
  },
  notasText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bloqueoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3EE",
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  bloqueoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  seccionPendiente: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  pendienteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  pendienteTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  pendienteSubtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  datosPendientesInline: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  botonGuardarDatos: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
    marginTop: 4,
  },
  botonGuardarDatosDisabled: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  botonGuardarDatosTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondary,
  },
});
