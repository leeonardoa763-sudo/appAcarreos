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
  validateOperadorId,
  validateVehiculoId,
  validateCapacidad,
  validateMaterialId,
  validateBancoId,
  validateSindicatoId,
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
import SuccessModal from "../componets/common/SuccessModal";

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
    sindicatos, // ← Debe estar aquí
    operadores,
    vehiculos,
    loading: loadingCatalogos,
  } = useCatalogos([
    "materiales",
    "bancos",
    "sindicatos",
    "operadores",
    "vehiculos",
  ]);

  // Hook para generar folios únicos
  const generateFolio = useFolioGenerator(obraData);

  // Estados del formulario
  const [formData, setFormData] = useState({
    materialId: null,
    bancoId: null,
    sindicatoId: null,
    capacidad: "",
    cantidadSolicitada: "",
    distancia: "",
    selectedOperador: null,
    selectedVehiculo: null,
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
  const [qrGenerated, setQrGenerated] = useState(false);

  // Flag para controlar si el usuario quiere compartir
  const [shouldSharePDF, setShouldSharePDF] = useState(false);
  const isSharing = useRef(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [folioCreado, setFolioCreado] = useState(null);

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
   * EFECTO: Compartir PDF cuando QR esté listo y usuario haya presionado compartir
   */
  useEffect(() => {
    if (qrDataUrl && shouldSharePDF && !isSharing.current) {
      console.log(
        "[ValeMaterialScreen] useEffect detectó: QR listo + usuario quiere compartir"
      );
      handleCompartirPDF();
    }
  }, [qrDataUrl, shouldSharePDF]);

  /**
   * FUNCIÓN: Validar todos los campos del formulario
   */
  const validateForm = () => {
    console.log("[ValeMaterialScreen] Iniciando validación...");
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

    const errorSindicato = validateSindicatoId(formData.sindicatoId);
    if (errorSindicato) newErrors.sindicatoId = errorSindicato;

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

  /**
   * FUNCIÓN: Crear el vale de material
   */
  const handleCrearVale = async () => {
    console.log("[ValeMaterialScreen] ========== INICIO CREAR VALE ==========");

    if (!validateForm()) {
      console.log("[ValeMaterialScreen] ❌ Validación falló");
      console.log("[ValeMaterialScreen] Errores:", errors);
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos requeridos"
      );
      return;
    }

    console.log("[ValeMaterialScreen] ✅ Validación pasó");

    if (!obraData) {
      Alert.alert("Error", "No se encontraron datos de la obra");
      return;
    }

    try {
      setSubmitting(true);

      console.log("[ValeMaterialScreen] Generando folio...");

      // PASO 1: Generar folio único
      const folio = await generateFolio();

      console.log("[ValeMaterialScreen] ✅ Folio generado:", folio);

      // PASO 2: Verificar que el folio no exista
      const { data: verificacion } = await supabase
        .from("vales")
        .select("folio")
        .eq("folio", folio)
        .maybeSingle();

      if (verificacion) {
        throw new Error(`El folio ${folio} ya existe`);
      }

      console.log("[ValeMaterialScreen] ✅ Folio verificado");

      // PASO 3: Generar URL de verificación con QR
      const verificationUrl = generateVerificationUrl(folio);
      console.log("[ValeMaterialScreen] ✅ URL generada");

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
            id_operador: formData.selectedOperador?.id_operador, // ← Agregado ?. por seguridad
            id_vehiculo: formData.selectedVehiculo?.id_vehiculo, // ← Agregado ?. por seguridad
            estado: "en_proceso",
            total_copias_emitidas: 1,
            qr_verification_url: verificationUrl,
          },
        ])
        .select()
        .single();

      if (errorVale) {
        console.error(
          "[ValeMaterialScreen] Error al insertar vale:",
          errorVale
        );
        throw errorVale;
      }
      console.log(
        "[ValeMaterialScreen] ✅ Vale insertado:",
        valeNuevo?.id_vale
      );

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
      console.log("[ValeMaterialScreen] ✅ Detalles insertados");

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

      if (errorConsulta) {
        console.error(
          "[ValeMaterialScreen] Error consultando vale completo:",
          errorConsulta
        );
        throw errorConsulta;
      }

      // ✅ VALIDAR que valeCompleto tenga datos mínimos necesarios
      if (
        !valeCompleto ||
        !valeCompleto.obras ||
        !valeCompleto.vale_material_detalles
      ) {
        console.error("[ValeMaterialScreen] Vale incompleto:", valeCompleto);
        throw new Error("El vale no tiene todos los datos necesarios");
      }

      console.log("[ValeMaterialScreen] Vale completo consultado:", {
        folio: valeCompleto.folio,
        tiene_operador: !!valeCompleto.operadores,
        tiene_vehiculo: !!valeCompleto.vehiculos,
        tiene_sindicato: !!valeCompleto.vehiculos?.sindicatos,
      });
      console.log("[ValeMaterialScreen] ✅ Vale consultado");
      console.log(
        "[ValeMaterialScreen] Estructura del vale:",
        JSON.stringify(valeCompleto, null, 2)
      );

      // PASO 8: Guardar vale creado para generar PDF
      setValeCreado(valeCompleto);
      console.log("[ValeMaterialScreen] ✅ Todo completado");

      // ÉXITO: Mostrar opciones para compartir PDF
      setFolioCreado(folio);
      setShowSuccessModal(true);
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
    //  Evitar procesamiento múltiple
    if (qrGenerated) {
      console.log("[ValeMaterialScreen] QR ya fue procesado, ignorando...");
      return;
    }

    try {
      console.log("[ValeMaterialScreen] QR generado exitosamente");
      setQrDataUrl(dataUrl);
      setQrGenerated(true);

      // Solo compartir si el usuario eligió "Compartir PDF"
      if (shouldSharePDF && !isSharing.current) {
        console.log(
          "[ValeMaterialScreen] Usuario quiere compartir - llamando handleCompartirPDF"
        );
        handleCompartirPDF();
      } else {
        console.log(
          "[ValeMaterialScreen] QR listo, esperando acción del usuario"
        );
      }
    } catch (error) {
      console.error("[ValeMaterialScreen] Error en handleQRGenerated:", error);
      Alert.alert("Error", "Hubo un problema al generar el código QR");
    }
  };

  /**
   * FUNCIÓN: Navegar a la sección Acarreos
   */
  const navegarAcarreos = () => {
    console.log("[ValeMaterialScreen] Navegando a Acarreos");
    resetForm();

    // Opción 1: Navegar directamente sin reset (más seguro)
    navigation.navigate("ValesMain");

    // Usar setTimeout para dar tiempo a que se complete la navegación
    setTimeout(() => {
      try {
        const parent = navigation.getParent();
        if (parent && parent.navigate) {
          console.log("[ValeMaterialScreen] Navegando a tab Acarreos");
          parent.navigate("Acarreos");
        } else {
          console.log(
            "[ValeMaterialScreen] No se pudo acceder al parent navigator"
          );
        }
      } catch (error) {
        console.error(
          "[ValeMaterialScreen] Error navegando a Acarreos:",
          error
        );
      }
    }, 100);
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

      //  ACTUALIZAR: Usar el servicio actualizado de PDF
      const colorCopia = generarCopiaRoja ? "roja" : "blanca";
      const pdfUri = await generateAndSharePDF(
        valeSimulado,
        colorCopia,
        qrTestUrl
      );

      Alert.alert(
        " PDF de prueba generado",
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
      sindicatoId: null,
      capacidad: "",
      cantidadSolicitada: "",
      distancia: "",
      selectedOperador: null,
      selectedVehiculo: null,
      notasAdicionales: "",
    });
    setErrors({});
    setMaterialSeleccionado(null);
    setGenerarCopiaRoja(true);
    setValeCreado(null);
    setQrDataUrl(null);
    setShouldSharePDF(false);
    setQrGenerated(false);
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
      {valeCreado &&
        valeCreado.qr_verification_url &&
        valeCreado.obras &&
        valeCreado.vale_material_detalles && (
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
      <SuccessModal
        visible={showSuccessModal}
        title="¡Vale Creado!"
        message={`Vale ${folioCreado} creado exitosamente.\n\nSe generó la copia ${
          generarCopiaRoja ? "ROJA" : "BLANCA"
        } para ${generarCopiaRoja ? "el banco" : "el operador"}`}
        primaryAction={{
          text: "Compartir PDF",
          icon: "share-variant",
          onPress: () => {
            console.log(
              "[ValeMaterialScreen] Usuario presionó 'Compartir PDF'"
            );
            setShowSuccessModal(false);

            // Si el QR ya está listo, compartir inmediatamente
            if (qrDataUrl && !isSharing.current) {
              console.log(
                "[ValeMaterialScreen] QR disponible - compartiendo inmediatamente"
              );
              handleCompartirPDF();
            } else {
              //  Si no, activar flag para compartir cuando se genere el QR
              console.log(
                "[ValeMaterialScreen] QR aún no disponible - activando flag shouldSharePDF"
              );
              setShouldSharePDF(true);
            }
          },
        }}
        onClose={() => {
          console.log("[ValeMaterialScreen] Usuario cerró modal sin compartir");
          setShowSuccessModal(false);
          navegarAcarreos();
        }}
      />
    </View>
  );
};

export default ValeMaterialScreen;

// Estilos del componente
const styles = commonStyles;
