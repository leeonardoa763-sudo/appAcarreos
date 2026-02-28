/**
 * components/acarreos/ValeDetalleMaterial.js
 *
 * Componente para mostrar y completar vales de MATERIAL
 * Extraído de ValeDetalleModal para mejor organización
 *
 * FUNCIONALIDAD:
 * - Muestra detalles del vale de material
 * - TIPO 3 (Tepetate): Confirmar/editar cantidad pedida
 * - OTROS TIPOS: Capturar peso (toneladas) y folio del banco
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
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuth";

import { calcularCostoValeMaterial } from "../../utils/preciosMaterial";
import KeyboardAvoidingScrollView from "../common//KeyboardAvoidingScrollView";

import StatusBadge from "../common/StatusBadge";
import FormDecimalInput from "../forms/FormDecimalInput";
import FormInput from "../forms/FormInput";
import SuccessModal from "../common/SuccessModal";
import PrimaryButton from "../common/PrimaryButton";
import GenerarPDFButton from "../vale/GenerarPDFButton";

import { useCatalogos } from "../../hooks/useCatalogos";
import FormAutocomplete from "../forms/FormAutocomplete";

import useEvidenciaVale from "../../hooks/useEvidenciaVale";
import EvidenciaCaptura from "../vale/EvidenciaCaptura";

const ValeDetalleMaterial = ({ vale, onClose, onRefresh }) => {
  const { userProfile } = useAuth();
  // Estados para OTROS TIPOS
  const { operadores, vehiculos } = useCatalogos(["operadores", "vehiculos"]);
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
  const esMismoDia = fechaCreacion
    ? fechaCreacion.getFullYear() === hoy.getFullYear() &&
      fechaCreacion.getMonth() === hoy.getMonth() &&
      fechaCreacion.getDate() === hoy.getDate()
    : false;

  const canComplete =
    vale?.estado === "en_proceso" &&
    detalleMaterial &&
    esMismoDia &&
    (!tieneDatosPendientes || datosPendientesGuardados);

  // NUEVO: Detectar si es tipo 3
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
      // Estados para otros tipos
      setNotasAdicionales(detalleMaterial.notas_adicionales || "");
      setPesoToneladas(detalleMaterial.peso_ton || null);
      setFolioBanco(
        detalleMaterial.folio_banco ? String(detalleMaterial.folio_banco) : "",
      );

      // ✅ NUEVO: Inicializar cantidad para tipo 3
      setCantidadConfirmada(detalleMaterial.cantidad_pedida_m3 || null);
    }
  }, [vale?.id_vale, detalleMaterial]);
  useEffect(() => {
    return () => {
      isInitialized.current = false;
      lastValeId.current = null;
    };
  }, []);

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

  //  Completar vale TIPO 3 (solo cantidad)
  const handleCompletarValeTipo3 = useCallback(async () => {
    console.log("[DEBUG] userProfile:", userProfile);
    console.log("[DEBUG] userProfile.id_persona:", userProfile?.id_persona);

    if (!canComplete || !esTipo3) return;

    if (!userProfile?.id_persona) {
      Alert.alert(
        "Error",
        "No se pudo obtener la información del usuario. Por favor cierra sesión e inicia sesión nuevamente.",
      );
      return;
    }

    // Validaciones
    if (!cantidadConfirmada || cantidadConfirmada <= 0) {
      Alert.alert("Error", "Por favor ingresa una cantidad válida");
      return;
    }

    try {
      setSavingToneladas(true);

      const detalleId = detalleMaterial?.id_detalle_material;
      if (!detalleId) {
        throw new Error("No se encontró el detalle del vale");
      }

      console.log(
        "[ValeDetalleMaterial] Completando tipo 3 con cantidad:",
        cantidadConfirmada,
      );

      // PASO 1: Obtener tipo de material y sindicato
      const { data: materialData, error: errorMaterial } = await supabase
        .from("material")
        .select("id_tipo_de_material")
        .eq("id_material", detalleMaterial.id_material)
        .single();

      if (errorMaterial || !materialData) {
        throw new Error("No se pudo obtener el tipo de material");
      }

      const { data: vehiculoData, error: errorVehiculo } = await supabase
        .from("vehiculos")
        .select("id_sindicato")
        .eq("id_vehiculo", vale.id_vehiculo)
        .single();

      if (errorVehiculo || !vehiculoData) {
        throw new Error("No se pudo obtener el sindicato del vehículo");
      }

      // PASO 2: Calcular precio con la cantidad confirmada
      console.log("[ValeDetalleMaterial] Calculando precio tipo 3...");
      const costos = await calcularCostoValeMaterial(
        materialData.id_tipo_de_material,
        vehiculoData.id_sindicato,
        detalleMaterial.distancia_km,
        cantidadConfirmada,
      );

      console.log("[ValeDetalleMaterial] Precio calculado:", costos);

      // PASO 3: Actualizar detalle con cantidad confirmada y precios
      console.log("[DEBUG] Intentando actualizar vale_material_detalles:");
      console.log("- detalleId:", detalleId);
      console.log("- vale.id_vale:", vale.id_vale);
      console.log("- userProfile.id_persona:", userProfile?.id_persona);
      const { error: errorUpdate } = await supabase

        .from("vale_material_detalles")
        .update({
          cantidad_pedida_m3: cantidadConfirmada,
          volumen_real_m3: cantidadConfirmada, // Para tipo 3, volumen real = cantidad confirmada
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

      if (errorUpdate) {
        console.error("[ValeDetalleMaterial] Error actualizando:", errorUpdate);
        throw errorUpdate;
      }

      // PASO 4: Actualizar estado del vale a "emitido"
      const { error: errorEstado } = await supabase
        .from("vales")
        .update({
          estado: "emitido",
          id_persona_completador: userProfile.id_persona,
          fecha_completado: new Date().toISOString(),
        })
        .eq("id_vale", vale.id_vale);

      // PASO 5: Consultar vale completo actualizado
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
          persona:id_persona_creador (
            nombre,
            primer_apellido,
            segundo_apellido
          ),
          persona_completador:id_persona_completador (
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
        .eq("id_vale", vale.id_vale)
        .single();

      if (errorConsulta) {
        throw errorConsulta;
      }

      setUpdatedVale(valeConsultado);
      setSuccessData({
        cantidadConfirmada: cantidadConfirmada.toFixed(2),
        tipo: "tipo3",
      });
      setShowSuccessModal(true);
      setTriggerPDF(false);
    } catch (error) {
      console.error("[ValeDetalleMaterial] Error:", error);
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

  // Completar vale OTROS TIPOS (peso + folio) - CÓDIGO EXISTENTE
  const handleCompletarVale = useCallback(async () => {
    if (!canComplete || esTipo3) return; // ✅ Agregar validación para NO ejecutar si es tipo 3

    if (!userProfile?.id_persona) {
      Alert.alert(
        "Error",
        "No se pudo obtener la información del usuario. Por favor cierra sesión e inicia sesión nuevamente.",
      );
      return;
    }

    // Validaciones de campos
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

    // ✅ NUEVA VALIDACIÓN: Verificar que existe peso específico ANTES de completar
    try {
      const { data: pesoEspecificoValidacion, error: errorValidacion } =
        await supabase
          .from("peso_especifico")
          .select("peso_especifico")
          .eq("id_material", detalleMaterial.id_material)
          .eq("id_banco", detalleMaterial.id_banco)
          .maybeSingle();

      if (errorValidacion) {
        console.error(
          "[ValeDetalleMaterial] Error validando peso específico:",
          errorValidacion,
        );
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

      console.log(
        "[ValeDetalleMaterial] Peso específico confirmado:",
        pesoEspecificoValidacion.peso_especifico,
      );
    } catch (error) {
      console.error(
        "[ValeDetalleMaterial] Error inesperado validando peso específico:",
        error,
      );
      Alert.alert("Error", "Ocurrió un error al validar el material");
      return;
    }

    // ✅ Si llegó aquí, el peso específico existe - continuar completado
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
        },
      );

      if (error) {
        // Fallback: método manual
        console.log(
          "[ValeDetalleMaterial] Usando método manual (RPC no disponible)",
        );

        // PASO 1: Obtener peso específico (ahora ya sabemos que existe)
        const { data: pesoEspecificoData, error: errorPeso } = await supabase
          .from("peso_especifico")
          .select("peso_especifico")
          .eq("id_material", detalleMaterial.id_material)
          .eq("id_banco", detalleMaterial.id_banco)
          .single();

        if (errorPeso) {
          console.error(
            "[ValeDetalleMaterial] Error obteniendo peso específico:",
            errorPeso,
          );
          throw new Error("No se encontró el peso específico del material");
        }

        const pesoEspecifico = pesoEspecificoData?.peso_especifico || 1;

        const volumenRealSinRedondear = pesoToneladas / pesoEspecifico;
        const volumenReal = parseFloat(volumenRealSinRedondear.toFixed(2));

        console.log("[ValeDetalleMaterial] Peso específico:", pesoEspecifico);
        console.log(
          "[ValeDetalleMaterial] Volumen real redondeado:",
          volumenReal,
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
            errorMaterial,
          );
          throw new Error("No se pudo obtener el tipo de material");
        }

        // PASO 3: Obtener sindicato del vehículo
        const { data: vehiculoData, error: errorVehiculo } = await supabase
          .from("vehiculos")
          .select("id_sindicato")
          .eq("id_vehiculo", vale.id_vehiculo)
          .single();

        if (errorVehiculo || !vehiculoData) {
          console.error(
            "[ValeDetalleMaterial] Error obteniendo sindicato:",
            errorVehiculo,
          );
          throw new Error("No se pudo obtener el sindicato del vehículo");
        }

        // PASO 4: Calcular precio usando volumen real REDONDEADO
        console.log("[ValeDetalleMaterial] Calculando precio...");
        const costos = await calcularCostoValeMaterial(
          materialData.id_tipo_de_material,
          vehiculoData.id_sindicato,
          detalleMaterial.distancia_km,
          volumenReal,
        );

        console.log("[ValeDetalleMaterial] Precio calculado:", costos);

        // PASO 5: Actualizar vale_material_detalles
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

        if (errorUpdate) {
          console.error(
            "[ValeDetalleMaterial] Error actualizando detalles:",
            errorUpdate,
          );
          throw errorUpdate;
        }

        // Actualizar estado del vale a "emitido"
        const { error: errorEstado } = await supabase
          .from("vales")
          .update({
            estado: "emitido",
            id_persona_completador: userProfile.id_persona,
            fecha_completado: new Date().toISOString(),
          })
          .eq("id_vale", vale.id_vale);

        if (errorEstado) {
          console.error(
            "[ValeDetalleMaterial] Error actualizando estado:",
            errorEstado,
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
          persona:id_persona_creador (
            nombre,
            primer_apellido,
            segundo_apellido
          ),
          persona_completador:id_persona_completador (
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
          .eq("id_vale", vale.id_vale)
          .single();

        if (errorConsulta) {
          console.error(
            "[ValeDetalleMaterial] Error consultando vale:",
            errorConsulta,
          );
          throw errorConsulta;
        }

        setUpdatedVale(valeConsultado);
        setSuccessData({
          pesoToneladas,
          volumenReal: volumenReal.toFixed(2),
          folioBanco: folioLimpio,
          tipo: "normal",
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
    console.log("[ValeDetalleMaterial] Trigger PDF activado");
    setShowSuccessModal(false); // Cerrar modal primero
    setTimeout(() => {
      setTriggerPDF(true);
    }, 100);
  }, [updatedVale]);

  if (!vale || !detalleMaterial) {
    return null;
  }

  // ✅ Componente auxiliar para mostrar información
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
            value={
              detalleMaterial?.sindicatos?.sindicato ||
              vale?.vehiculos?.sindicatos?.sindicato ||
              "N/A"
            }
          />

          {/* ✅ NUEVO: Mostrar quien creó el vale */}
          <InfoRow
            icon="account-plus"
            label="Creado por"
            value={
              vale.persona
                ? `${vale.persona.nombre} ${vale.persona.primer_apellido || ""} ${vale.persona.segundo_apellido || ""}`.trim()
                : "N/A"
            }
          />

          {/* ✅ NUEVO: Mostrar quien completó el vale (solo si está completado) */}
          {vale.estado !== "en_proceso" &&
            vale.estado !== "borrador" &&
            vale.persona_completador && (
              <InfoRow
                icon="account-check"
                label="Completado por"
                value={`${vale.persona_completador.nombre} ${vale.persona_completador.primer_apellido || ""} ${vale.persona_completador.segundo_apellido || ""}`.trim()}
              />
            )}

          {/* ✅ NUEVO: Mostrar fecha de completado (solo si existe) */}
          {vale.fecha_completado && (
            <InfoRow
              icon="calendar-check"
              label="Fecha completado"
              value={formatDate(vale.fecha_completado)}
            />
          )}
        </View>

        {/* Detalles del Material */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Material</Text>

          <InfoRow
            icon="cube-outline"
            label="Material"
            value={detalleMaterial.material?.material || "N/A"}
          />

          {detalleMaterial.requisicion && (
            <InfoRow
              icon="file-document-outline"
              label="Requisición"
              value={detalleMaterial.requisicion}
            />
          )}
          {/* NUEVO: Folio vale físico */}
          {detalleMaterial.folio_vale_fisico && (
            <InfoRow
              icon="file-document-outline"
              label="Vale Físico"
              value={String(detalleMaterial.folio_vale_fisico)}
            />
          )}

          <InfoRow
            icon="bank"
            label="Banco"
            value={detalleMaterial.bancos?.banco || "N/A"}
          />

          <InfoRow
            icon="cube-send"
            label="Capacidad"
            value={`${detalleMaterial.capacidad_m3} m³`}
          />

          <InfoRow
            icon="map-marker-distance"
            label="Distancia"
            value={`${detalleMaterial.distancia_km} km`}
          />

          <InfoRow
            icon="package-variant"
            label="Cantidad Pedida"
            value={`${detalleMaterial.cantidad_pedida_m3} m³`}
          />

          {/* Mostrar datos completados si existen */}
          {vale.estado !== "en_proceso" && (
            <>
              {!esTipo3 && (
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
                </>
              )}

              {esTipo3 && (
                <InfoRow
                  icon="cube"
                  label="Cantidad Final"
                  value={`${
                    detalleMaterial.volumen_real_m3?.toFixed(2) || "N/A"
                  } m³`}
                />
              )}

              <InfoRow
                icon="calendar-check"
                label="Emitido el"
                value={formatDate(vale.fecha_creacion)}
              />
            </>
          )}

          {detalleMaterial.notas_adicionales && (
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
                {detalleMaterial.notas_adicionales}
              </Text>
            </View>
          )}
        </View>

        {/* Precios (solo si está completado Y el usuario NO es checador) */}
        {vale.estado !== "en_proceso" &&
          detalleMaterial.precio_m3 &&
          userProfile?.roles?.role !== "CHECADOR" && (
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
                  value={`$${parseFloat(detalleMaterial.tarifa_primer_km).toFixed(2)} MXN`}
                />
              )}

              {detalleMaterial.tarifa_subsecuente && (
                <InfoRow
                  icon="currency-usd"
                  label="Tarifa Subsecuente"
                  value={`$${parseFloat(detalleMaterial.tarifa_subsecuente).toFixed(2)} MXN/km`}
                />
              )}

              {detalleMaterial.costo_total && (
                <View style={styles.totalContainer}>
                  <InfoRow
                    icon="currency-usd"
                    label="Costo Total"
                    value={`$${parseFloat(detalleMaterial.costo_total).toFixed(2)} MXN`}
                  />
                </View>
              )}
            </View>
          )}

        {/* Datos pendientes: operador y vehículo */}
        {tieneDatosPendientes &&
          !datosPendientesGuardados &&
          vale?.estado === "en_proceso" && (
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

              <TouchableOpacity
                style={[
                  styles.botonGuardarDatos,
                  (!selectedOperador || !selectedVehiculo) &&
                    styles.botonGuardarDatosDisabled,
                ]}
                onPress={handleGuardarDatosPendientes}
                disabled={savingDatos || !selectedOperador || !selectedVehiculo}
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
                <Text style={styles.botonGuardarDatosTexto}>Guardar datos</Text>
              </TouchableOpacity>
            </View>
          )}

        {/* ✅ NUEVO: Formulario para Completar TIPO 3 */}
        {canComplete && esTipo3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirmar Cantidad</Text>
            <Text style={styles.sectionSubtitle}>
              Cantidad pedida actual: {detalleMaterial.cantidad_pedida_m3} m³
            </Text>
            <Text style={styles.helperText}>
              Confirma la cantidad o ingresa una diferente si es necesario
            </Text>

            <FormDecimalInput
              label="Cantidad Final (m³)"
              value={cantidadConfirmada}
              onChange={setCantidadConfirmada}
              min={0.01}
              max={999}
              decimalPlaces={2}
              placeholder="0.00"
              suffix="m³"
              disabled={esChecador}
            />
            <FormInput
              label="Notas Adicionales"
              value={notasAdicionales}
              onChangeText={setNotasAdicionales}
              placeholder="Observaciones del viaje (opcional)"
              multiline
              maxLength={200}
            />

            {esChecador && (
              <Text style={styles.helperText}>
                Solo el residente puede modificar la cantidad final
              </Text>
            )}

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

            <PrimaryButton
              title="Completar Vale"
              onPress={handleCompletarValeTipo3}
              loading={savingToneladas}
              disabled={
                !cantidadConfirmada ||
                cantidadConfirmada <= 0 ||
                !evidenciaLista ||
                (obraTieneCoordenadas && dentroDelRadio === false)
              }
              icon="check-circle"
              backgroundColor={colors.accent}
            />
          </View>
        )}

        {/* Formulario para Completar OTROS TIPOS */}
        {canComplete && !esTipo3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completar Vale</Text>
            <Text style={styles.sectionSubtitle}>
              Captura el peso y la remision del banco para completar el vale
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
              label="Remision del Banco"
              value={folioBanco}
              onChangeText={setFolioBanco}
              placeholder="Ej: 123456789"
              keyboardType="default"
              editable={true}
              maxLength={20}
            />
            <FormInput
              label="Notas Adicionales"
              value={notasAdicionales}
              onChangeText={setNotasAdicionales}
              placeholder="Observaciones del viaje (opcional)"
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

            <PrimaryButton
              title="Completar Vale"
              onPress={handleCompletarVale}
              loading={savingToneladas}
              disabled={
                !pesoToneladas ||
                pesoToneladas <= 0 ||
                !folioBanco ||
                folioBanco.trim() === "" ||
                !evidenciaLista ||
                (obraTieneCoordenadas && dentroDelRadio === false)
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

      {/* ✅ MODIFICADO: Modal de Éxito con mensaje condicional */}
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
              handleCloseSuccess();
            }}
          />
        </View>
      )}
    </View>
  );
};

export default ValeDetalleMaterial;

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
  bloqueadoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  bloqueadoTexto: {
    fontSize: 13,
    color: colors.primary,
    flex: 1,
    lineHeight: 18,
  },
  datosPendientesInline: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
