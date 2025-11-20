/**
 * ValeRentaScreen.js
 *
 * VERSIÓN FINAL - SIN TIMEOUTS NI LOGS
 * - ✅ Navegación robusta con InteractionManager
 * - ✅ No depende de delays arbitrarios
 * - ✅ Funciona con o sin logs
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { commonStyles } from "../styles";

// Hooks
import { useAuth } from "../hooks/useAuth";
import { useCatalogos } from "../hooks/useCatalogos";
import { useFolioGenerator } from "../hooks/useFolioGenerator";
import { useObraData } from "../hooks/useObraData";

// Validaciones
import {
  validateOperadorId,
  validateVehiculoId,
  validateCapacidad,
  validateHoraInicio,
  validateMaterialId,
  validateSindicatoId,
} from "../utils/validations";

// Componentes
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";
import FormInput from "../componets/forms/FormInput";
import FormPicker from "../componets/forms/FormPicker";
import FormTimePicker from "../componets/forms/FormTimePicker";
import DatosOperadorSection from "../componets/vale/DatosOperadorSection";
import SuccessModal from "../componets/common/SuccessModal";
import KeyboardAvoidingScrollView from "../componets/common/KeyboardAvoidingScrollView";

// Utils
import { generateVerificationUrl } from "../utils/qrGenerator";

const ValeRentaScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Refs para control
  const isMounted = useRef(true);

  // Hook para obtener datos de la obra del usuario
  const {
    obraData,
    loading: loadingObra,
    error: errorObra,
  } = useObraData(userProfile);

  // Hook para catálogos
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

  // Hook para generar folio
  const generateFolio = useFolioGenerator(obraData);

  // Estados del formulario
  const [formData, setFormData] = useState({
    materialId: null,
    capacidad: "",
    sindicatoId: null,
    horaInicio: null,
    selectedOperador: null,
    selectedVehiculo: null,
    notasAdicionales: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [valeCreado, setValeCreado] = useState(null);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Validaciones
  const validateForm = () => {
    const newErrors = {};

    const errorMaterial = validateMaterialId(formData.materialId);
    if (errorMaterial) newErrors.materialId = errorMaterial;

    const errorCapacidad = validateCapacidad(formData.capacidad);
    if (errorCapacidad) newErrors.capacidad = errorCapacidad;

    const errorSindicato = validateSindicatoId(formData.sindicatoId);
    if (errorSindicato) newErrors.sindicatoId = errorSindicato;

    const errorHora = validateHoraInicio(formData.horaInicio);
    if (errorHora) newErrors.horaInicio = errorHora;

    const errorOperador = validateOperadorId(
      formData.selectedOperador?.id_operador
    );
    if (errorOperador) newErrors.operadorId = errorOperador;

    const errorVehiculo = validateVehiculoId(
      formData.selectedVehiculo?.id_vehiculo
    );
    if (errorVehiculo) newErrors.vehiculoId = errorVehiculo;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear vale
  const handleCrearVale = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos requeridos"
      );
      return;
    }

    if (!obraData) {
      Alert.alert("Error", "No se encontraron datos de la obra");
      return;
    }

    try {
      setSubmitting(true);

      const folio = await generateFolio();

      // Verificar que el folio no exista
      const { data: verificacion } = await supabase
        .from("vales")
        .select("folio")
        .eq("folio", folio)
        .maybeSingle();

      if (verificacion) {
        throw new Error(`El folio ${folio} ya existe en la base de datos`);
      }

      // Crear vale principal
      const { data: valeData, error: valeError } = await supabase
        .from("vales")
        .insert({
          folio: folio,
          tipo_vale: "renta",
          id_obra: obraData.id_obra,
          id_empresa: obraData.empresas.id_empresa,
          id_persona_creador: userProfile.id_persona,
          id_operador: formData.selectedOperador.id_operador,
          id_vehiculo: formData.selectedVehiculo.id_vehiculo,
          estado: "en_proceso",
          qr_verification_url: generateVerificationUrl(folio),
        })
        .select()
        .single();

      if (valeError) throw valeError;

      // Buscar precio de renta
      const precioRenta = preciosRenta.find(
        (p) => p.id_sindicato === formData.sindicatoId
      );

      if (!precioRenta) {
        throw new Error("No se encontró precio para el sindicato seleccionado");
      }

      // Crear detalle del vale
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

      // Verificar si componente sigue montado
      if (!isMounted.current) return;

      setValeCreado(folio);
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

  /**
   * Navegación robusta usando InteractionManager
   * Espera a que todas las interacciones/animaciones terminen
   */
  const handleNavigateToAcarreos = () => {
    // Cerrar modal inmediatamente
    if (isMounted.current) {
      setShowSuccessModal(false);
    }

    // Usar InteractionManager para esperar el momento óptimo
    InteractionManager.runAfterInteractions(() => {
      if (!isMounted.current) return;

      // Volver a ValesMain primero
      navigation.navigate("ValesMain");

      // Dar un frame para que la navegación se procese
      requestAnimationFrame(() => {
        if (!isMounted.current) return;

        // Navegar al tab de Acarreos
        const tabNavigator = navigation.getParent();
        if (tabNavigator && tabNavigator.navigate) {
          tabNavigator.navigate("Acarreos");
        }
      });
    });
  };

  /**
   * Crear otro vale
   */
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

  if (loadingObra || loadingCatalogos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  if (!obraData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          No tienes una obra asignada. Contacta al administrador.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

          <FormInput
            label="Obra"
            value={obraData.obra || "Sin obra"}
            onChangeText={() => {}}
            editable={false}
          />

          <FormInput
            label="Empresa"
            value={obraData.empresas?.empresa || "Sin empresa"}
            onChangeText={() => {}}
            editable={false}
          />

          <FormPicker
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

          <FormInput
            label="Capacidad"
            value={formData.capacidad}
            onChangeText={(value) =>
              setFormData({ ...formData, capacidad: value })
            }
            placeholder="Ej: 8"
            keyboardType="numeric"
            suffix="m³"
            error={errors.capacidad}
          />

          <FormPicker
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

          <FormTimePicker
            label="Hora Inicio"
            value={formData.horaInicio}
            onChange={(value) =>
              setFormData({ ...formData, horaInicio: value })
            }
            error={errors.horaInicio}
          />
        </View>

        {/* SECCIÓN: DATOS DE OPERADOR */}
        <View style={styles.section}>
          <DatosOperadorSection
            selectedOperador={formData.selectedOperador}
            selectedVehiculo={formData.selectedVehiculo}
            onSelectOperador={(operador) =>
              setFormData({ ...formData, selectedOperador: operador })
            }
            onSelectVehiculo={(vehiculo) =>
              setFormData({ ...formData, selectedVehiculo: vehiculo })
            }
            notasAdicionales={formData.notasAdicionales}
            onChangeNotas={(value) =>
              setFormData({ ...formData, notasAdicionales: value })
            }
            errors={errors}
            sindicatoId={formData.sindicatoId}
            operadores={operadores}
            vehiculos={vehiculos}
          />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Crear Vale"
            onPress={handleCrearVale}
            loading={submitting}
            icon="check-circle"
            backgroundColor={colors.accent}
          />
        </View>
      </KeyboardAvoidingScrollView>

      {/* Modal de éxito */}
      <SuccessModal
        visible={showSuccessModal}
        title="Vale Creado"
        message={`Vale ${valeCreado} creado exitosamente.\n\nEl vale quedó en estado "En Proceso". Podrás completarlo desde la pantalla de Acarreos cuando el operador termine el trabajo.`}
        primaryAction={{
          text: "Ver Acarreos",
          icon: "clipboard-list",
          onPress: handleNavigateToAcarreos,
        }}
        secondaryAction={{
          text: "Crear Otro Vale",
          onPress: handleCreateAnother,
        }}
        onClose={handleCreateAnother}
      />
    </View>
  );
};

export default ValeRentaScreen;

const styles = commonStyles;
