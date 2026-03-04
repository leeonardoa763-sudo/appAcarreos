/**
 * ValeRentaScreen.js
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  InteractionManager,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { commonStyles } from "../styles";

// Hooks
import { useAuth } from "../hooks/useAuth";
import { useCatalogos } from "../hooks/useCatalogos";
import { useFolioGenerator } from "../hooks/useFolioGenerator";
import { useObras } from "../hooks/useObras";
// Agrega estas dos líneas a los imports locales
import { useValeRentaPDF } from "../hooks/useValeRentaPDF";
import QRCodeGenerator from "../componets/common/QRCodeGenerator";

// Validaciones
import {
  validateOperadorId,
  validateVehiculoId,
  validateCapacidad,
  validateCapacidadVehiculo,
  validateHoraInicioNoFutura,
  validateMaterialId,
  validateSindicatoId,
} from "../utils/validations";

// Componentes
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";
import FormInput from "../componets/forms/FormInput";
import CustomModalPicker from "../componets/forms/CustomModalPicker";
import CustomTimePicker from "../componets/forms/CustomTimePicker";
import DatosOperadorSection from "../componets/vale/DatosOperadorSection";
import SuccessModal from "../componets/common/SuccessModal";
import KeyboardAvoidingScrollView from "../componets/common/KeyboardAvoidingScrollView";
import { usePresupuestoObra } from "../hooks/usePresupuestoObra";
import PresupuestoIndicator from "../componets/common/PresupuestoIndicator";

// Utils
import { generateVerificationUrl } from "../utils/qrGenerator";

const ValeRentaScreen = () => {
  const navigation = useNavigation();
  const { userProfile, userRole } = useAuth();
  const esChecador = userRole === "CHECADOR";
  const isMounted = useRef(true);

  const { obras, loading: loadingObras } = useObras(userProfile?.id_persona);

  const {
    materiales,
    sindicatos,
    preciosRenta,
    operadores,
    vehiculos,
    loading: loadingCatalogos,
  } = useCatalogos([
    "materiales",
    "sindicatos",
    "preciosRenta",
    "operadores",
    "vehiculos",
  ]);

  const { generateFolio } = useFolioGenerator();

  const [formData, setFormData] = useState({
    materialId: null,
    capacidad: "",
    sindicatoId: null,
    horaInicio: null,
    selectedOperador: null,
    selectedVehiculo: null,
    notasAdicionales: "",
  });

  const {
    qrDataUrl,
    compartirPDF,
    handleQRGenerated,
    navegarAcarreos,
    resetPDFState,
    setMounted,
  } = useValeRentaPDF(navigation);
  // Estado del checkbox "completar después"
  const [completarDespues, setCompletarDespues] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [valeCreado, setValeCreado] = useState(null);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [obraDataParaFolio, setObraDataParaFolio] = useState(null);
  const [triggerPDFRojo, setTriggerPDFRojo] = useState(false);
  // Agrega esto justo antes del return
  const sinCapacidad =
    formData.selectedVehiculo && !formData.selectedVehiculo.capacidad_m3;

  const { presupuestoRenta, rentaConsultada } = usePresupuestoObra({
    id_obra: obraSeleccionada,
  });

  const presupuestoAgotado =
    presupuestoRenta?.nivel === "blocked" ||
    presupuestoRenta?.sinConfigurar === true;

  useEffect(() => {
    return () => {
      setMounted(false);
    };
  }, [setMounted]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (obras.length > 0 && !obraSeleccionada) {
      const obraPrincipal = obras.find((o) => o.esPrincipal) || obras[0];
      setObraSeleccionada(obraPrincipal.id);
    }
  }, [obras, obraSeleccionada]);

  useEffect(() => {
    if (obraSeleccionada && obras.length > 0) {
      const obraActual = obras.find((o) => o.id === obraSeleccionada);
      if (obraActual) {
        setObraDataParaFolio({
          id_obra: obraActual.id,
          obra: obraActual.nombre,
          cc: obraActual.cc,
          empresas: {
            id_empresa: obraActual.id_empresa,
            empresa: obraActual.empresa,
            sufijo: obraActual.sufijo,
            logo: obraActual.logo,
          },
        });
      } else {
        setObraDataParaFolio(null);
      }
    } else {
      setObraDataParaFolio(null);
    }
  }, [obraSeleccionada, obras]);

  // Al activar "completar después", limpiar operador y vehículo
  const handleToggleCompletarDespues = () => {
    const nuevoValor = !completarDespues;
    setCompletarDespues(nuevoValor);

    if (nuevoValor) {
      setFormData((prev) => ({
        ...prev,
        selectedOperador: null,
        selectedVehiculo: null,
        capacidad: "",
      }));
      // Limpiar errores de esos campos
      setErrors((prev) => {
        const { operadorId, vehiculoId, ...resto } = prev;
        return resto;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const errorMaterial = validateMaterialId(formData.materialId);
    if (errorMaterial) newErrors.materialId = errorMaterial;

    const errorSindicato = validateSindicatoId(formData.sindicatoId);
    if (errorSindicato) newErrors.sindicatoId = errorSindicato;

    const errorHora = validateHoraInicioNoFutura(formData.horaInicio);
    if (errorHora) newErrors.horaInicio = errorHora;

    // Solo validar operador y vehículo si NO se eligió completar después
    if (!completarDespues) {
      const errorOperador = validateOperadorId(
        formData.selectedOperador?.id_operador,
      );
      if (errorOperador) newErrors.operadorId = errorOperador;

      const errorVehiculo = validateVehiculoId(
        formData.selectedVehiculo?.id_vehiculo,
      );
      if (errorVehiculo) newErrors.vehiculoId = errorVehiculo;

      const errorCapacidadVehiculo = validateCapacidadVehiculo(
        formData.selectedVehiculo,
      );
      if (errorCapacidadVehiculo) newErrors.vehiculoId = errorCapacidadVehiculo;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCrearVale = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos requeridos",
      );
      return;
    }

    if (!obraDataParaFolio) {
      Alert.alert("Error", "No se encontraron datos de la obra");
      return;
    }

    try {
      setSubmitting(true);

      const folio = await generateFolio(obraDataParaFolio);

      const { data: verificacion } = await supabase
        .from("vales")
        .select("folio")
        .eq("folio", folio)
        .maybeSingle();

      if (verificacion) {
        throw new Error(`El folio ${folio} ya existe en la base de datos`);
      }

      const { data: valeData, error: valeError } = await supabase
        .from("vales")
        .insert({
          folio: folio,
          tipo_vale: "renta",
          id_obra: obraDataParaFolio.id_obra,
          id_empresa: obraDataParaFolio.empresas.id_empresa,
          id_persona_creador: userProfile.id_persona,
          // null si se eligió completar después
          id_operador: completarDespues
            ? null
            : formData.selectedOperador.id_operador,
          id_vehiculo: completarDespues
            ? null
            : formData.selectedVehiculo.id_vehiculo,
          estado: "en_proceso",
          qr_verification_url: generateVerificationUrl(folio),
        })
        .select()
        .single();

      if (valeError) throw valeError;

      const precioRenta = preciosRenta.find(
        (p) => p.id_sindicato === formData.sindicatoId,
      );

      if (!precioRenta) {
        throw new Error("No se encontró precio para el sindicato seleccionado");
      }

      const { error: detalleError } = await supabase
        .from("vale_renta_detalle")
        .insert({
          id_vale: valeData.id_vale,
          id_material: formData.materialId,
          id_sindicato: formData.sindicatoId,
          capacidad_m3: parseFloat(formData.capacidad),
          numero_viajes: 1,
          hora_inicio: formData.horaInicio.toISOString(),
          hora_fin: null,
          id_precios_renta: precioRenta.id_precios_renta,
          notas_adicionales: formData.notasAdicionales.trim() || null,
        });

      if (detalleError) throw detalleError;

      if (!isMounted.current) return;

      // Construir objeto con relaciones que necesita el recibo térmico
      const valeParaPDF = {
        ...valeData,
        folio,
        obras: {
          obra: obraDataParaFolio.obra,
          cc: obraDataParaFolio.cc,
          empresas: obraDataParaFolio.empresas,
        },
        operadores: completarDespues
          ? null
          : formData.selectedOperador
            ? { nombre_completo: formData.selectedOperador.nombre_completo }
            : null,
        vehiculos: completarDespues
          ? null
          : formData.selectedVehiculo
            ? {
                placas: formData.selectedVehiculo.placas,
                sindicatos: {
                  sindicato:
                    sindicatos.find(
                      (s) => s.id_sindicato === formData.sindicatoId,
                    )?.sindicato || "Pendiente",
                },
              }
            : null,
        persona: {
          nombre: userProfile.nombre,
          primer_apellido: userProfile.primer_apellido,
          segundo_apellido: userProfile.segundo_apellido,
        },
        vale_renta_detalle: [
          {
            material: {
              material:
                materiales.find((m) => m.id_material === formData.materialId)
                  ?.material || "N/A",
            },
            sindicatos: {
              sindicato:
                sindicatos.find((s) => s.id_sindicato === formData.sindicatoId)
                  ?.sindicato || "Pendiente",
            },
            capacidad_m3: parseFloat(formData.capacidad),
            hora_inicio: formData.horaInicio.toISOString(),
            hora_fin: null,
            es_renta_por_dia: false,
            total_horas: null,
            total_dias: null,
            notas_adicionales: formData.notasAdicionales.trim() || null,
            precios_renta: precioRenta || {},
          },
        ],
      };

      setValeCreado(valeParaPDF);
      setShowSuccessModal(true);
    } catch (error) {
      if (isMounted.current) {
        Alert.alert("Error", `No se pudo crear el vale: ${error.message}`);
      }
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  };

  const handleNavigateToAcarreos = () => {
    if (isMounted.current) {
      setShowSuccessModal(false);
    }

    InteractionManager.runAfterInteractions(() => {
      if (!isMounted.current) return;

      navigation.navigate("ValesMain");

      requestAnimationFrame(() => {
        if (!isMounted.current) return;

        const tabNavigator = navigation.getParent();
        if (tabNavigator && tabNavigator.navigate) {
          tabNavigator.navigate("Acarreos");
        }
      });
    });
  };

  const handleCreateAnother = () => {
    if (isMounted.current) {
      setShowSuccessModal(false);

      InteractionManager.runAfterInteractions(() => {
        if (isMounted.current) {
          navigation.navigate("ValesMain");
        }
      });
    }
  };

  const calcularMaximumDate = () => {
    if (!formData.horaInicio) return new Date(); // Sin fecha seleccionada, bloquear futuro

    const ahora = new Date();
    const fechaSeleccionada = formData.horaInicio;

    const esHoy =
      fechaSeleccionada.getFullYear() === ahora.getFullYear() &&
      fechaSeleccionada.getMonth() === ahora.getMonth() &&
      fechaSeleccionada.getDate() === ahora.getDate();

    if (!esHoy) return null;

    const maximo = new Date(ahora);
    maximo.setMinutes(ahora.getMinutes() + 10);
    return maximo;
  };

  if (loadingObras || loadingCatalogos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  if (!loadingObras && obras.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          No tienes obras asignadas. Contacta al administrador.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {rentaConsultada && (
        <View style={styles.presupuestoFijo}>
          <PresupuestoIndicator
            sinConfigurar={presupuestoRenta?.sinConfigurar}
            label="Renta de equipo"
            disponible={presupuestoRenta?.disponible}
            presupuesto={presupuestoRenta?.presupuestado}
            consumidos={presupuestoRenta?.consumido}
            porcentaje={presupuestoRenta?.porcentaje}
            nivel={presupuestoRenta?.nivel}
            tipo="renta"
            ocultarCantidades={esChecador}
          />
        </View>
      )}

      <KeyboardAvoidingScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECCIÓN: DATOS DE VALE */}
        <View style={styles.section}>
          <SectionHeader
            title="Datos de Vale"
            infoTitle="Datos de Vale"
            infoMessage="Información general del vale de renta. Los campos de obra y empresa se llenan automáticamente según tu perfil."
          />

          <CustomModalPicker
            label="Obra"
            value={obraSeleccionada}
            onValueChange={(value) => setObraSeleccionada(value)}
            items={obras.map((o) => ({
              id: o.id,
              label: o.cc ? `${o.cc} - ${o.nombre}` : o.nombre,
            }))}
            placeholder="Selecciona una obra"
            enabled={obras.length > 0}
            loading={loadingObras}
          />

          <FormInput
            label="Empresa"
            value={
              obraSeleccionada
                ? obras.find((o) => o.id === obraSeleccionada)?.empresa ||
                  "Sin empresa"
                : "Selecciona una obra primero"
            }
            onChangeText={() => {}}
            editable={false}
          />

          <CustomModalPicker
            label="Material"
            value={formData.materialId}
            onValueChange={(value) =>
              setFormData({ ...formData, materialId: value })
            }
            items={materiales.map((m) => ({
              id: m.id_material,
              label: m.material,
            }))}
            placeholder="Selecciona el material movido"
            error={errors.materialId}
          />

          <CustomModalPicker
            label="Sindicato"
            value={formData.sindicatoId}
            onValueChange={(value) =>
              setFormData({ ...formData, sindicatoId: value })
            }
            items={sindicatos.map((s) => ({
              id: s.id_sindicato,
              label: s.sindicato,
            }))}
            placeholder="Selecciona el sindicato"
            error={errors.sindicatoId}
          />

          <CustomTimePicker
            label="Fecha y Hora de Inicio"
            value={formData.horaInicio}
            onChange={(value) =>
              setFormData({ ...formData, horaInicio: value })
            }
            error={errors.horaInicio}
            allowFutureDates={true}
            maximumDate={calcularMaximumDate()}
          />
        </View>

        {/* SECCIÓN: DATOS DE OPERADOR */}
        <View style={styles.section}>
          {/* Checkbox: completar después */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={handleToggleCompletarDespues}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                completarDespues && styles.checkboxActivo,
              ]}
            >
              {completarDespues && (
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color={colors.surface}
                />
              )}
            </View>
            <View style={styles.checkboxTextos}>
              <Text style={styles.checkboxLabel}>
                Completar operador después
              </Text>
              <Text style={styles.checkboxSubtitle}>
                Podrás asignarlo desde la pantalla de Acarreos
              </Text>
            </View>
          </TouchableOpacity>

          <DatosOperadorSection
            selectedOperador={formData.selectedOperador}
            selectedVehiculo={formData.selectedVehiculo}
            onSelectOperador={(operador) =>
              setFormData({ ...formData, selectedOperador: operador })
            }
            onSelectVehiculo={(vehiculo) => {
              setFormData((prev) => ({
                ...prev,
                selectedVehiculo: vehiculo,
                capacidad: vehiculo?.capacidad_m3?.toString() ?? "",
              }));
            }}
            notasAdicionales={formData.notasAdicionales}
            onChangeNotas={(value) =>
              setFormData({ ...formData, notasAdicionales: value })
            }
            errors={errors}
            sindicatoId={formData.sindicatoId}
            operadores={operadores}
            vehiculos={vehiculos}
            disabled={completarDespues}
          />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={
              presupuestoAgotado
                ? "Presupuesto Agotado"
                : sinCapacidad
                  ? "Sin capacidad configurada"
                  : "Crear Vale"
            }
            onPress={handleCrearVale}
            loading={submitting}
            icon={
              presupuestoAgotado
                ? "cancel"
                : sinCapacidad
                  ? "alert-circle"
                  : "check-circle"
            }
            backgroundColor={
              presupuestoAgotado || sinCapacidad
                ? colors.disabled
                : colors.accent
            }
            disabled={presupuestoAgotado || sinCapacidad}
          />
        </View>
      </KeyboardAvoidingScrollView>

      <SuccessModal
        visible={showSuccessModal}
        title="Vale Creado"
        message={`Vale ${valeCreado?.folio} creado exitosamente.\n\n${
          completarDespues
            ? "El operador y vehículo quedaron pendientes. Asígnalos desde Acarreos."
            : 'El vale quedó en "En Proceso". Complétalo desde Acarreos cuando el operador termine.'
        }\n\nGenera la copia roja antes de continuar.`}
        primaryAction={{
          text: "Generar Copia Roja",
          icon: "file-pdf-box",
          onPress: () => {
            setShowSuccessModal(false);
            setTimeout(() => setTriggerPDFRojo(true), 100);
          },
        }}
        onClose={() => {}}
      />

      {/* QR Generator invisible — activa generación de copia roja */}
      {triggerPDFRojo && valeCreado?.qr_verification_url && (
        <View
          style={{
            position: "absolute",
            left: -9999,
            width: 1,
            height: 1,
            opacity: 0,
          }}
        >
          <QRCodeGenerator
            value={valeCreado.qr_verification_url}
            onGenerated={(dataUrl) => {
              console.log(
                "[ValeRentaScreen] QR onGenerated llamado, dataUrl:",
                !!dataUrl,
              );
              if (!dataUrl) {
                console.error("[ValeRentaScreen] dataUrl vacío, abortando");
                setTriggerPDFRojo(false);
                return;
              }
              handleQRGenerated(dataUrl);
              console.log("[ValeRentaScreen] Llamando compartirPDF...");
              compartirPDF(valeCreado, dataUrl)
                .then(() => {
                  console.log(
                    "[ValeRentaScreen] compartirPDF terminó exitosamente",
                  );
                })
                .catch((err) => {
                  console.error(
                    "[ValeRentaScreen] Error en compartirPDF:",
                    err,
                  );
                  Alert.alert(
                    "Error",
                    "No se pudo generar el PDF: " + err.message,
                  );
                })
                .finally(() => {
                  setTriggerPDFRojo(false);
                  resetPDFState();
                });
            }}
            onError={() => {
              Alert.alert("Error", "No se pudo generar el código QR.");
              setTriggerPDFRojo(false);
            }}
            size={200}
          />
        </View>
      )}
    </View>
  );
};

export default ValeRentaScreen;

const styles = {
  ...commonStyles,
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxActivo: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  checkboxTextos: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  checkboxSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
};
