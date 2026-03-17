/**
 * components/acarreos/ValeDetalleMaterial.js
 *
 * Componente principal orquestador para vales de MATERIAL.
 * Contiene toda la lógica y delega el render a subcomponentes.
 *
 * SUBCOMPONENTES (helpersMaterial/):
 * - ValeInfoGeneral      → Sección info general
 * - ValeInfoDetalles     → Sección detalles material + precios
 * - ValeDatosPendientes  → Formulario operador/vehículo
 * - ViajesMaterialSection → Registro de viajes + completar vale
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuth";
import { BLUETOOTH_ENABLED } from "../../config/features";

import KeyboardAvoidingScrollView from "../common/KeyboardAvoidingScrollView";
import StatusBadge from "../common/StatusBadge";
import SuccessModal from "../common/SuccessModal";
import GenerarPDFButton from "../vale/GenerarPDFButton";

import { useCatalogos } from "../../hooks/useCatalogos";
import { useCancelarVale } from "../../hooks/useCancelarVale";
import { useViajesMaterial } from "../../hooks/useViajesMaterial";

import ModalCancelarVale from "../common/ModalCancelarVale";
import ViajesMaterialSection from "./helpersMaterial/ViajesMaterialSection";

import styles from "./helpersMaterial/valeDetalleMaterialStyles";
import ValeInfoGeneral from "./helpersMaterial/ValeInfoGeneral";
import ValeInfoDetalles from "./helpersMaterial/ValeInfoDetalles";
import ValeDatosPendientes from "./helpersMaterial/ValeDatosPendientes";
import TicketsMaterialSection from "./helpersMaterial/TicketsMaterialSection";
import SeccionViajesMaterialCompletado from "./helpersMaterial/SeccionViajesMaterialCompletado";
import useEvidenciaVale from "../../hooks/useEvidenciaVale";
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
  } = useReimprimirPDF(vale?.id_vale);

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

  const { operadores, vehiculos } = useCatalogos(["operadores", "vehiculos"]);

  // ─── Estados ──────────────────────────────────────────────────────────────
  const [selectedOperador, setSelectedOperador] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [savingDatos, setSavingDatos] = useState(false);
  const [datosPendientesGuardados, setDatosPendientesGuardados] =
    useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [updatedVale, setUpdatedVale] = useState(null);
  const [triggerPDF, setTriggerPDF] = useState(false);
  const [showModalImpresion, setShowModalImpresion] = useState(false);
  const [valeParaImpresion, setValeParaImpresion] = useState(null);

  const [valeLocal, setValeLocal] = useState(vale);

  const isInitialized = useRef(false);
  const lastValeId = useRef(null);

  // ─── Datos derivados del vale ─────────────────────────────────────────────
  const detalleMaterial =
    valeLocal?.vale_material_detalles?.[0] ?? vale?.vale_material_detalles?.[0];

  const tieneDatosPendientes = !vale?.id_operador || !vale?.id_vehiculo;
  const esTipo3 = detalleMaterial?.material?.id_tipo_de_material === 3;
  const tipoMaterial = detalleMaterial?.material?.id_tipo_de_material ?? null;

  const sindicatoId = detalleMaterial?.id_sindicato;
  const operadoresFiltrados = operadores.filter(
    (op) => !sindicatoId || op.id_sindicato === sindicatoId,
  );
  const vehiculosFiltrados = vehiculos.filter(
    (v) => !sindicatoId || v.id_sindicato === sindicatoId,
  );

  // ─── Lógica de fecha operacional ──────────────────────────────────────────
  const hoy = new Date();
  const fechaOperacional = vale?.fecha_programada
    ? (() => {
        const [y, m, d] = vale.fecha_programada.split("-").map(Number);
        return new Date(y, m - 1, d);
      })()
    : vale?.fecha_creacion
      ? new Date(vale.fecha_creacion)
      : null;

  const esMismoDia = fechaOperacional
    ? fechaOperacional.getFullYear() === hoy.getFullYear() &&
      fechaOperacional.getMonth() === hoy.getMonth() &&
      fechaOperacional.getDate() === hoy.getDate()
    : false;

  const canComplete =
    vale?.estado === "en_proceso" &&
    detalleMaterial &&
    esMismoDia &&
    (!tieneDatosPendientes || datosPendientesGuardados);

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
  } = useViajesMaterial(
    detalleMaterial?.id_detalle_material,
    vale?.id_vale,
    detalleMaterial,
    vale?.id_obra,
  );

  const [totalTickets, setTotalTickets] = useState(0);

  const obraData = vale?.obras ?? null;

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

  const evidenciaProps = {
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
    onTomarFoto: tomarFoto,
    onCapturarUbicacion: capturarUbicacion,
  };

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

  // ─── Guardar datos pendientes (operador/vehículo) ─────────────────────────
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

      if (selectedVehiculo.capacidad_m3) {
        await supabase
          .from("vale_material_detalles")
          .update({ capacidad_m3: selectedVehiculo.capacidad_m3 })
          .eq("id_detalle_material", detalleMaterial.id_detalle_material);
      }

      console.log("[ValeDetalleMaterial] Guardado en Supabase OK");
      console.log(
        "[ValeDetalleMaterial] Operador guardado:",
        selectedOperador?.nombre_completo,
      );
      console.log(
        "[ValeDetalleMaterial] Placas guardadas:",
        selectedVehiculo?.placas,
      );

      setValeLocal({
        ...vale,
        id_operador: selectedOperador.id_operador,
        id_vehiculo: selectedVehiculo.id_vehiculo,
        operadores: { nombre_completo: selectedOperador.nombre_completo },
        vehiculos: {
          placas: selectedVehiculo.placas,
          capacidad_m3: selectedVehiculo.capacidad_m3,
          sindicatos: selectedVehiculo.sindicatos ?? null,
        },
      });

      console.log(
        "[ValeDetalleMaterial] valeLocal actualizado con operador y placas",
      );
      setDatosPendientesGuardados(true);
    } catch (error) {
      console.error(
        "[ValeDetalleMaterial] Error guardando datos pendientes:",
        error,
      );
      Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingDatos(false);
    }
  }, [selectedOperador, selectedVehiculo, vale, detalleMaterial]);

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
      fotoUrl,
      ubicacion,
      distanciaObra,
      idPersona: userProfile?.id_persona,
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
  }, [
    completarVale,
    fotoUrl,
    ubicacion,
    distanciaObra,
    userProfile,
    totalTickets,
    totalViajes,
  ]);

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
              {new Date(vale.fecha_programada).toLocaleDateString("es-MX", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </Text>
          </View>
        )}

        {/* Bloqueo por fecha */}
        {vale?.estado === "en_proceso" &&
          !esMismoDia &&
          !vale?.fecha_programada && (
            <View style={styles.bloqueadoContainer}>
              <MaterialCommunityIcons
                name="lock-clock"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.bloqueadoTexto}>
                Este vale no puede completarse porque fue creado el{" "}
                {formatDate(vale.fecha_creacion)}. Solo se puede completar el
                mismo día.
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
          />
        )}

        {/* Asignar operador/vehículo si faltan */}
        {tieneDatosPendientes &&
          !datosPendientesGuardados &&
          vale?.estado === "en_proceso" && (
            <ValeDatosPendientes
              selectedOperador={selectedOperador}
              setSelectedOperador={setSelectedOperador}
              selectedVehiculo={selectedVehiculo}
              setSelectedVehiculo={setSelectedVehiculo}
              operadoresFiltrados={operadoresFiltrados}
              vehiculosFiltrados={vehiculosFiltrados}
              savingDatos={savingDatos}
              onGuardar={handleGuardarDatosPendientes}
            />
          )}
        {/* Tickets de material — visible en_proceso con operador asignado */}
        {valeLocal?.estado === "en_proceso" && detalleMaterial && (
          <TicketsMaterialSection
            vale={valeLocal}
            detalle={detalleMaterial}
            totalViajes={totalViajes}
            operadorYVehiculoGuardados={datosPendientesGuardados}
            onTotalTicketsChange={setTotalTickets}
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
            onRegistrarViaje={registrarViaje}
            puedeRegistrar={puedeRegistrar}
            minutosRestantes={minutosRestantes}
            tipoMaterial={tipoMaterial}
            onCompletar={handleCompletar}
            saving={saving}
            evidenciaProps={evidenciaProps}
            esChecador={esChecador}
          />
        )}
        {/* Botón reimprimir PDF — solo en emitido, una sola vez */}
        {vale?.estado === "emitido" &&
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
