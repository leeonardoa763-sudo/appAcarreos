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
import { colors } from "../config/colors.js";
import { supabase } from "../config/supabase.js";
import { useAuth } from "../hooks/useAuth.js";

// Componentes
import SectionHeader from "../componets/common/SectionHeader.js";
import PrimaryButton from "../componets/common/PrimaryButton.js";
import FormInput from "../componets/forms/FormInput.js";
import FormPicker from "../componets/forms/FormPicker.js";
import FormTimePicker from "../componets/forms/FormTimePicker.js";

const ValeRentaScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Estados del formulario
  const [formData, setFormData] = useState({
    obra: userProfile?.obras?.obra || "",
    empresa: userProfile?.obras?.empresas?.empresa || "",
    materialId: null,
    capacidad: "",
    sindicatoId: null,
    horaInicio: null,
    operadorNombre: "",
    operadorPlacas: "",
    notasAdicionales: "",
  });

  // Estados de datos de BD
  const [materiales, setMateriales] = useState([]);
  const [sindicatos, setSindicatos] = useState([]);
  const [preciosRenta, setPreciosRenta] = useState([]);

  // Estados de carga
  const [loadingMateriales, setLoadingMateriales] = useState(true);
  const [loadingSindicatos, setLoadingSindicatos] = useState(true);
  const [loadingPrecios, setLoadingPrecios] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados de validación
  const [errors, setErrors] = useState({});

  // ==========================================
  // CARGAR DATOS DE SUPABASE
  // ==========================================

  // Cargar materiales
  useEffect(() => {
    const fetchMateriales = async () => {
      try {
        setLoadingMateriales(true);
        const { data, error } = await supabase
          .from("material")
          .select("id_material, material")
          .order("material");

        if (error) throw error;
        setMateriales(data || []);
      } catch (error) {
        console.error("Error cargando materiales:", error);
        Alert.alert("Error", "No se pudieron cargar los materiales");
      } finally {
        setLoadingMateriales(false);
      }
    };

    fetchMateriales();
  }, []);

  // Cargar sindicatos
  useEffect(() => {
    const fetchSindicatos = async () => {
      try {
        setLoadingSindicatos(true);
        const { data, error } = await supabase
          .from("sindicatos")
          .select("id_sindicato, sindicato")
          .order("sindicato");

        if (error) throw error;
        setSindicatos(data || []);
      } catch (error) {
        console.error("Error cargando sindicatos:", error);
        Alert.alert("Error", "No se pudieron cargar los sindicatos");
      } finally {
        setLoadingSindicatos(false);
      }
    };

    fetchSindicatos();
  }, []);

  // Cargar precios de renta
  useEffect(() => {
    const fetchPrecios = async () => {
      try {
        setLoadingPrecios(true);
        const { data, error } = await supabase
          .from("precios_renta")
          .select("*");

        if (error) throw error;
        setPreciosRenta(data || []);
      } catch (error) {
        console.error("Error cargando precios:", error);
      } finally {
        setLoadingPrecios(false);
      }
    };

    fetchPrecios();
  }, []);

  // ==========================================
  // VALIDACIONES
  // ==========================================

  const validateForm = () => {
    const newErrors = {};

    // Material requerido
    if (!formData.materialId) {
      newErrors.materialId = "Debes seleccionar un material";
    }

    // Capacidad requerida y mayor a 0
    if (!formData.capacidad) {
      newErrors.capacidad = "La capacidad es requerida";
    } else if (parseFloat(formData.capacidad) <= 0) {
      newErrors.capacidad = "La capacidad debe ser mayor a 0";
    }

    // Sindicato requerido
    if (!formData.sindicatoId) {
      newErrors.sindicatoId = "Debes seleccionar un sindicato";
    }

    // Hora inicio requerida
    if (!formData.horaInicio) {
      newErrors.horaInicio = "La hora de inicio es requerida";
    }

    // Nombre operador requerido
    if (!formData.operadorNombre.trim()) {
      newErrors.operadorNombre = "El nombre del operador es requerido";
    }

    // Placas requeridas
    if (!formData.operadorPlacas.trim()) {
      newErrors.operadorPlacas = "Las placas del vehículo son requeridas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================================
  // GENERAR FOLIO ÚNICO
  // ==========================================

  const generateFolio = () => {
    const now = new Date();
    const year = now.getFullYear();
    const timestamp = now.getTime();
    return `RENT-${year}-${timestamp}`;
  };

  // ==========================================
  // CREAR VALE
  // ==========================================

  const handleCrearVale = async () => {
    // Validar formulario
    if (!validateForm()) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos requeridos"
      );
      return;
    }

    try {
      setSubmitting(true);

      // 1. Crear el vale (cabecera)
      const folio = generateFolio();

      const { data: valeData, error: valeError } = await supabase
        .from("vales")
        .insert({
          folio: folio,
          tipo_vale: "renta",
          id_obra: userProfile.id_current_obra,
          id_empresa: userProfile.obras.id_empresa,
          id_persona_creador: userProfile.id_persona,
          operador_nombre: formData.operadorNombre.trim(),
          placas_vehiculo: formData.operadorPlacas.trim().toUpperCase(),
          estado: "en_proceso",
        })
        .select()
        .single();

      if (valeError) throw valeError;

      console.log("Vale creado:", valeData);

      // 2. Obtener el precio de renta según el sindicato
      const precioRenta = preciosRenta.find(
        (p) => p.id_sindicato === formData.sindicatoId
      );

      if (!precioRenta) {
        throw new Error("No se encontró precio para el sindicato seleccionado");
      }

      // 3. Crear el detalle del vale de renta
      const { error: detalleError } = await supabase
        .from("vale_renta_detalle")
        .insert({
          id_vale: valeData.id_vale,
          id_material: formData.materialId,
          id_sindicato: formData.sindicatoId,
          capacidad_m3: parseFloat(formData.capacidad),
          numero_viajes: 1,
          hora_inicio: formData.horaInicio.toISOString(),
          hora_fin: null, // Se llenará al completar el vale
          id_precios_renta: precioRenta.id_precios_renta,
          notas_adicionales: formData.notasAdicionales.trim() || null,
        });

      if (detalleError) throw detalleError;

      // Éxito
      Alert.alert(
        "Vale Creado",
        `Vale ${folio} creado exitosamente.\n\nEl vale quedó en estado "En Proceso". Podrás completarlo desde la pantalla de Acarreos cuando el operador termine el trabajo.`,
        [
          {
            text: "Ver Acarreos",
            onPress: () => navigation.navigate("Acarreos"),
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

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      obra: userProfile?.obras?.obra || "",
      empresa: userProfile?.obras?.empresas?.empresa || "",
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

  // ==========================================
  // LOADING INICIAL
  // ==========================================

  if (loadingMateriales || loadingSindicatos || loadingPrecios) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <View style={styles.container}>
      {/* Header */}
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

          {/* Obra (pre-llenada, deshabilitada) */}
          <FormInput
            label="Obra"
            value={formData.obra}
            onChangeText={() => {}}
            editable={false}
          />

          {/* Empresa (pre-llenada, deshabilitada) */}
          <FormInput
            label="Empresa"
            value={formData.empresa}
            onChangeText={() => {}}
            editable={false}
          />

          {/* Material (desplegable) */}
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

          {/* Capacidad (número con sufijo m³) */}
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

          {/* Sindicato (desplegable) */}
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

          {/* Hora Inicio */}
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
          <SectionHeader
            title="Datos de Operador"
            infoTitle="Datos de Operador"
            infoMessage="Información del operador que realizará el trabajo. El operador pertenece a otra empresa externa."
          />

          {/* Nombre del Operador */}
          <FormInput
            label="Nombre"
            value={formData.operadorNombre}
            onChangeText={(value) =>
              setFormData({ ...formData, operadorNombre: value })
            }
            placeholder="Ej: Juan Pérez"
            error={errors.operadorNombre}
          />

          {/* Placas del Vehículo */}
          <FormInput
            label="Placas"
            value={formData.operadorPlacas}
            onChangeText={(value) =>
              setFormData({ ...formData, operadorPlacas: value.toUpperCase() })
            }
            placeholder="Ej: ABC-123-4"
            error={errors.operadorPlacas}
          />

          {/* Notas Adicionales (opcional) */}
          <FormInput
            label="Notas Adicionales (Opcional)"
            value={formData.notasAdicionales}
            onChangeText={(value) =>
              setFormData({ ...formData, notasAdicionales: value })
            }
            placeholder="Observaciones adicionales..."
            multiline={true}
            numberOfLines={3}
          />
        </View>

        {/* Botón Crear Vale */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonContainer: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
