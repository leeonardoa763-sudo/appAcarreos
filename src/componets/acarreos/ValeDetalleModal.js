/**
 * components/acarreos/ValeDetalleModal.js
 *
 * Modal para mostrar información completa de un vale
 *
 * PROPÓSITO:
 * - Mostrar todos los detalles del vale seleccionado
 * - Permitir capturar hora de salida en vales de renta sin completar
 * - Diferenciar visualmente entre Material y Renta
 * - Acciones según estado del vale
 *
 * USADO EN:
 * - AcarreosScreen
 *
 * PROPS:
 * - visible: boolean - Controla visibilidad del modal
 * - vale: object - Objeto completo del vale
 * - onClose: function - Callback para cerrar modal
 * - onRefresh: function - Callback para refrescar lista después de actualizar
 *
 * EJEMPLO DE USO:
 * <ValeDetalleModal
 *   visible={modalVisible}
 *   vale={selectedVale}
 *   onClose={handleCloseModal}
 *   onRefresh={fetchVales}
 * />
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
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

const ValeDetalleModal = ({ visible, vale, onClose, onRefresh }) => {
  const [horaFin, setHoraFin] = useState(null);
  const [saving, setSaving] = useState(false);
  const [numeroViajes, setNumeroViajes] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [triggerPDF, setTriggerPDF] = useState(false);
  const [updatedVale, setUpdatedVale] = useState(null);
  const [esRentaPorDia, setEsRentaPorDia] = useState(false);

  if (!vale) return null;

  const isMaterial = vale.tipo_vale === "material";
  const isRenta = vale.tipo_vale === "renta";
  const detalleRenta = isRenta ? vale.vale_renta_detalle?.[0] : null;
  const detalleMaterial = isMaterial ? vale.vale_material_detalles?.[0] : null;
  // Para determinar el tipo de renta
  const esRentaPorDia = detalleRenta?.total_dias > 0;
  const esRentaPorHora =
    detalleRenta?.total_horas > 0 && detalleRenta?.total_dias === 0;

  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const calcularSubtotal = (detalle) => {
    if (!detalle.precios_renta) return "No disponible";

    let subtotal = 0;

    // MISMA LÓGICA QUE EN EL PDF
    const esRentaPorDia = detalle.total_dias === 1 && detalle.total_horas === 0;

    if (esRentaPorDia) {
      // RENTA POR DÍA: 1 día × tarifa_dia
      subtotal = detalle.precios_renta.costo_dia || 0;
    } else {
      // RENTA POR HORA: horas × tarifa_hora
      subtotal =
        (detalle.total_horas || 0) * (detalle.precios_renta.costo_hr || 0);
    }

    return `$${subtotal.toFixed(2)}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Sin hora";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canCaptureHoraFin =
    isRenta &&
    detalleRenta &&
    detalleRenta.hora_inicio &&
    !detalleRenta.hora_fin &&
    !detalleRenta.total_dias;

  const handleGuardarHoraFin = async () => {
    console.log(
      "[ValeDetalleModal] handleGuardarHoraFin - esRentaPorDia:",
      esRentaPorDia
    );

    if (!esRentaPorDia && !horaFin) {
      Alert.alert("Error", "Debes seleccionar una hora de fin");
      return;
    }

    if (!numeroViajes || numeroViajes < 1) {
      Alert.alert("Error", "El número de viajes debe ser al menos 1");
      return;
    }

    try {
      setSaving(true);

      let totalHoras = 0;
      let totalDias = 0;
      let horaFinFinal = null;

      if (esRentaPorDia) {
        console.log("[ValeDetalleModal] Guardando como RENTA POR DÍA");
        totalHoras = 0;
        totalDias = 1;
        horaFinFinal = null;
      } else {
        console.log("[ValeDetalleModal] Guardando como RENTA POR HORA");
        const horaInicio = new Date(detalleRenta.hora_inicio);
        const horaFinDate = new Date(horaFin);
        const diffMs = horaFinDate - horaInicio;
        totalHoras = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        totalDias = 0;
        horaFinFinal = horaFin;
      }

      console.log("[ValeDetalleModal] Datos a guardar:", {
        hora_fin: horaFinFinal,
        total_horas: totalHoras,
        total_dias: totalDias,
        numero_viajes: numeroViajes,
      });

      const { error, data } = await supabase
        .from("vale_renta_detalle")
        .update({
          hora_fin: horaFinFinal,
          total_horas: totalHoras,
          total_dias: totalDias,
          numero_viajes: numeroViajes,
        })
        .eq("id_vale_renta_detalle", detalleRenta.id_vale_renta_detalle)
        .select();

      if (error) throw error;
      console.log(
        "[ValeDetalleModal] Actualizando estado del vale a completado"
      );
      //-----------------------
      //Quitar lineas para que no se actulice estado y probar guardar pdf
      //-----------------------
      // Actualizar estado del vale a completado
      const { error: valeError } = await supabase
        .from("vales")
        .update({
          estado: "emitido",
        })
        .eq("id_vale", vale.id_vale);

      if (valeError) {
        console.error(
          "[ValeDetalleModal] Error actualizando estado:",
          valeError
        );
        throw valeError;
      }
      //-----------------------
      //Quitar lineas para que no se actulice estado y probar guardar pdf
      //-----------------------

      // Actualizar vale con nuevos datos
      const valeActualizado = {
        ...vale,
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
        numeroViajes,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error guardando hora de fin:", error);
      Alert.alert("Error", "No se pudo completar el vale. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header del modal */}
          <View
            style={[
              styles.modalHeader,
              isMaterial && styles.modalHeaderMaterial,
              isRenta && styles.modalHeaderRenta,
            ]}
          >
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name={isMaterial ? "package-variant" : "truck-cargo-container"}
                size={28}
                color="#FFFFFF"
              />
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle}>
                  Vale de {isMaterial ? "Material" : "Renta"}
                </Text>
                <Text style={styles.modalFolio}>{vale.folio}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Contenido del modal */}
          <ScrollView
            style={styles.modalContent}
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

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color={colors.textSecondary}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Fecha de creación</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(vale.fecha_creacion)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="account-hard-hat"
                  size={20}
                  color={colors.textSecondary}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Operador</Text>
                  <Text style={styles.infoValue}>{vale.operador_nombre}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="car"
                  size={20}
                  color={colors.textSecondary}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Placas</Text>
                  <Text style={styles.infoValue}>{vale.placas_vehiculo}</Text>
                </View>
              </View>
            </View>
            {/* Detalles específicos de Material */}
            {isMaterial && detalleMaterial && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalles del Material</Text>

                {detalleMaterial.cantidad_pedida_m3 && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="cube-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Cantidad pedida</Text>
                      <Text style={styles.infoValue}>
                        {detalleMaterial.cantidad_pedida_m3} m³
                      </Text>
                    </View>
                  </View>
                )}

                {detalleMaterial.capacidad_m3 && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="truck"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Capacidad</Text>
                      <Text style={styles.infoValue}>
                        {detalleMaterial.capacidad_m3} m³
                      </Text>
                    </View>
                  </View>
                )}

                {detalleMaterial.distancia_km && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="map-marker-distance"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Distancia</Text>
                      <Text style={styles.infoValue}>
                        {detalleMaterial.distancia_km} km
                      </Text>
                    </View>
                  </View>
                )}

                {detalleMaterial.peso_ton && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="weight"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Peso</Text>
                      <Text style={styles.infoValue}>
                        {detalleMaterial.peso_ton} ton
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
            {/* Detalles específicos de Renta */}
            {isRenta && detalleRenta && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalles de Renta</Text>

                {detalleRenta.capacidad_m3 && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="truck"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Capacidad</Text>
                      <Text style={styles.infoValue}>
                        {detalleRenta.capacidad_m3} m³
                      </Text>
                    </View>
                  </View>
                )}

                {detalleRenta.material?.material && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="package-variant"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Material</Text>
                      <Text style={styles.infoValue}>
                        {detalleRenta.material.material}
                      </Text>
                    </View>
                  </View>
                )}

                {detalleRenta.sindicatos?.sindicato && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Sindicato</Text>
                      <Text style={styles.infoValue}>
                        {detalleRenta.sindicatos.sindicato}
                      </Text>
                    </View>
                  </View>
                )}

                {detalleRenta.hora_inicio && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="clock-start"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Hora de inicio</Text>
                      <Text style={styles.infoValue}>
                        {formatTime(detalleRenta.hora_inicio)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* NUEVA SECCIÓN: SOLO PARA VALES EMITIDOS */}
                {vale.estado === "emitido" && (
                  <>
                    {/* HORA FIN Y TIEMPO TOTAL */}
                    {detalleRenta.hora_fin && (
                      <>
                        <View style={styles.infoRow}>
                          <MaterialCommunityIcons
                            name="clock-end"
                            size={20}
                            color={colors.textSecondary}
                          />
                          <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Hora de fin</Text>
                            <Text style={styles.infoValue}>
                              {formatTime(detalleRenta.hora_fin)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.infoRow}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={20}
                            color={colors.textSecondary}
                          />
                          <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Total de horas</Text>
                            <Text style={styles.infoValue}>
                              {detalleRenta.total_horas} hrs
                            </Text>
                          </View>
                        </View>
                      </>
                    )}

                    {/* DIAS TOTALES */}
                    {detalleRenta.total_dias > 0 && (
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons
                          name="calendar"
                          size={20}
                          color={colors.textSecondary}
                        />
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>Total de días</Text>
                          <Text style={styles.infoValue}>
                            {detalleRenta.total_dias} días
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* VIAJES */}
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons
                        name="repeat"
                        size={20}
                        color={colors.textSecondary}
                      />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Número de viajes</Text>
                        <Text style={styles.infoValue}>
                          {detalleRenta.numero_viajes}
                        </Text>
                      </View>
                    </View>

                    {/* PRECIOS - MOSTRAR SEGÚN TIPO */}
                    {detalleRenta.precios_renta && (
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons
                          name="cash"
                          size={20}
                          color={colors.textSecondary}
                        />
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>
                            {esRentaPorDia
                              ? "Tarifa por día"
                              : "Tarifa por hora"}
                          </Text>
                          <Text style={styles.infoValue}>
                            {esRentaPorDia
                              ? `$${detalleRenta.precios_renta.costo_dia?.toFixed(
                                  2
                                )}`
                              : `$${detalleRenta.precios_renta.costo_hr?.toFixed(
                                  2
                                )} / hr`}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* CÁLCULO DE SUBTOTAL */}
                    {(detalleRenta.total_horas > 0 ||
                      detalleRenta.total_dias > 0) &&
                      detalleRenta.precios_renta && (
                        <View style={styles.infoRow}>
                          <MaterialCommunityIcons
                            name="calculator"
                            size={20}
                            color={colors.textSecondary}
                          />
                          <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Subtotal</Text>
                            <Text
                              style={[styles.infoValue, styles.subtotalText]}
                            >
                              {calcularSubtotal(detalleRenta)}
                            </Text>
                          </View>
                        </View>
                      )}

                    {/* FECHA DE EMISIÓN */}
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={20}
                        color={colors.textSecondary}
                      />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Emitido el</Text>
                        <Text style={styles.infoValue}>
                          {formatDate(
                            vale.fecha_actualizacion || vale.fecha_creacion
                          )}{" "}
                          a las{" "}
                          {formatTime(
                            vale.fecha_actualizacion || vale.fecha_creacion
                          )}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {detalleRenta.notas_adicionales && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="note-text"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Notas</Text>
                      <Text style={styles.infoValue}>
                        {detalleRenta.notas_adicionales}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
            {/* Formulario para capturar hora de fin (solo si aplica) */}
            {canCaptureHoraFin && (
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
            {/* Botón para generar PDF (solo si hora_fin ya está capturada) */}
            {isRenta && detalleRenta?.hora_fin && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Generar Vale Blanco</Text>
                <Text style={styles.sectionSubtitle}>
                  Generar y comparte el PDF blanco del vale completado
                </Text>
                <GenerarPDFButton
                  valeData={vale}
                  tipoVale="renta"
                  colorCopia="blanco"
                  onSuccess={() => {
                    onRefresh();
                    onClose();
                  }}
                />
              </View>
            )}
            {/* Espaciador para scroll */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
        {/* Modal de Éxito */}
        <SuccessModal
          visible={showSuccessModal}
          title="Vale Completado"
          message={`Total de horas: ${successData?.totalHoras} hrs\nNúmero de viajes: ${successData?.numeroViajes}`}
          primaryAction={{
            text: "Imprimir Vale",
            icon: "printer",

            onPress: () => {
              setShowSuccessModal(false);
              setTimeout(() => {
                console.log("[ValeDetalleModal] Activando triggerPDF");
                setTriggerPDF(true);
              }, 300);
            },
          }}
          secondaryAction={{
            text: "Cerrar",
            onPress: () => {
              setShowSuccessModal(false);
              onRefresh();
              onClose();
            },
          }}
          onClose={() => {
            setShowSuccessModal(false);
            onRefresh();
            onClose();
          }}
        />

        {/* Componente oculto para generar PDF */}
        {triggerPDF && updatedVale && (
          <View style={{ position: "absolute", width: 0, height: 0 }}>
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
          </View>
        )}
      </View>
    </Modal>
  );
};

export default ValeDetalleModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderMaterial: {
    backgroundColor: colors.primary,
  },
  modalHeaderRenta: {
    backgroundColor: colors.secondary,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalFolio: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
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
    marginBottom: 16,
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
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
