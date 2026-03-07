/**
 * components/acarreos/ValeDetalleMaterial.js
 *
 * Componente principal orquestador para vales de MATERIAL.
 * Contiene toda la lógica y delega el render a subcomponentes.
 *
 * SUBCOMPONENTES (helpersMaterial/):
 * - ValeInfoGeneral        → Sección info general
 * - ValeInfoDetalles       → Sección detalles material + precios
 * - ValeDatosPendientes    → Formulario operador/vehículo
 * - ValeFormCompletarTipo3 → Formulario completar tipo 3
 * - ValeFormCompletarNormal→ Formulario completar normal
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuth";

import { calcularCostoValeMaterial } from "../../utils/preciosMaterial";
import KeyboardAvoidingScrollView from "../common/KeyboardAvoidingScrollView";

import StatusBadge from "../common/StatusBadge";
import SuccessModal from "../common/SuccessModal";
import GenerarPDFButton from "../vale/GenerarPDFButton";

import { useCatalogos } from "../../hooks/useCatalogos";
import useEvidenciaVale from "../../hooks/useEvidenciaVale";

import { useCancelarVale } from "../../hooks/useCancelarVale";
import ModalCancelarVale from "../common/ModalCancelarVale";

import styles from "./helpersMaterial/valeDetalleMaterialStyles";
import ValeInfoGeneral from "./helpersMaterial/ValeInfoGeneral";
import ValeInfoDetalles from "./helpersMaterial/ValeInfoDetalles";
import ValeDatosPendientes from "./helpersMaterial/ValeDatosPendientes";
import ValeFormCompletarTipo3 from "./helpersMaterial/ValeFormCompletarTipo3";
import ValeFormCompletarNormal from "./helpersMaterial/ValeFormCompletarNormal";

const ValeDetalleMaterial = ({ vale, onClose, onRefresh }) => {
  const { userProfile } = useAuth();
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
  // TEMPORAL - borrar después del diagnóstico

  const { operadores, vehiculos } = useCatalogos(["operadores", "vehiculos"]);

  // Estados para OTROS TIPOS
  const [pesoToneladas, setPesoToneladas] = useState(null);
  const [folioBanco, setFolioBanco] = useState("");

  // Estados para TIPO 3
  const [cantidadConfirmada, setCantidadConfirmada] = useState(null);

  const esChecador = userProfile?.roles?.role === "CHECADOR";
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

  // Estados comunes
  const [savingToneladas, setSavingToneladas] = useState(false);
  const [selectedOperador, setSelectedOperador] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [savingDatos, setSavingDatos] = useState(false);
  const [datosPendientesGuardados, setDatosPendientesGuardados] =
    useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [updatedVale, setUpdatedVale] = useState(null);
  const [triggerPDF, setTriggerPDF] = useState(false);

  const isInitialized = useRef(false);
  const lastValeId = useRef(null);

  const detalleMaterial = vale?.vale_material_detalles?.[0];
  const tieneDatosPendientes = !vale?.id_operador || !vale?.id_vehiculo;

  const sindicatoId = detalleMaterial?.id_sindicato;
  const operadoresFiltrados = operadores.filter(
    (op) => !sindicatoId || op.id_sindicato === sindicatoId,
  );
  const vehiculosFiltrados = vehiculos.filter(
    (v) => !sindicatoId || v.id_sindicato === sindicatoId,
  );

  const hoy = new Date();
  const fechaCreacion = vale?.fecha_creacion
    ? new Date(vale.fecha_creacion)
    : null;
  const diferenciaDias = fechaCreacion
    ? Math.floor((hoy - fechaCreacion) / (1000 * 60 * 60 * 24))
    : null;
  const esMismoDia = diferenciaDias !== null && diferenciaDias <= 1;

  const canComplete =
    vale?.estado === "en_proceso" &&
    detalleMaterial &&
    esMismoDia &&
    (!tieneDatosPendientes || datosPendientesGuardados);

  const esTipo3 = detalleMaterial?.material?.id_tipo_de_material === 3;

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
      setNotasAdicionales(detalleMaterial.notas_adicionales || "");
      setPesoToneladas(detalleMaterial.peso_ton || null);
      setFolioBanco(
        detalleMaterial.folio_banco ? String(detalleMaterial.folio_banco) : "",
      );
      setCantidadConfirmada(detalleMaterial.cantidad_pedida_m3 || null);
    }
  }, [vale?.id_vale, detalleMaterial]);

  useEffect(() => {
    return () => {
      isInitialized.current = false;
      lastValeId.current = null;
    };
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const handleCompletarValeTipo3 = useCallback(async () => {
    if (!canComplete || !esTipo3) return;

    if (!userProfile?.id_persona) {
      Alert.alert(
        "Error",
        "No se pudo obtener la información del usuario. Por favor cierra sesión e inicia sesión nuevamente.",
      );
      return;
    }

    if (!cantidadConfirmada || cantidadConfirmada <= 0) {
      Alert.alert("Error", "Por favor ingresa una cantidad válida");
      return;
    }

    try {
      setSavingToneladas(true);

      const detalleId = detalleMaterial?.id_detalle_material;
      if (!detalleId) throw new Error("No se encontró el detalle del vale");

      const { data: materialData, error: errorMaterial } = await supabase
        .from("material")
        .select("id_tipo_de_material")
        .eq("id_material", detalleMaterial.id_material)
        .single();

      if (errorMaterial || !materialData)
        throw new Error("No se pudo obtener el tipo de material");

      const { data: vehiculoData, error: errorVehiculo } = await supabase
        .from("vehiculos")
        .select("id_sindicato")
        .eq("id_vehiculo", vale.id_vehiculo)
        .single();

      if (errorVehiculo || !vehiculoData)
        throw new Error("No se pudo obtener el sindicato del vehículo");

      const costos = await calcularCostoValeMaterial(
        materialData.id_tipo_de_material,
        vehiculoData.id_sindicato,
        detalleMaterial.distancia_km,
        cantidadConfirmada,
      );

      const { error: errorUpdate } = await supabase
        .from("vale_material_detalles")
        .update({
          cantidad_pedida_m3: cantidadConfirmada,
          volumen_real_m3: cantidadConfirmada,
          precio_m3: costos.precioM3,
          costo_total: costos.costoTotal,
          id_precios_material: costos.idPreciosMaterial,
          tarifa_primer_km: costos.tarifaPrimerKm,
          tarifa_subsecuente: costos.tarifaSubsecuente,
          notas_adicionales: notasAdicionales.trim() || null,
          foto_evidencia_url: fotoUrl,
          latitud_completado: ubicacion?.latitud ?? null,
          longitud_completado: ubicacion?.longitud ?? null,
          distancia_obra_metros: distanciaObra ?? null,
        })
        .eq("id_detalle_material", detalleId);

      if (errorUpdate) throw errorUpdate;

      const { error: errorEstado } = await supabase
        .from("vales")
        .update({
          estado: "emitido",
          id_persona_completador: userProfile.id_persona,
          fecha_completado: new Date().toISOString(),
        })
        .eq("id_vale", vale.id_vale);

      if (errorEstado) throw errorEstado;

      const { data: valeConsultado, error: errorConsulta } = await supabase
        .from("vales")
        .select(
          `
          *,
          obras:id_obra (
            id_obra, obra, cc,
            empresas:id_empresa ( id_empresa, empresa, sufijo, logo )
          ),
          persona:id_persona_creador ( nombre, primer_apellido, segundo_apellido ),
          persona_completador:id_persona_completador ( nombre, primer_apellido, segundo_apellido ),
          operadores:id_operador ( nombre_completo ),
          vehiculos:id_vehiculo (
            placas,
            sindicatos:id_sindicato ( sindicato )
          ),
          vale_material_detalles (
            *,
            material:id_material ( id_material, material, id_tipo_de_material ),
            bancos:id_banco ( id_banco, banco ),
            sindicatos:id_sindicato ( sindicato )
          )
        `,
        )
        .eq("id_vale", vale.id_vale)
        .single();

      if (errorConsulta) throw errorConsulta;

      setUpdatedVale(valeConsultado);
      setSuccessData({
        cantidadConfirmada: cantidadConfirmada.toFixed(2),
        tipo: "tipo3",
      });
      setShowSuccessModal(true);
      setTriggerPDF(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo completar el vale. Intenta de nuevo.");
    } finally {
      setSavingToneladas(false);
    }
  }, [
    canComplete,
    esTipo3,
    cantidadConfirmada,
    detalleMaterial,
    vale?.id_vale,
    userProfile,
    notasAdicionales,
    fotoUrl,
    ubicacion,
    distanciaObra,
  ]);

  const handleCompletarVale = useCallback(async () => {
    if (!canComplete || esTipo3) return;

    if (!userProfile?.id_persona) {
      Alert.alert(
        "Error",
        "No se pudo obtener la información del usuario. Por favor cierra sesión e inicia sesión nuevamente.",
      );
      return;
    }

    if (!pesoToneladas || pesoToneladas <= 0) {
      Alert.alert("Error", "Por favor ingresa un peso válido");
      return;
    }

    if (!folioBanco || folioBanco.trim() === "") {
      Alert.alert("Error", "Por favor ingresa el folio del banco");
      return;
    }

    const folioLimpio = folioBanco.trim();
    if (!/^[0-9-]+$/.test(folioLimpio)) {
      Alert.alert("Error", "El folio solo puede contener números y guiones");
      return;
    }

    try {
      const { data: pesoEspecificoValidacion, error: errorValidacion } =
        await supabase
          .from("peso_especifico")
          .select("peso_especifico")
          .eq("id_material", detalleMaterial.id_material)
          .eq("id_banco", detalleMaterial.id_banco)
          .maybeSingle();

      if (errorValidacion) {
        Alert.alert(
          "Error",
          "No se pudo verificar el peso específico del material",
        );
        return;
      }

      if (!pesoEspecificoValidacion) {
        Alert.alert(
          "Material sin peso específico",
          "El material de este vale no tiene configurado un peso específico para el banco seleccionado. Por favor, contacte al administrador para que lo configure antes de completar el vale.",
          [{ text: "Entendido" }],
        );
        return;
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al validar el material");
      return;
    }

    try {
      setSavingToneladas(true);

      const detalleId = detalleMaterial?.id_detalle_material;
      if (!detalleId) throw new Error("No se encontró el detalle del vale");

      const { data: valeActualizado, error } = await supabase.rpc(
        "completar_vale_material",
        {
          p_id_vale: vale.id_vale,
          p_id_detalle: detalleId,
          p_peso_ton: pesoToneladas,
          p_folio_banco: folioLimpio,
          p_id_material: detalleMaterial.id_material,
          p_id_banco: detalleMaterial.id_banco,
        },
      );

      if (error) {
        const { data: pesoEspecificoData, error: errorPeso } = await supabase
          .from("peso_especifico")
          .select("peso_especifico")
          .eq("id_material", detalleMaterial.id_material)
          .eq("id_banco", detalleMaterial.id_banco)
          .single();

        if (errorPeso)
          throw new Error("No se encontró el peso específico del material");

        const pesoEspecifico = pesoEspecificoData?.peso_especifico || 1;
        const volumenReal = parseFloat(
          (pesoToneladas / pesoEspecifico).toFixed(2),
        );

        const { data: materialData, error: errorMaterial } = await supabase
          .from("material")
          .select("id_tipo_de_material")
          .eq("id_material", detalleMaterial.id_material)
          .single();

        if (errorMaterial || !materialData)
          throw new Error("No se pudo obtener el tipo de material");

        const { data: vehiculoData, error: errorVehiculo } = await supabase
          .from("vehiculos")
          .select("id_sindicato")
          .eq("id_vehiculo", vale.id_vehiculo)
          .single();

        if (errorVehiculo || !vehiculoData)
          throw new Error("No se pudo obtener el sindicato del vehículo");

        const costos = await calcularCostoValeMaterial(
          materialData.id_tipo_de_material,
          vehiculoData.id_sindicato,
          detalleMaterial.distancia_km,
          volumenReal,
        );

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
            notas_adicionales: notasAdicionales.trim() || null,
            foto_evidencia_url: fotoUrl,
            latitud_completado: ubicacion?.latitud ?? null,
            longitud_completado: ubicacion?.longitud ?? null,
            distancia_obra_metros: distanciaObra ?? null,
          })
          .eq("id_detalle_material", detalleId);

        if (errorUpdate) throw errorUpdate;

        const { error: errorEstado } = await supabase
          .from("vales")
          .update({
            estado: "emitido",
            id_persona_completador: userProfile.id_persona,
            fecha_completado: new Date().toISOString(),
          })
          .eq("id_vale", vale.id_vale);

        if (errorEstado) throw errorEstado;

        const { data: valeConsultado, error: errorConsulta } = await supabase
          .from("vales")
          .select(
            `
            *,
            obras:id_obra (
              id_obra, obra, cc,
              empresas:id_empresa ( id_empresa, empresa, sufijo, logo )
            ),
            persona:id_persona_creador ( nombre, primer_apellido, segundo_apellido ),
            persona_completador:id_persona_completador ( nombre, primer_apellido, segundo_apellido ),
            operadores:id_operador ( nombre_completo ),
            vehiculos:id_vehiculo (
              placas,
              sindicatos:id_sindicato ( sindicato )
            ),
            vale_material_detalles (
              *,
              material:id_material ( id_material, material, id_tipo_de_material ),
              bancos:id_banco ( id_banco, banco ),
              sindicatos:id_sindicato ( sindicato )
            )
          `,
          )
          .eq("id_vale", vale.id_vale)
          .single();

        if (errorConsulta) throw errorConsulta;

        setUpdatedVale(valeConsultado);
        setSuccessData({
          pesoToneladas,
          volumenReal: volumenReal.toFixed(2),
          folioBanco: folioLimpio,
          tipo: "normal",
        });
      } else {
        setUpdatedVale(valeActualizado);
        const detalleActualizado = valeActualizado?.vale_material_detalles?.[0];
        setSuccessData({
          pesoToneladas,
          volumenReal:
            detalleActualizado?.volumen_real_m3?.toFixed(2) || "0.00",
          folioBanco: folioLimpio,
          tipo: "normal",
        });
      }

      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo completar el vale. Intenta de nuevo.");
    } finally {
      setSavingToneladas(false);
    }
  }, [
    canComplete,
    esTipo3,
    pesoToneladas,
    folioBanco,
    detalleMaterial,
    vale?.id_vale,
    userProfile,
    notasAdicionales,
    fotoUrl,
    ubicacion,
    distanciaObra,
  ]);

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

      setDatosPendientesGuardados(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSavingDatos(false);
    }
  }, [selectedOperador, selectedVehiculo, vale.id_vale]);

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

  if (!vale || !detalleMaterial) return null;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.folio}>{vale.folio}</Text>
          <StatusBadge estado={vale.estado} />
        </View>

        {/* Mensaje de bloqueo por fecha */}
        {vale?.estado === "en_proceso" && !esMismoDia && (
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

        <ValeInfoGeneral
          vale={vale}
          detalleMaterial={detalleMaterial}
          formatDate={formatDate}
          userProfile={userProfile}
        />

        <ValeInfoDetalles
          vale={vale}
          detalleMaterial={detalleMaterial}
          esTipo3={esTipo3}
          formatDate={formatDate}
          userProfile={userProfile}
        />

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

        {canComplete && esTipo3 && (
          <ValeFormCompletarTipo3
            detalleMaterial={detalleMaterial}
            cantidadConfirmada={cantidadConfirmada}
            setCantidadConfirmada={setCantidadConfirmada}
            notasAdicionales={notasAdicionales}
            setNotasAdicionales={setNotasAdicionales}
            esChecador={esChecador}
            savingToneladas={savingToneladas}
            onCompletar={handleCompletarValeTipo3}
            evidenciaLista={evidenciaLista}
            obraTieneCoordenadas={obraTieneCoordenadas}
            dentroDelRadio={dentroDelRadio}
            foto={foto}
            fotoUrl={fotoUrl}
            ubicacion={ubicacion}
            distanciaObra={distanciaObra}
            radioConfigurado={radioConfigurado}
            loadingFoto={loadingFoto}
            loadingUbicacion={loadingUbicacion}
            errorFoto={errorFoto}
            errorUbicacion={errorUbicacion}
            onTomarFoto={tomarFoto}
            onCapturarUbicacion={capturarUbicacion}
            folioVale={vale?.folio}
          />
        )}

        {canComplete && !esTipo3 && (
          <ValeFormCompletarNormal
            pesoToneladas={pesoToneladas}
            setPesoToneladas={setPesoToneladas}
            folioBanco={folioBanco}
            setFolioBanco={setFolioBanco}
            notasAdicionales={notasAdicionales}
            setNotasAdicionales={setNotasAdicionales}
            savingToneladas={savingToneladas}
            onCompletar={handleCompletarVale}
            evidenciaLista={evidenciaLista}
            obraTieneCoordenadas={obraTieneCoordenadas}
            dentroDelRadio={dentroDelRadio}
            foto={foto}
            fotoUrl={fotoUrl}
            ubicacion={ubicacion}
            distanciaObra={distanciaObra}
            radioConfigurado={radioConfigurado}
            loadingFoto={loadingFoto}
            loadingUbicacion={loadingUbicacion}
            errorFoto={errorFoto}
            errorUbicacion={errorUbicacion}
            onTomarFoto={tomarFoto}
            onCapturarUbicacion={capturarUbicacion}
            folioVale={vale?.folio}
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

      <SuccessModal
        visible={showSuccessModal}
        title="Vale Completado"
        message={
          successData?.tipo === "tipo3"
            ? `Cantidad confirmada: ${successData?.cantidadConfirmada} m³\n\n¿Deseas generar el PDF ahora?`
            : `Peso: ${successData?.pesoToneladas} ton\nVolumen Real: ${successData?.volumenReal} m³\nFolio Banco: ${successData?.folioBanco}\n\n¿Deseas generar el PDF ahora?`
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
            tipoVale="material"
            colorCopia="blanca"
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

export default ValeDetalleMaterial;
