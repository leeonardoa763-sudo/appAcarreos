/**
 * screens/ValeMaterialScreen.js
 *
 * CAMBIOS PASO C:
 * - ✅ Ref isMounted agregado
 * - ✅ Protección en setState
 * - ✅ Listener blur protegido
 * - ✅ Cleanup al desmontar
 */

import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";

// Config
import { colors } from "../config/colors";
import { commonStyles } from "../styles/";

// Hooks personalizados
import { useAuth } from "../hooks/useAuth";
import { useCatalogos } from "../hooks/useCatalogos";
import { useFolioGenerator } from "../hooks/useFolioGenerator";
import { useObraData } from "../hooks/useObraData";
import { useValeMaterialForm } from "../hooks/useValeMaterialForm";
import { useValeMaterialLogic } from "../hooks/useValeMaterialLogic";
import { useValeMaterialPDF } from "../hooks/useValeMaterialPDF";

// Componentes
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";
import QRCodeGenerator from "../componets/common/QRCodeGenerator";
import SuccessModal from "../componets/common/SuccessModal";
import FormInput from "../componets/forms/FormInput";
import FormPicker from "../componets/forms/FormPicker";
import CustomModalPicker from "../componets/forms/CustomModalPicker";
import DatosOperadorSection from "../componets/vale/DatosOperadorSection";
import KeyboardAvoidingScrollView from "../componets/common/KeyboardAvoidingScrollView";

const ValeMaterialScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // Ref para prevenir setState después de unmount
  const isMounted = useRef(true);

  // Datos de obra
  const { obraData, loading: loadingObra } = useObraData(userProfile);

  // Catálogos
  const {
    materiales,
    bancos,
    sindicatos,
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

  // Generador de folios
  const generateFolio = useFolioGenerator(obraData);

  // Hooks personalizados
  const {
    formData,
    setFormData,
    errors,
    validateForm,
    resetForm: resetFormData,
  } = useValeMaterialForm(obraData);

  const {
    materialSeleccionado,
    setMaterialSeleccionado,
    generarCopiaRoja,
    submitting,
    crearVale,
  } = useValeMaterialLogic(materiales);

  const {
    qrDataUrl,
    generatingPDF,
    shouldSharePDF,
    setShouldSharePDF,
    compartirPDF,
    handleQRGenerated,
    navegarAcarreos,
    resetPDFState,
    setMounted,
  } = useValeMaterialPDF(navigation);

  // Estados locales
  const [valeCreado, setValeCreado] = useState(null);
  const [folioCreado, setFolioCreado] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;

      // Marcar el hook PDF como desmontado también
      if (typeof setMounted === "function") {
        setMounted(false);
      }
    };
  }, []);

  // Efecto: Actualizar material seleccionado
  useEffect(() => {
    if (formData.materialId && materiales.length > 0) {
      const material = materiales.find(
        (m) => m.id_material === formData.materialId
      );
      setMaterialSeleccionado(material || null);
    } else {
      setMaterialSeleccionado(null);
    }
  }, [formData.materialId, materiales, setMaterialSeleccionado]);

  // Efecto: Compartir PDF cuando QR esté listo
  useEffect(() => {
    if (qrDataUrl && shouldSharePDF && valeCreado) {
      compartirPDF(valeCreado, generarCopiaRoja);
    }
  }, [qrDataUrl, shouldSharePDF, valeCreado, generarCopiaRoja, compartirPDF]);

  // Efecto: Reset al salir (PROTEGIDO)
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      if (isMounted.current) {
        resetForm();
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Función: Reset completo
  const resetForm = () => {
    resetFormData();
    resetPDFState();
    setValeCreado(null);
    setFolioCreado(null);
    setMaterialSeleccionado(null);
  };

  // Función: Crear vale
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
      const { valeCompleto, folio } = await crearVale(
        formData,
        obraData,
        userProfile,
        generateFolio,
        materiales
      );

      // Proteger setState
      if (isMounted.current) {
        setValeCreado(valeCompleto);
        setFolioCreado(folio);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("[ValeMaterialScreen] Error:", error);

      if (isMounted.current) {
        Alert.alert("Error", `No se pudo crear el vale: ${error.message}`);
      }
    }
  };

  // Función: Manejar compartir desde modal
  const handleCompartirDesdeModal = async () => {
    // ✅ Cerrar modal PRIMERO
    setShowSuccessModal(false);

    // ✅ Esperar a que el modal se cierre completamente
    await new Promise((resolve) => setTimeout(resolve, 500));

    // ✅ Ahora compartir
    if (qrDataUrl) {
      compartirPDF(valeCreado, generarCopiaRoja);
    } else {
      setShouldSharePDF(true);
    }
  };

  // Loading
  if (loadingObra || loadingCatalogos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  // Sin obra
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
      {/* Generador de QR invisible */}
      {valeCreado?.qr_verification_url && (
        <QRCodeGenerator
          value={valeCreado.qr_verification_url}
          onGenerated={handleQRGenerated}
          size={200}
        />
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
            placeholder="Selecciona el material"
            error={errors.materialId}
          />

          <CustomModalPicker
            label="Banco de Material"
            value={formData.bancoId}
            onValueChange={(value) =>
              setFormData({ ...formData, bancoId: value })
            }
            items={bancos.map((b) => ({ id: b.id_banco, label: b.banco }))}
            placeholder="Selecciona el banco"
            error={errors.bancoId}
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

          {/* ✅ NUEVO: Campo Requisición (solo tipo 1) */}
          {materialSeleccionado?.id_tipo_de_material === 1 && (
            <FormInput
              label="Requisición *"
              value={formData.requisicion}
              onChangeText={(value) => {
                // Convertir a mayúsculas y permitir solo letras, números y guiones
                const formatted = value
                  .toUpperCase()
                  .replace(/[^A-Z0-9-]/g, "");
                setFormData({ ...formData, requisicion: formatted });
              }}
              placeholder="Ej: REQ-2024-001"
              maxLength={50}
              error={errors.requisicion}
              autoCapitalize="characters"
            />
          )}
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

        {/* Información de tipo de copia */}
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

        {/* Botón crear vale */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Crear Vale"
            onPress={handleCrearVale}
            loading={submitting || generatingPDF}
            icon="check-circle"
            backgroundColor={colors.accent}
          />
        </View>
      </KeyboardAvoidingScrollView>

      <SuccessModal
        visible={showSuccessModal}
        title="Vale Creado"
        message={`Vale ${folioCreado} creado exitosamente${
          generarCopiaRoja
            ? "\n\nSe generó la copia ROJA preliminar"
            : "\n\nSe generó la copia BLANCA definitiva"
        }`}
        primaryAction={{
          text: "Compartir PDF",
          icon: "file-pdf-box",
          onPress: handleCompartirDesdeModal, // ← Usar la nueva función
        }}
        onClose={() => {
          setShowSuccessModal(false);
          navegarAcarreos();
        }}
      />
    </View>
  );
};

export default ValeMaterialScreen;

const styles = commonStyles;
