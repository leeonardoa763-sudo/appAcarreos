/**
 * ValeMaterialScreen.js
 *
 * Pantalla para crear un vale de material (acarreo)
 *
 * PROPÓSITO:
 * - Capturar datos del vale de material
 * - Pre-llenar obra y empresa del residente
 * - Calcular distancia automáticamente según banco y obra
 * - Validar campos antes de guardar
 * - Gestionar lógica de copias según tipo de material
 *
 * FLUJO:
 * 1. Usuario llena formulario (datos de vale y operador)
 * 2. Selecciona banco → distancia se llena automáticamente
 * 3. Sistema determina qué copia generar según tipo de material:
 *    - Tipo 3 (excepto Tepetate) → Copia BLANCA
 *    - Tepetate → Copia ROJA
 *    - Otros materiales → Copia ROJA
 * 4. Se guarda en BD con estado 'emitido'
 *
 * NAVEGACIÓN:
 * ValesScreen → SeleccionarTipoValeScreen → ValeMaterialScreen
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
import { useAuth } from "../hooks/useAuth";
import { useCatalogos } from "../hooks/useCatalogos";
import { useFolioGenerator } from "../hooks/useFolioGenerator";
import {
  validateOperadorNombre,
  validatePlacas,
  validateCapacidad,
  validateMaterialId,
  validateBancoId,
  validateCantidadSolicitada,
  validateDistancia,
} from "../utils/validations";

// Componentes reutilizables
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";
import FormInput from "../componets/forms/FormInput";
import FormPicker from "../componets/forms/FormPicker";
import DatosOperadorSection from "../componets/vale/DatosOperadorSection";

const ValeMaterialScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Hook para cargar catálogos necesarios
  // Incluye materiales (con tipo), bancos y sindicatos
  const {
    materiales,
    bancos,
    loading: loadingCatalogos,
  } = useCatalogos(["materiales", "bancos"]);

  // Estado para almacenar datos de la obra del usuario
  const [obraData, setObraData] = useState(null);
  const [loadingObra, setLoadingObra] = useState(true);

  // Hook para generar folios únicos
  const generateFolio = useFolioGenerator(obraData);

  // Estados del formulario - Sección "Datos de Vale"
  const [formData, setFormData] = useState({
    materialId: null, // ID del material seleccionado
    bancoId: null, // ID del banco de material
    capacidad: "", // Capacidad del camión en m³
    cantidadSolicitada: "", // Cantidad de material a acarrear en m³
    distancia: "", // Distancia banco-obra en Km (calculada automáticamente)
    operadorNombre: "", // Nombre del operador
    operadorPlacas: "", // Placas del vehículo
    notasAdicionales: "", // Notas opcionales
  });

  // Estados para manejar la UI
  const [submitting, setSubmitting] = useState(false); // Estado de guardado
  const [errors, setErrors] = useState({}); // Errores de validación

  // Estados para lógica de copias
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [generarCopiaRoja, setGenerarCopiaRoja] = useState(true); // Por defecto true

  /**
   * EFECTO: Cargar datos de la obra del usuario
   * Se ejecuta una vez al montar el componente
   */
  useEffect(() => {
    const fetchObraData = async () => {
      // Verificar que el usuario tenga una obra asignada
      if (!userProfile?.id_current_obra) {
        setLoadingObra(false);
        return;
      }

      try {
        setLoadingObra(true);

        // Consultar datos de la obra actual del usuario
        // Incluye información de la empresa asociada
        const { data, error } = await supabase
          .from("obras")
          .select(
            `
            id_obra,
            obra,
            cc,
            empresas:id_empresa (
              id_empresa,
              empresa,
              sufijo
            )
          `
          )
          .eq("id_obra", userProfile.id_current_obra)
          .single();

        if (error) throw error;

        setObraData(data);
      } catch (error) {
        console.error("Error cargando datos de obra:", error);
        Alert.alert("Error", "No se pudieron cargar los datos de la obra");
      } finally {
        setLoadingObra(false);
      }
    };

    fetchObraData();
  }, [userProfile]);

  /**
   * EFECTO: Resetear formulario al salir de la pantalla
   * Previene que los datos persistan al regresar
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      resetForm();
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * EFECTO: Calcular distancia cuando se selecciona un banco
   * Busca la distancia en la tabla distancias_banco_obra
   */
  useEffect(() => {
    const fetchDistancia = async () => {
      // Solo buscar si hay banco y obra seleccionados
      if (!formData.bancoId || !obraData?.id_obra) {
        setFormData((prev) => ({ ...prev, distancia: "" }));
        return;
      }

      try {
        // Consultar la distancia específica para este banco y obra
        const { data, error } = await supabase
          .from("distancias_banco_obra")
          .select("distancia_km")
          .eq("id_banco", formData.bancoId)
          .eq("id_obra", obraData.id_obra)
          .maybeSingle();

        if (error) throw error;

        // Si existe el registro, llenar el campo distancia
        if (data) {
          setFormData((prev) => ({
            ...prev,
            distancia: data.distancia_km.toString(),
          }));
        } else {
          // Si no existe, limpiar el campo y avisar
          setFormData((prev) => ({ ...prev, distancia: "" }));
          Alert.alert(
            "Distancia no configurada",
            "No hay una distancia registrada para este banco y obra. Contacta al administrador."
          );
        }
      } catch (error) {
        console.error("Error consultando distancia:", error);
        Alert.alert("Error", "No se pudo obtener la distancia");
      }
    };

    fetchDistancia();
  }, [formData.bancoId, obraData]);

  /**
   * EFECTO: Determinar lógica de copia según tipo de material
   * Se ejecuta cuando cambia el material seleccionado
   */
  useEffect(() => {
    if (!formData.materialId || materiales.length === 0) {
      setMaterialSeleccionado(null);
      setGenerarCopiaRoja(true);
      return;
    }

    // Buscar el material seleccionado en el catálogo
    const material = materiales.find(
      (m) => m.id_material === formData.materialId
    );

    if (!material) return;

    setMaterialSeleccionado(material);

    // Lógica de copias:
    // - Materiales tipo 3 (excepto Tepetate) → BLANCA
    // - Tepetate → ROJA (siempre)
    // - Otros materiales → ROJA

    const esTipo3 = material.id_tipo_de_material === 3;
    const esTepetate = material.material?.toLowerCase().includes("tepetate");

    if (esTipo3 && !esTepetate) {
      // Tipo 3 (excepto Tepetate) → Genera copia BLANCA
      setGenerarCopiaRoja(false);
    } else {
      // Tepetate u otros materiales → Genera copia ROJA
      setGenerarCopiaRoja(true);
    }
  }, [formData.materialId, materiales]);

  /**
   * FUNCIÓN: Validar todos los campos del formulario
   * @returns {boolean} - true si el formulario es válido
   */
  const validateForm = () => {
    const newErrors = {};

    // Validar cada campo usando las funciones de validación
    const errorMaterial = validateMaterialId(formData.materialId);
    if (errorMaterial) newErrors.materialId = errorMaterial;

    const errorBanco = validateBancoId(formData.bancoId);
    if (errorBanco) newErrors.bancoId = errorBanco;

    const errorCapacidad = validateCapacidad(formData.capacidad);
    if (errorCapacidad) newErrors.capacidad = errorCapacidad;

    const errorCantidad = validateCantidadSolicitada(
      formData.cantidadSolicitada
    );
    if (errorCantidad) newErrors.cantidadSolicitada = errorCantidad;

    const errorDistancia = validateDistancia(formData.distancia);
    if (errorDistancia) newErrors.distancia = errorDistancia;

    const errorNombre = validateOperadorNombre(formData.operadorNombre);
    if (errorNombre) newErrors.operadorNombre = errorNombre;

    const errorPlacas = validatePlacas(formData.operadorPlacas);
    if (errorPlacas) newErrors.operadorPlacas = errorPlacas;

    // Actualizar estado de errores
    setErrors(newErrors);

    // Retornar true si no hay errores
    return Object.keys(newErrors).length === 0;
  };

  /**
   * FUNCIÓN: Crear el vale de material
   * Guarda en tabla vales y vale_material_detalles
   */
  const handleCrearVale = async () => {
    // Validar formulario antes de proceder
    if (!validateForm()) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos requeridos"
      );
      return;
    }

    // Verificar que existan datos de obra
    if (!obraData) {
      Alert.alert("Error", "No se encontraron datos de la obra");
      return;
    }

    try {
      setSubmitting(true);

      // PASO 1: Generar folio único
      const folio = await generateFolio();

      // PASO 2: Verificar que el folio no exista (seguridad adicional)
      const { data: verificacion } = await supabase
        .from("vales")
        .select("folio")
        .eq("folio", folio)
        .maybeSingle();

      if (verificacion) {
        throw new Error(`El folio ${folio} ya existe`);
      }

      // PASO 3: Crear registro en tabla 'vales'
      const { data: valeCreado, error: errorVale } = await supabase
        .from("vales")
        .insert([
          {
            folio: folio,
            tipo_vale: "material",
            id_obra: obraData.id_obra,
            id_empresa: obraData.empresas.id_empresa,
            id_persona_creador: userProfile.id_persona,
            operador_nombre: formData.operadorNombre.trim(),
            placas_vehiculo: formData.operadorPlacas.trim().toUpperCase(),
            estado: "emitido", // Material se emite inmediatamente
            total_copias_emitidas: 1, // Se emite la copia inicial
          },
        ])
        .select()
        .single();

      if (errorVale) throw errorVale;

      // PASO 4: Crear registro en tabla 'vale_material_detalles'
      const { error: errorDetalle } = await supabase
        .from("vale_material_detalles")
        .insert([
          {
            id_vale: valeCreado.id_vale,
            id_material: formData.materialId,
            id_banco: formData.bancoId,
            capacidad_m3: parseFloat(formData.capacidad),
            distancia_km: parseFloat(formData.distancia),
            cantidad_pedida_m3: parseFloat(formData.cantidadSolicitada),
            peso_ton: null, // Se llenará posteriormente cuando llegue el material
          },
        ]);

      if (errorDetalle) throw errorDetalle;

      // PASO 5: Registrar la copia inicial en tabla 'vale_copias'
      // Determinar color según tipo de material
      const colorCopia = generarCopiaRoja ? "roja" : "blanca";
      const destinatarioCopia = generarCopiaRoja ? "banco" : "operador";

      const { error: errorCopia } = await supabase.from("vale_copias").insert([
        {
          id_vale: valeCreado.id_vale,
          numero_copia: generarCopiaRoja ? 1 : 0,
          color: colorCopia,
          destinatario: destinatarioCopia,
          emitida_por: userProfile.id_persona,
        },
      ]);

      if (errorCopia) throw errorCopia;

      // TODO: Aquí iría la generación del PDF con el color correspondiente

      // ÉXITO: Mostrar mensaje y navegar
      Alert.alert(
        "Vale creado",
        `Vale de material ${folio} creado exitosamente.\nCopia ${colorCopia.toUpperCase()} generada.`,
        [
          {
            text: "Ver Acarreos",
            onPress: () => {
              resetForm();
              navigation.reset({
                index: 0,
                routes: [{ name: "ValesMain" }],
              });
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

  /**
   * FUNCIÓN: Resetear el formulario a su estado inicial
   */
  const resetForm = () => {
    setFormData({
      materialId: null,
      bancoId: null,
      capacidad: "",
      cantidadSolicitada: "",
      distancia: "",
      operadorNombre: "",
      operadorPlacas: "",
      notasAdicionales: "",
    });
    setErrors({});
    setMaterialSeleccionado(null);
    setGenerarCopiaRoja(true);
  };

  // RENDERIZADO: Mostrar loading mientras se cargan datos
  if (loadingObra || loadingCatalogos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  // RENDERIZADO: Mostrar error si no hay obra asignada
  if (!obraData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          No tienes una obra asignada. Contacta al administrador.
        </Text>
      </View>
    );
  }

  // RENDERIZADO PRINCIPAL
  return (
    <View style={styles.container}>
      {/* Header fijo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Material</Text>
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
            infoMessage="Información del material a acarrear. Los campos de obra y empresa se llenan automáticamente según tu perfil."
          />

          {/* Campo: Obra (bloqueado) */}
          <FormInput
            label="Obra"
            value={obraData.obra || "Sin obra"}
            onChangeText={() => {}}
            editable={false}
          />

          {/* Campo: Empresa (bloqueado) */}
          <FormInput
            label="Empresa"
            value={obraData.empresas?.empresa || "Sin empresa"}
            onChangeText={() => {}}
            editable={false}
          />

          {/* Campo: Material (picker) */}
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
            placeholder="Selecciona el material"
            error={errors.materialId}
          />

          {/* Campo: Banco de Material (picker) */}
          <FormPicker
            label="Banco de Material"
            value={formData.bancoId}
            onValueChange={(value) =>
              setFormData({ ...formData, bancoId: value })
            }
            items={bancos.map((b) => ({
              id: b.id_banco,
              label: b.banco,
            }))}
            placeholder="Selecciona el banco"
            error={errors.bancoId}
          />

          {/* Campo: Cantidad Solicitada */}
          <FormInput
            label="Cantidad Solicitada"
            value={formData.cantidadSolicitada}
            onChangeText={(value) =>
              setFormData({ ...formData, cantidadSolicitada: value })
            }
            placeholder="Ej: 9.5"
            keyboardType="numeric"
            suffix="m³"
            error={errors.cantidadSolicitada}
          />

          {/* Campo: Capacidad */}
          <FormInput
            label="Capacidad"
            value={formData.capacidad}
            onChangeText={(value) =>
              setFormData({ ...formData, capacidad: value })
            }
            placeholder="Ej: 10"
            keyboardType="numeric"
            suffix="m³"
            error={errors.capacidad}
          />

          {/* Campo: Distancia (bloqueado, calculado automáticamente) */}
          <FormInput
            label="Distancia"
            value={formData.distancia}
            onChangeText={() => {}}
            placeholder="Selecciona un banco"
            keyboardType="numeric"
            suffix="Km"
            editable={false}
            error={errors.distancia}
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

        {/* Información sobre el tipo de copia que se generará */}
        {materialSeleccionado && (
          <View style={styles.infoCopiasContainer}>
            <Text style={styles.infoCopiasText}>
              Se generará copia{" "}
              <Text style={styles.infoCopiasDestacado}>
                {generarCopiaRoja ? "ROJA" : "BLANCA"}
              </Text>
              {" para "}
              {generarCopiaRoja ? "el banco de material" : "el operador"}
            </Text>
          </View>
        )}

        {/* Botón para crear vale */}
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

export default ValeMaterialScreen;

// Estilos del componente
// Reemplaza la sección de estilos al final del archivo

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
    backgroundColor: colors.surface, // Fondo blanco para las secciones
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
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  infoCopiasContainer: {
    backgroundColor: colors.accent + "20", // Fondo semi-transparente
    padding: 12,
    borderRadius: 8,
    marginTop: 0,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  infoCopiasText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  infoCopiasDestacado: {
    fontWeight: "bold",
    color: colors.accent,
  },
});
