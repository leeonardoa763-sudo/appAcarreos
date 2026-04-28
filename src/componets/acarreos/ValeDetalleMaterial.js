/**
 * components/acarreos/ValeDetalleMaterial.js
 *
 * Componente principal orquestador para vales de MATERIAL.
 * Contiene toda la lógica y delega el render a subcomponentes.
 *
 * SUBCOMPONENTES (helpersMaterial/):
 * - ValeInfoGeneral      → Sección info general
 * - ValeInfoDetalles     → Sección detalles material + precios
 * - ViajesMaterialSection → Registro de viajes + completar vale
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { useAuth } from "../../hooks/useAuth";
import { BLUETOOTH_ENABLED } from "../../config/features";

import KeyboardAvoidingScrollView from "../common/KeyboardAvoidingScrollView";
import StatusBadge from "../common/StatusBadge";
import SuccessModal from "../common/SuccessModal";
import GenerarPDFButton from "../vale/GenerarPDFButton";

import { useCancelarVale } from "../../hooks/useCancelarVale";
import { useViajesMaterial } from "../../hooks/useViajesMaterial";

import ModalCancelarVale from "../common/ModalCancelarVale";
import ViajesMaterialSection from "./helpersMaterial/ViajesMaterialSection";

import styles from "./helpersMaterial/valeDetalleMaterialStyles";
import ValeInfoGeneral from "./helpersMaterial/ValeInfoGeneral";
import ValeInfoDetalles from "./helpersMaterial/ValeInfoDetalles";
import TicketsMaterialSection from "./helpersMaterial/TicketsMaterialSection";
import SeccionViajesMaterialCompletado from "./helpersMaterial/SeccionViajesMaterialCompletado";
import { useReimprimirPDF } from "../../hooks/useReimprimirPDF";
import ModalImprimirTicketRenta from "./rentaHelpers/ModalImprimirTicketRenta";

let generarTicketMaterial;
if (BLUETOOTH_ENABLED) {
  const tg = require("../../services/ticketGenerator");
  generarTicketMaterial = tg.generarTicketMaterial;
}

const ValeDetalleMaterial = ({ vale, onClose, onRefresh }) => {
  const { userProfile, userRole } = useAuth();
  const esChecador = userRole === "CHECADOR";

  const {
    yaReimprimio,
    loading: loadingReimpresion,
    marcarReimprimido,
  } = useReimprimirPDF(vale?.id_vale, userRole);

  const {
    modalVisible: modalCancelarVisible,
    motivo,
    errorMotivo,
    cancelando,
    puedeCancel,
    abrirModal,
    cerrarModal,
    handleCambioMotivo,
    confirmarCancelacion,
    MOTIVO_MIN_CHARS,
  } = useCancelarVale(vale, () => {
    onRefresh();
    onClose();
  });

  // ─── Estados ──────────────────────────────────────────────────────────────
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [updatedVale, setUpdatedVale] = useState(null);
  const [triggerPDF, setTriggerPDF] = useState(false);
  const [showModalImpresion, setShowModalImpresion] = useState(false);
  const [valeParaImpresion, setValeParaImpresion] = useState(null);
  const [notasAdicionales, setNotasAdicionales] = useState("");

  const [valeLocal, setValeLocal] = useState(vale);

  const isInitialized = useRef(false);
  const lastValeId = useRef(null);

  // ─── Datos derivados del vale ─────────────────────────────────────────────
  const detalleMaterial =
    updatedVale?.vale_material_detalles?.[0] ??
    valeLocal?.vale_material_detalles?.[0] ??
    vale?.vale_material_detalles?.[0];

  const tieneDatosPendientes = !vale?.id_operador || !vale?.id_vehiculo;
  const esTipo3 = detalleMaterial?.material?.id_tipo_de_material === 3;
  const tipoMaterial = detalleMaterial?.material?.id_tipo_de_material ?? null;

  // ─── Lógica de fecha operacional ──────────────────────────────────────────
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const fechaOperacional = vale?.fecha_programada
    ? (() => {
        const [y, m, d] = vale.fecha_programada.split("-").map(Number);
        return new Date(y, m - 1, d);
      })()
    : vale?.fecha_creacion
      ? new Date(vale.fecha_creacion)
      : null;

  const canComplete =
    vale?.estado === "en_proceso" &&
    detalleMaterial &&
    !tieneDatosPendientes;

  // ─── Hook de viajes ───────────────────────────────────────────────────────
  const {
    viajes,
    loading: loadingViajes,
    registrando,
    saving,
    totalViajes,
    puedeRegistrar,
    minutosRestantes,
    registrarViaje,
    completarVale,
    actualizarFotoViaje,
  } = useViajesMaterial(
    detalleMaterial?.id_detalle_material,
    vale?.id_vale,
    detalleMaterial,
    vale?.id_obra,
  );

  const [totalTickets, setTotalTickets] = useState(0);

  const obraData = vale?.obras ?? null;

  // ─── Cleanup al desmontar ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isInitialized.current = false;
      lastValeId.current = null;
    };
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  // ─── Completar vale ───────────────────────────────────────────────────────
  const handleCompletar = useCallback(async () => {
    if (totalTickets > 0 && totalViajes !== totalTickets) {
      Alert.alert(
        "Viajes incompletos",
        `Tienes ${totalTickets} ticket${totalTickets > 1 ? "s" : ""} impresos pero solo ${totalViajes} viaje${totalViajes !== 1 ? "s" : ""} registrado${totalViajes !== 1 ? "s" : ""}. Debes registrar el viaje pendiente antes de completar.`,
        [{ text: "Entendido" }],
      );
      return;
    }

    const valeCompletado = await completarVale({
      idPersona: userProfile?.id_persona,
      notasAdicionales: notasAdicionales.trim() || null,
    });
    if (!valeCompletado) return;

    setUpdatedVale(valeCompletado);
    const detalle = valeCompletado.vale_material_detalles?.[0];
    const totalViajesNum =
      valeCompletado.vale_material_detalles?.[0]?.vale_material_viajes
        ?.length ?? 0;
    const totalVolumen = parseFloat(detalle?.volumen_real_m3 || 0).toFixed(2);
    const totalCosto = detalle?.costo_total
      ? `$${parseFloat(detalle.costo_total).toFixed(2)}`
      : null;

    setSuccessData({ totalViajes: totalViajesNum, totalVolumen, totalCosto });
    setShowSuccessModal(true);
  }, [completarVale, userProfile, totalTickets, totalViajes]);

  const handleReimprimirPDF = useCallback(() => {
    Alert.alert(
      "Reimprimir PDF",
      "Solo puedes reimprimir este vale una vez mas. Despues de compartirlo no estara disponible.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: () => {
            marcarReimprimido();
            if (!updatedVale) setUpdatedVale(vale);
            setTimeout(() => setTriggerPDF(true), 100);
          },
        },
      ],
    );
  }, [marcarReimprimido, updatedVale, vale]);

  // ─── Cerrar modal de éxito ────────────────────────────────────────────────
  const handleCloseSuccess = useCallback(() => {
    setShowSuccessModal(false);
    onRefresh();
    onClose();
  }, [onRefresh, onClose]);

  // ─── Disparar generación de PDF ───────────────────────────────────────────
  const handleGenerarPDFAhora = useCallback(() => {
    if (!updatedVale) {
      Alert.alert("Error", "No hay datos del vale actualizado");
      return;
    }
    setShowSuccessModal(false);
    setTimeout(() => setTriggerPDF(true), 100);
  }, [updatedVale]);

  // ─── Guard ────────────────────────────────────────────────────────────────
  if (!vale || !detalleMaterial) return null;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.folio}>{vale.folio}</Text>
          <StatusBadge estado={vale.estado} />
        </View>

        {/* Vale programado */}
        {vale?.estado === "en_proceso" && vale?.fecha_programada && (
          <View style={styles.programadoContainer}>
            <MaterialCommunityIcons
              name="calendar-arrow-right"
              size={18}
              color={colors.secondary}
            />
            <Text style={styles.programadoTexto}>
              Vale programado para el{" "}
              {(() => {
                const [y, m, d] = vale.fecha_programada.split("-").map(Number);
                return new Date(y, m - 1, d);
              })().toLocaleDateString("es-MX", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </Text>
          </View>
        )}

        {/* Info general del vale */}
        <ValeInfoGeneral
          vale={valeLocal}
          detalleMaterial={detalleMaterial}
          formatDate={formatDate}
          userProfile={userProfile}
        />

        {/* Detalles de material y precios */}
        <ValeInfoDetalles
          vale={valeLocal}
          detalleMaterial={detalleMaterial}
          esTipo3={esTipo3}
          formatDate={formatDate}
          userProfile={userProfile}
        />
        {/* Viajes registrados — solo cuando el vale ya está completado */}
        {vale?.estado !== "en_proceso" && (
          <SeccionViajesMaterialCompletado
            viajes={detalleMaterial?.vale_material_viajes || []}
            loading={false}
            totalViajes={detalleMaterial?.vale_material_viajes?.length || 0}
            esTipo3={esTipo3}
            bancoDefault={detalleMaterial?.bancos?.banco || null}
            esChecador={esChecador}
          />
        )}

        {/* Aviso: operador/vehículo pendientes */}
        {tieneDatosPendientes && vale?.estado === "en_proceso" && (
          <View style={styles.pendientesAviso}>
            <MaterialCommunityIcons
              name="truck-alert-outline"
              size={22}
              color={colors.textSecondary}
            />
            <View style={styles.pendientesAvisoTextos}>
              <Text style={styles.pendientesAvisoTitulo}>
                Sin operador ni vehiculo
              </Text>
              <Text style={styles.pendientesAvisoSubtitulo}>
                Asigna un vehiculo desde la pantalla Vales
              </Text>
            </View>
          </View>
        )}

        {/* Tickets de material — visible siempre en_proceso (primer ticket no requiere operador) */}
        {valeLocal?.estado === "en_proceso" && detalleMaterial && (
          <TicketsMaterialSection
            vale={valeLocal}
            detalle={detalleMaterial}
            totalViajes={totalViajes}
            onTotalTicketsChange={setTotalTickets}
            esTipo3={esTipo3}
            ultimoIdViaje={viajes[viajes.length - 1]?.id_viaje ?? null}
          />
        )}

        {/* Sección de viajes — visible solo en_proceso y con canComplete */}
        {canComplete && (
          <ViajesMaterialSection
            vale={valeLocal}
            detalle={detalleMaterial}
            viajes={viajes}
            loading={loadingViajes}
            registrando={registrando}
            totalViajes={totalViajes}
            totalTickets={totalTickets}
            onRegistrarViaje={registrarViaje}
            puedeRegistrar={puedeRegistrar}
            minutosRestantes={minutosRestantes}
            tipoMaterial={tipoMaterial}
            onCompletar={handleCompletar}
            saving={saving}
            obraData={obraData}
            actualizarFotoViaje={actualizarFotoViaje}
            esChecador={esChecador}
            notasAdicionales={notasAdicionales}
            setNotasAdicionales={setNotasAdicionales}
          />
        )}
        {/* Botón reimprimir PDF — todos los estados excepto en_proceso */}
        {vale?.estado !== "en_proceso" &&
          !loadingReimpresion &&
          (yaReimprimio ? (
            <View style={styles.reimprimirAgotado}>
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.reimprimirAgotadoTexto}>
                PDF ya fue reimprimido
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.botonReimprimir}
              onPress={handleReimprimirPDF}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={18}
                color={colors.secondary}
              />
              <Text style={styles.botonReimprimirTexto}>Reimprimir PDF</Text>
            </TouchableOpacity>
          ))}
        {/* Botón cancelar vale — solo en_proceso */}
        {puedeCancel && (
          <TouchableOpacity style={styles.botonCancelar} onPress={abrirModal}>
            <MaterialCommunityIcons
              name="cancel"
              size={18}
              color={colors.danger}
            />
            <Text style={styles.textoCancelar}>Cancelar Vale</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </KeyboardAvoidingScrollView>

      {/* Modal cancelación */}
      <ModalCancelarVale
        visible={modalCancelarVisible}
        motivo={motivo}
        errorMotivo={errorMotivo}
        cancelando={cancelando}
        onCambioMotivo={handleCambioMotivo}
        onConfirmar={confirmarCancelacion}
        onCerrar={cerrarModal}
        MOTIVO_MIN_CHARS={MOTIVO_MIN_CHARS}
      />

      {/* Modal éxito al completar */}
      <SuccessModal
        visible={showSuccessModal}
        title="Vale Completado"
        message={`Viajes: ${successData?.totalViajes}\nVolumen total: ${successData?.totalVolumen} m³${successData?.totalCosto ? `\nCosto total: ${successData?.totalCosto}` : ""}\n\n¿Deseas generar el PDF ahora?`}
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
            tipoVale="material"
            colorCopia="blanca"
            autoTrigger={true}
            onSuccess={() => {
              setTriggerPDF(false);
              setValeParaImpresion(updatedVale);
              setShowModalImpresion(true);
            }}
          />
        </View>
      )}

      {/* Overlay de generación de PDF */}
      {triggerPDF && (
        <View style={styles.pdfLoadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.pdfLoadingTexto}>Generando PDF...</Text>
        </View>
      )}

      {/* Modal impresión ticket físico — aparece después de compartir PDF */}
      <ModalImprimirTicketRenta
        visible={showModalImpresion}
        valeData={valeParaImpresion}
        generarLineas={
          BLUETOOTH_ENABLED && generarTicketMaterial && valeParaImpresion
            ? () => generarTicketMaterial(valeParaImpresion)
            : undefined
        }
        resumenDatos={
          valeParaImpresion
            ? {
                folio: valeParaImpresion.folio,
                operador: valeParaImpresion.operadores?.nombre_completo,
                placas: valeParaImpresion.vehiculos?.placas,
                descripcion: `${valeParaImpresion.vale_material_detalles?.[0]?.material?.material ?? "Material"} — ${valeParaImpresion.vale_material_detalles?.[0]?.bancos?.banco ?? "Banco"}`,
              }
            : undefined
        }
        onImpreso={() => {
          setShowModalImpresion(false);
          setValeParaImpresion(null);
          handleCloseSuccess();
        }}
        onSinImpresora={() => {
          setShowModalImpresion(false);
          setValeParaImpresion(null);
          handleCloseSuccess();
        }}
      />
    </View>
  );
};

export default ValeDetalleMaterial;
