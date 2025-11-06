/**
 * screens/ValeMaterialScreen.js
 *
 * Pantalla para crear un vale de material (acarreo)
 *
 * PROPÓSITO:
 * - Capturar datos del vale de material
 * - Pre-llenar obra y empresa del residente
 * - Calcular distancia automáticamente según banco y obra
 * - Validar campos antes de guardar
 * - Gestionar lógica de copias según tipo de material
 * - Generar PDF con QR para compartir
 *
 * FLUJO:
 * 1. Usuario llena formulario (datos de vale y operador)
 * 2. Selecciona banco → distancia se llena automáticamente
 * 3. Sistema determina qué copia generar según tipo de material:
 *    - Tipo 3 (excepto Tepetate) → Copia BLANCA
 *    - Tepetate → Copia ROJA
 *    - Otros materiales → Copia ROJA
 * 4. Se guarda en BD con estado 'emitido'
 * 5. Genera QR y permite compartir PDF
 *
 * NAVEGACIÓN:
 * ValesScreen → SeleccionarTipoValeScreen → ValeMaterialScreen
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

// Configuración
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { commonStyles } from "../styles/";
// Hooks
import { useAuth } from "../hooks/useAuth";
import { useCatalogos } from "../hooks/useCatalogos";
import { useFolioGenerator } from "../hooks/useFolioGenerator";
import { useObraData } from "../hooks/useObraData";

// Validaciones
import {
  validateOperadorNombre,
  validatePlacas,
  validateCapacidad,
  validateMaterialId,
  validateBancoId,
  validateCantidadSolicitada,
  validateDistancia,
} from "../utils/validations";

// Utilidades
import { generateVerificationUrl } from "../utils/qrGenerator";

// Servicios
import { generateAndSharePDF } from "../services/pdfGenerator";

// Componentes comunes
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";
import QRCodeGenerator from "../componets/common/QRCodeGenerator";

// Componentes de formulario
import FormInput from "../componets/forms/FormInput";
import FormPicker from "../componets/forms/FormPicker";

// Componentes de vale
import DatosOperadorSection from "../componets/vale/DatosOperadorSection";

const ValeMaterialScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Hook para obtener datos de la obra del usuario
  const {
    obraData,
    loading: loadingObra,
    error: errorObra,
  } = useObraData(userProfile);

  // Hook para cargar catálogos necesarios
  const {
    materiales,
    bancos,
    loading: loadingCatalogos,
  } = useCatalogos(["materiales", "bancos"]);

  // Hook para generar folios únicos
  const generateFolio = useFolioGenerator(obraData);

  // Estados del formulario
  const [formData, setFormData] = useState({
    materialId: null,
    bancoId: null,
    capacidad: "",
    cantidadSolicitada: "",
    distancia: "",
    operadorNombre: "",
    operadorPlacas: "",
    notasAdicionales: "",
  });

  // Estados para manejar la UI
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Estados para lógica de copias
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [generarCopiaRoja, setGenerarCopiaRoja] = useState(true);

  // Estados para generación de PDF y QR
  const [valeCreado, setValeCreado] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Flag para controlar si el usuario quiere compartir
  const [shouldSharePDF, setShouldSharePDF] = useState(false);
  const isSharing = useRef(false);

  /**
   * EFECTO: Resetear formulario al salir de la pantalla
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      resetForm();
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * EFECTO: Calcular distancia cuando se selecciona un banco
   */
  useEffect(() => {
    const fetchDistancia = async () => {
      if (!formData.bancoId || !obraData?.id_obra) {
        setFormData((prev) => ({ ...prev, distancia: "" }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from("distancias_banco_obra")
          .select("distancia_km")
          .eq("id_banco", formData.bancoId)
          .eq("id_obra", obraData.id_obra)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setFormData((prev) => ({
            ...prev,
            distancia: data.distancia_km.toString(),
          }));
        } else {
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
   */
  useEffect(() => {
    if (!formData.materialId || materiales.length === 0) {
      setMaterialSeleccionado(null);
      setGenerarCopiaRoja(true);
      return;
    }

    const material = materiales.find(
      (m) => m.id_material === formData.materialId
    );

    if (!material) return;

    setMaterialSeleccionado(material);

    // Lógica de copias según tipo de material
    const esTipo3 = material.id_tipo_de_material === 3;
    const esTepetate = material.material?.toLowerCase().includes("tepetate");

    if (esTipo3 && !esTepetate) {
      setGenerarCopiaRoja(false); // Tipo 3 (excepto Tepetate) → BLANCA
    } else {
      setGenerarCopiaRoja(true); // Tepetate u otros → ROJA
    }
  }, [formData.materialId, materiales]);

  /**
   * FUNCIÓN: Validar todos los campos del formulario
   */
  const validateForm = () => {
    const newErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * FUNCIÓN: Crear el vale de material
   */
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

      // PASO 1: Generar folio único
      const folio = await generateFolio();

      // PASO 2: Verificar que el folio no exista
      const { data: verificacion } = await supabase
        .from("vales")
        .select("folio")
        .eq("folio", folio)
        .maybeSingle();

      if (verificacion) {
        throw new Error(`El folio ${folio} ya existe`);
      }

      // PASO 3: Generar URL de verificación con QR
      const verificationUrl = generateVerificationUrl(folio);

      // PASO 4: Crear registro en tabla 'vales' con URL de verificación
      const { data: valeNuevo, error: errorVale } = await supabase
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
            estado: "emitido",
            total_copias_emitidas: 1,
            qr_verification_url: verificationUrl,
          },
        ])
        .select()
        .single();

      if (errorVale) throw errorVale;

      // PASO 5: Crear registro en tabla 'vale_material_detalles'
      const { error: errorDetalle } = await supabase
        .from("vale_material_detalles")
        .insert([
          {
            id_vale: valeNuevo.id_vale,
            id_material: formData.materialId,
            id_banco: formData.bancoId,
            capacidad_m3: parseFloat(formData.capacidad),
            distancia_km: parseFloat(formData.distancia),
            cantidad_pedida_m3: parseFloat(formData.cantidadSolicitada),
            peso_ton: null,
          },
        ]);

      if (errorDetalle) throw errorDetalle;

      // PASO 6: Registrar la copia inicial en tabla 'vale_copias'
      const colorCopia = generarCopiaRoja ? "roja" : "blanca";
      const destinatarioCopia = generarCopiaRoja ? "banco" : "operador";

      const { error: errorCopia } = await supabase.from("vale_copias").insert([
        {
          id_vale: valeNuevo.id_vale,
          numero_copia: generarCopiaRoja ? 1 : 0,
          color: colorCopia,
          destinatario: destinatarioCopia,
          emitida_por: userProfile.id_persona,
        },
      ]);

      if (errorCopia) throw errorCopia;

      // PASO 7: Consultar vale completo con todas las relaciones para el PDF
      const { data: valeCompleto, error: errorConsulta } = await supabase
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
          vale_material_detalles (
            *,
            material:id_material (
              id_material,
              material
            ),
            bancos:id_banco (
              id_banco,
              banco
            )
          )
        `
        )
        .eq("id_vale", valeNuevo.id_vale)
        .single();

      if (errorConsulta) throw errorConsulta;

      // PASO 8: Guardar vale creado para generar PDF
      setValeCreado(valeCompleto);

      // ÉXITO: Mostrar opciones para compartir PDF
      Alert.alert(
        "¡Vale creado exitosamente!",
        `Vale ${folio} creado.\nCopia ${colorCopia.toUpperCase()} lista para compartir.`,
        [
          {
            text: "Compartir PDF",
            onPress: () => {
              //  Activar flag para compartir cuando QR esté listo
              setShouldSharePDF(true);
            },
          },
          {
            text: "Más Tarde",
            onPress: () => {
              navegarAcarreos();
            },
            style: "cancel",
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
   * FUNCIÓN: Compartir PDF con QR
   * Solo se ejecuta cuando el usuario presiona "Compartir PDF" y el QR está listo
   */
  const handleCompartirPDF = async () => {
    //  Evitar dobles llamadas
    if (isSharing.current) {
      return;
    }

    if (!valeCreado || !qrDataUrl) {
      Alert.alert("Error", "No se puede generar el PDF en este momento");
      return;
    }

    try {
      isSharing.current = true; // Marcar como en proceso
      setGeneratingPDF(true);

      const colorCopia = generarCopiaRoja ? "roja" : "blanca";

      // Generar y compartir PDF
      await generateAndSharePDF(valeCreado, colorCopia, qrDataUrl);

      // Después de compartir exitosamente, navegar a Acarreos
      setTimeout(() => {
        navegarAcarreos();
      }, 1000);
    } catch (error) {
      console.error("Error compartiendo PDF:", error);
      Alert.alert(
        "Error al compartir",
        "No se pudo compartir el PDF. Puedes encontrar el vale en la sección Acarreos."
      );

      // Navegar a Acarreos de todos modos
      setTimeout(() => {
        navegarAcarreos();
      }, 1500);
    } finally {
      setGeneratingPDF(false);
      isSharing.current = false; // Liberar flag
      setShouldSharePDF(false); // Resetear flag
    }
  };

  /**
   * FUNCIÓN: Callback cuando el QR se genera
   * Solo comparte si el usuario presionó "Compartir PDF"
   */
  const handleQRGenerated = (dataUrl) => {
    setQrDataUrl(dataUrl);

    // 🔥 Solo compartir si el usuario eligió "Compartir PDF"
    if (shouldSharePDF && !isSharing.current) {
      handleCompartirPDF();
    }
  };

  /**
   * FUNCIÓN: Navegar a la sección Acarreos
   */
  const navegarAcarreos = () => {
    resetForm();
    navigation.reset({
      index: 0,
      routes: [{ name: "ValesMain" }],
    });
    navigation.getParent()?.navigate("Acarreos");
  };
  /**
   *  FUNCIÓN TEMPORAL: Generar PDF para prueba en PC
   */
  const testGenerarPDFLocal = async () => {
    // Validar que el formulario esté completo
    if (!validateForm()) {
      Alert.alert(
        "Formulario incompleto",
        "Completa todos los campos para generar el PDF de prueba"
      );
      return;
    }

    if (!obraData) {
      Alert.alert("Error", "No hay datos de obra");
      return;
    }

    try {
      setGeneratingPDF(true);

      // Crear datos de vale simulados (sin guardar en BD)
      const folio = `TEST-${Date.now()}`;
      const verificationUrl = generateVerificationUrl(folio);

      const valeSimulado = {
        folio: folio,
        fecha_creacion: new Date().toISOString(),
        operador_nombre: formData.operadorNombre,
        placas_vehiculo: formData.operadorPlacas.toUpperCase(),
        qr_verification_url: verificationUrl,
        obras: {
          obra: obraData.obra,
          cc: obraData.cc,
          empresas: {
            empresa: obraData.empresas.empresa,
            sufijo: obraData.empresas.sufijo,
            logo: obraData.empresas.logo || null,
          },
        },
        vale_material_detalles: [
          {
            capacidad_m3: parseFloat(formData.capacidad),
            distancia_km: parseFloat(formData.distancia),
            cantidad_pedida_m3: parseFloat(formData.cantidadSolicitada),
            peso_ton: "Pendiente",
            material: {
              material:
                materiales.find((m) => m.id_material === formData.materialId)
                  ?.material || "N/A",
            },
            bancos: {
              banco:
                bancos.find((b) => b.id_banco === formData.bancoId)?.banco ||
                "N/A",
            },
          },
        ],
      };

      // Generar QR de prueba (base64 de imagen 1x1px transparente)
      const qrTestUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;

      // 🔥 ACTUALIZAR: Usar el servicio actualizado de PDF
      const colorCopia = generarCopiaRoja ? "roja" : "blanca";
      const pdfUri = await generateAndSharePDF(
        valeSimulado,
        colorCopia,
        qrTestUrl
      );

      Alert.alert(
        "✅ PDF de prueba generado",
        `Archivo guardado en:\n${pdfUri}\n\nPuedes extraerlo con ADB o compartirlo.`,
        [
          {
            text: "Entendido",
            style: "default",
          },
        ]
      );
    } catch (error) {
      console.error("Error generando PDF de prueba:", error);
      Alert.alert("Error", `No se pudo generar el PDF: ${error.message}`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  /**
   * FUNCIÓN: Resetear el formulario
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
    setValeCreado(null);
    setQrDataUrl(null);
    setShouldSharePDF(false);
    isSharing.current = false;
  };

  // RENDERIZADO: Loading
  if (loadingObra || loadingCatalogos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  // RENDERIZADO: Error sin obra
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
      {/* Componente invisible para generar QR cuando se crea un vale */}
      {valeCreado && valeCreado.qr_verification_url && (
        <QRCodeGenerator
          value={valeCreado.qr_verification_url}
          onGenerated={handleQRGenerated}
          size={200}
        />
      )}

      {/* Header */}
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
            placeholder="Selecciona el material"
            error={errors.materialId}
          />

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
            loading={submitting || generatingPDF}
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
const styles = commonStyles;
