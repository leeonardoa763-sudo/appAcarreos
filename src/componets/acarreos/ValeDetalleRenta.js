/**
 * components/acarreos/ValeDetalleRenta.js
 *
 * Orquestador principal del detalle de vale de RENTA.
 * Contiene toda la lógica de estado y callbacks.
 * El JSX se delega completamente a los helpers en rentaHelpers/
 *
 * USADO EN:
 * - ValeDetalleModal
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Alert, TouchableOpacity } from "react-native";
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useViajesRenta } from "../../hooks/useViajesRenta";
import useEvidenciaVale from "../../hooks/useEvidenciaVale";
import {
  validateHoraFinNoPosterior,
  validateTiempoMinimoRenta,
} from "../../utils/validations";

import KeyboardAvoidingScrollView from "../common/KeyboardAvoidingScrollView";
import StatusBadge from "../common/StatusBadge";
import SuccessModal from "../common/SuccessModal";
import GenerarPDFButton from "../vale/GenerarPDFButton";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import SeccionInfoGeneral from "./rentaHelpers/SeccionInfoGeneral";
import SeccionDetallesRenta from "./rentaHelpers/SeccionDetallesRenta";
import SeccionTarifas from "./rentaHelpers/SeccionTarifas";
import SeccionCompletarVale from "./rentaHelpers/SeccionCompletarVale";
import { rentaStyles as styles } from "./rentaHelpers/rentaStyles";
import TicketDescargaSection from "./rentaHelpers/TicketDescargaSection";
import SeccionViajesCompletado from "./rentaHelpers/SeccionViajesCompletado";
import { useReimprimirPDF } from "../../hooks/useReimprimirPDF";

import { useCancelarVale } from "../../hooks/useCancelarVale";
import ModalCancelarVale from "../common/ModalCancelarVale";
import ModalImprimirTicketRenta from "./rentaHelpers/ModalImprimirTicketRenta";

import { Text } from "react-native";

const ValeDetalleRenta = ({ vale, onClose, onRefresh }) => {
  const { userProfile, userRole } = useAuth();
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
  const detalleRenta = vale?.vale_renta_detalle?.[0];

  const {
    yaReimprimio,
    loading: loadingReimpresion,
    marcarReimprimido,
  } = useReimprimirPDF(vale?.id_vale, userRole);

  const tieneDatosPendientes = !vale?.id_operador || !vale?.id_vehiculo;
  const canComplete = vale?.estado === "en_proceso" && detalleRenta && !tieneDatosPendientes;
  const preciosRenta = detalleRenta?.precios_renta;
  const obraData = vale?.obras || null;

  // --- Estados del formulario ---
  const [horaFin, setHoraFin] = useState(null);
  const [numeroViajes, setNumeroViajes] = useState(1);
  const [esRentaPorDia, setEsRentaPorDia] = useState(false);
  const [esRentaPorMedioDia, setEsRentaPorMedioDia] = useState(false);
  const [notasAdicionales, setNotasAdicionales] = useState("");
  const [mensajeBloqueo, setMensajeBloqueo] = useState(null);

  // --- Estados de guardado ---
  const [saving, setSaving] = useState(false);
  const [totalTicketsDescarga, setTotalTicketsDescarga] = useState(0);
  const [valeLocal, setValeLocal] = useState(vale);
  const [detalleRentaLocal, setDetalleRentaLocal] = useState(detalleRenta);

  // --- Estados de éxito y PDF ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [updatedVale, setUpdatedVale] = useState(null);
  const [triggerPDF, setTriggerPDF] = useState(false);

  // --- Estado modal impresión obligatorio ---
  const [showModalImpresion, setShowModalImpresion] = useState(false);
  const [valeParaImpresion, setValeParaImpresion] = useState(null);

  // --- Refs para inicialización ---
  const isInitialized = useRef(false);
  const lastValeId = useRef(null);

  const formatCurrency = useCallback((valor) => {
    if (!valor) return "N/A";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(valor);
  }, []);

  // --- Hooks externos ---
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

  const {
    viajes,
    loading: loadingViajes,
    registrando,
    puedeRegistrar,
    totalViajes,
    registrarViaje,
  } = useViajesRenta(
    detalleRenta?.id_vale_renta_detalle,
    vale?.id_obra,
    detalleRenta?.hora_inicio,
  );

  const handleReimprimirPDF = useCallback(() => {
    Alert.alert(
      "Reimprimir PDF",
      "Solo puedes reimprimir este vale una vez mas. Despues de compartirlo no estara disponible nuevamente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: () => {
            marcarReimprimido();
            // Usar vale directo si updatedVale no existe (modal reabierto)
            if (!updatedVale) {
              setUpdatedVale(vale);
            }
            setTimeout(() => {
              setTriggerPDF(true);
            }, 100);
          },
        },
      ],
    );
  }, [marcarReimprimido, updatedVale, vale]);
  // Sincronizar valeLocal cuando se abre un vale diferente

  useEffect(() => {
    if (vale?.id_vale !== valeLocal?.id_vale) {
      setValeLocal(vale);
    } else if (vale?.id_operador && !valeLocal?.id_operador) {
      // El prop llegó actualizado del servidor con operador, sincronizar
      setValeLocal((prev) => ({ ...prev, ...vale }));
    }
  }, [vale?.id_vale, vale?.id_operador, vale?.id_vehiculo]);

  // --- Inicialización al cambiar de vale ---
  // Reset al abrir el modal con un vale diferente o al reabrirlo
  useEffect(() => {
    if (!vale) return;

    setValeLocal(vale);
    setDetalleRentaLocal(vale?.vale_renta_detalle?.[0] ?? detalleRenta);
    setHoraFin(null);
    setNumeroViajes(1);
    setEsRentaPorDia(false);
    setEsRentaPorMedioDia(false);
    setNotasAdicionales(detalleRenta?.notas_adicionales || "");
    isInitialized.current = false;
    lastValeId.current = null;
  }, [vale?.id_vale]);

  // --- Cleanup al desmontar ---
  useEffect(() => {
    return () => {
      isInitialized.current = false;
      lastValeId.current = null;
      setTriggerPDF(false);
      setUpdatedVale(null);
    };
  }, []);

  // --- Validación de bloqueo ---
  useEffect(() => {
    if (!canComplete || !detalleRenta) return;

    if (esRentaPorDia) {
      setMensajeBloqueo(
        validateTiempoMinimoRenta(detalleRenta.hora_inicio, "dia"),
      );
    } else if (esRentaPorMedioDia) {
      setMensajeBloqueo(
        validateTiempoMinimoRenta(detalleRenta.hora_inicio, "medio_dia"),
      );
    } else {
      setMensajeBloqueo(null);
    }
  }, [
    canComplete,
    detalleRenta,
    esRentaPorDia,
    esRentaPorMedioDia,
    detalleRenta?.hora_inicio,
  ]);

  // --- Formateadores ---
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const formatTime = useCallback((dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  // --- Handlers ---
  const handleCompletar = useCallback(async () => {
    if (!canComplete) return;

    if (totalViajes === 0) {
      Alert.alert(
        "Sin viajes registrados",
        "Debes registrar al menos un viaje antes de completar el vale.",
      );
      return;
    }

    if (totalTicketsDescarga > 0 && totalViajes !== totalTicketsDescarga) {
      Alert.alert(
        "No se puede completar",
        `Los tickets (${totalTicketsDescarga}) y los viajes (${totalViajes}) no coinciden. Deben ser iguales para completar el vale.`,
      );
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
      let horaFinFinal,
        totalHoras = 0,
        totalDias = 0,
        costoTotal = 0;

      if (esRentaPorDia) {
        totalDias = 1;
        horaFinFinal = null;
        costoTotal = parseFloat(preciosRenta.costo_dia);
      } else if (esRentaPorMedioDia) {
        totalDias = 0.5;
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
        costoTotal = parseFloat(preciosRenta.costo_hr) * totalHoras;
      }

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
          // Evidencia
          foto_evidencia_url: fotoUrl ?? null,
          latitud_completado: ubicacion?.latitud ?? null,
          longitud_completado: ubicacion?.longitud ?? null,
          distancia_obra_metros: distanciaObra ?? null,
        })
        .eq("id_vale_renta_detalle", detalleRenta.id_vale_renta_detalle);

      if (errorDetalle) throw errorDetalle;

      const { error: valeError } = await supabase
        .from("vales")
        .update({
          estado: "emitido",
          id_persona_completador: userProfile.id_persona,
          fecha_completado: new Date().toISOString(),
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
            // Evidencia
            foto_evidencia_url: fotoUrl ?? null,
            latitud_completado: ubicacion?.latitud ?? null,
            longitud_completado: ubicacion?.longitud ?? null,
            distancia_obra_metros: distanciaObra ?? null,
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
    vale,
    preciosRenta,
    userProfile,
    notasAdicionales,
    fotoUrl,
    ubicacion,
    distanciaObra,
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
    setTimeout(() => setTriggerPDF(true), 100);
  }, [updatedVale]);

  if (!vale || !detalleRenta) return null;

  // Props de evidencia agrupadas para SeccionCompletarVale
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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.folio}>{valeLocal.folio}</Text>
          <StatusBadge estado={valeLocal.estado} />
        </View>

        <SeccionInfoGeneral
          vale={valeLocal}
          detalleRenta={detalleRentaLocal}
          formatDate={formatDate}
        />

        <SeccionDetallesRenta
          vale={valeLocal}
          detalleRenta={detalleRentaLocal}
          formatTime={formatTime}
          formatDate={formatDate}
        />

        <SeccionTarifas
          vale={vale}
          detalleRenta={detalleRentaLocal}
          preciosRenta={preciosRenta}
          userProfile={userProfile}
          formatCurrency={formatCurrency}
        />

        {/* Tickets de descarga — solo para materiales es_material_descarga = true */}
        <TicketDescargaSection
          vale={valeLocal}
          detalleRenta={detalleRentaLocal}
          viajes={viajes}
          totalViajes={totalViajes}
          onTotalTicketsChange={setTotalTicketsDescarga}
        />

        {/* Viajes desglosados — solo cuando el vale ya está completado */}
        {!canComplete && (
          <SeccionViajesCompletado
            viajes={viajes}
            loading={loadingViajes}
            totalViajes={totalViajes}
          />
        )}

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

        {canComplete && (
          <SeccionCompletarVale
            vale={valeLocal}
            viajes={viajes}
            loadingViajes={loadingViajes}
            registrando={registrando}
            puedeRegistrar={puedeRegistrar}
            totalViajes={totalViajes}
            onRegistrarViaje={registrarViaje}
            esRentaPorDia={esRentaPorDia}
            esRentaPorMedioDia={esRentaPorMedioDia}
            onChangeRentaPorDia={(value) => {
              setEsRentaPorDia(value);
              if (value) setEsRentaPorMedioDia(false);
            }}
            onChangeRentaPorMedioDia={(value) => {
              setEsRentaPorMedioDia(value);
              if (value) setEsRentaPorDia(false);
            }}
            horaFin={horaFin}
            onChangeHoraFin={setHoraFin}
            notasAdicionales={notasAdicionales}
            onChangeNotas={setNotasAdicionales}
            evidenciaProps={evidenciaProps}
            mensajeBloqueo={mensajeBloqueo}
            saving={saving}
            onCompletar={handleCompletar}
            totalTickets={totalTicketsDescarga}
          />
        )}

        {/* Botón cancelar vale — solo RESIDENTE, solo en_proceso */}
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

        {/* Boton reimprimir PDF — solo emitido, solo una vez */}
        {vale?.estado === "emitido" && !loadingReimpresion && (
          <View style={styles.reimprimirContainer}>
            {yaReimprimio ? (
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
            )}
          </View>
        )}
      </KeyboardAvoidingScrollView>

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

      {updatedVale && triggerPDF && (
        <View style={{ position: "absolute", left: -9999 }}>
          <GenerarPDFButton
            valeData={updatedVale}
            tipoVale="renta"
            colorCopia="blanco"
            autoTrigger={true}
            onSuccess={() => {
              setTriggerPDF(false);
              setValeParaImpresion(updatedVale);
              setShowModalImpresion(true);
            }}
          />
        </View>
      )}

      <ModalImprimirTicketRenta
        visible={showModalImpresion}
        valeData={valeParaImpresion}
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

export default ValeDetalleRenta;
