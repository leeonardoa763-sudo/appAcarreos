/**
 * ValeRentaScreen.js
 *
 * Pantalla para crear un vale de renta
 *
 * PROPÓSITO:
 * - Capturar datos iniciales del vale de renta
 * - Pre-llenar obra y empresa del residente
 * - Validar campos antes de guardar
 * - Crear registro en BD con estado 'en_proceso'
 *
 * FLUJO:
 * 1. Usuario llena formulario (hora_fin queda NULL)
 * 2. Se guarda en BD con estado 'en_proceso'
 * 3. Usuario completa el vale desde pantalla Acarreos
 *
 * NAVEGACIÓN:
 * ValesScreen → SeleccionarTipoValeScreen → ValeRentaScreen
 */
/**
 * ValeRentaScreen.js (REFACTORIZADO)
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { commonStyles } from "../styles";
//Hooks
import { useAuth } from "../hooks/useAuth";
import { useCatalogos } from "../hooks/useCatalogos";
import { useFolioGenerator } from "../hooks/useFolioGenerator";
import { useObraData } from "../hooks/useObraData";
//Validaciones
import {
  validateOperadorNombre,
  validatePlacas,
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

//Utils
import { generateVerificationUrl } from "../utils/qrGenerator";

const ValeRentaScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

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
    loading: loadingCatalogos,
  } = useCatalogos(["materiales", "sindicatos", "preciosRenta"]);

  // Hook para generar folio
  const generateFolio = useFolioGenerator(obraData);

  // Estados del formulario
  const [formData, setFormData] = useState({
    materialId: null,
    capacidad: "",
    sindicatoId: null,
    horaInicio: null,
    operadorNombre: "",
    operadorPlacas: "",
    notasAdicionales: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar datos de obra

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      console.log("Saliendo de ValeRentaScreen, reseteando formulario");
      resetForm();
    });

    return unsubscribe;
  }, [navigation]);

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

    const errorNombre = validateOperadorNombre(formData.operadorNombre);
    if (errorNombre) newErrors.operadorNombre = errorNombre;

    const errorPlacas = validatePlacas(formData.operadorPlacas);
    if (errorPlacas) newErrors.operadorPlacas = errorPlacas;

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
      console.log("--------------------------");
      console.log("Iniciando creación de vale");

      const folio = await generateFolio();

      console.log("Intentando crear vale con folio:", folio);

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
          id_obra: obraData.id_obra,
          id_empresa: obraData.empresas.id_empresa,
          id_persona_creador: userProfile.id_persona,
          operador_nombre: formData.operadorNombre.trim(),
          placas_vehiculo: formData.operadorPlacas.trim().toUpperCase(),
          estado: "en_proceso",
          qr_verification_url: generateVerificationUrl(folio),
        })
        .select()
        .single();

      if (valeError) throw valeError;

      console.log("Vale creado exitosamente");

      const precioRenta = preciosRenta.find(
        (p) => p.id_sindicato === formData.sindicatoId
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

      console.log("Detalle de vale creado exitosamente");

      resetForm();

      Alert.alert(
        "Vale Creado",
        `Vale ${folio} creado exitosamente.\n\nEl vale quedó en estado "En Proceso". Podrás completarlo desde la pantalla de Acarreos cuando el operador termine el trabajo.`,
        [
          {
            text: "Ver Acarreos",
            onPress: () => {
              // Resetear el formulario primero
              resetForm();

              // Navegar a Acarreos y resetear el stack de Vales
              navigation.reset({
                index: 0,
                routes: [{ name: "ValesMain" }],
              });

              // Cambiar al tab de Acarreos
              navigation.getParent()?.navigate("Acarreos");
            },
          },
          {
            text: "Crear Otro",
            onPress: () => resetForm(),
          },
        ]
      );
    } catch (error) {
      console.error("Error creando vale:", error);
      Alert.alert("Error", `No se pudo crear el vale: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      materialId: null,
      capacidad: "",
      sindicatoId: null,
      horaInicio: null,
      operadorNombre: "",
      operadorPlacas: "",
      notasAdicionales: "",
    });
    setErrors({});
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Renta</Text>
      </View>

      <ScrollView
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
            operadorNombre={formData.operadorNombre}
            operadorPlacas={formData.operadorPlacas}
            notasAdicionales={formData.notasAdicionales}
            onChangeNombre={(value) =>
              setFormData({ ...formData, operadorNombre: value })
            }
            onChangePlacas={(value) =>
              setFormData({ ...formData, operadorPlacas: value.toUpperCase() })
            }
            onChangeNotas={(value) =>
              setFormData({ ...formData, notasAdicionales: value })
            }
            errors={errors}
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
      </ScrollView>
    </View>
  );
};

export default ValeRentaScreen;

const styles = commonStyles;
