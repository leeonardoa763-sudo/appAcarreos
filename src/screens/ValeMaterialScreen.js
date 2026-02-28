/**
 * screens/ValeMaterialScreen.js
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Config
import { colors } from "../config/colors";
import { commonStyles } from "../styles/";
import { supabase } from "../config/supabase";

// Hooks personalizados
import { useAuth } from "../hooks/useAuth";
import { useCatalogos } from "../hooks/useCatalogos";
import { useFolioGenerator } from "../hooks/useFolioGenerator";
import { useValeMaterialForm } from "../hooks/useValeMaterialForm";
import { useValeMaterialLogic } from "../hooks/useValeMaterialLogic";
import { useValeMaterialPDF } from "../hooks/useValeMaterialPDF";
import { useObras } from "../hooks/useObras";
import { useFeatureFlags } from "../hooks/useFeatureFlags";

// Componentes
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";
import QRCodeGenerator from "../componets/common/QRCodeGenerator";
import SuccessModal from "../componets/common/SuccessModal";
import FormInput from "../componets/forms/FormInput";
import CustomModalPicker from "../componets/forms/CustomModalPicker";
import DatosOperadorSection from "../componets/vale/DatosOperadorSection";
import KeyboardAvoidingScrollView from "../componets/common/KeyboardAvoidingScrollView";
import { usePresupuestoObra } from "../hooks/usePresupuestoObra";
import PresupuestoIndicator from "../componets/common/PresupuestoIndicator";

const ValeMaterialScreen = () => {
  const navigation = useNavigation();
  const { userProfile, userRole } = useAuth();
  const { flags } = useFeatureFlags();
  const isMounted = useRef(true);
  const esChecador = userRole === "CHECADOR";

  // Datos de obra
  const { obras, loading: loadingObras } = useObras(userProfile?.id_persona);

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

  // Estados locales
  const [valeCreado, setValeCreado] = useState(null);
  const [folioCreado, setFolioCreado] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [obraDataParaFolio, setObraDataParaFolio] = useState(null);
  const [completarDespues, setCompletarDespues] = useState(false);

  // Hooks de formulario y lógica
  const {
    formData,
    setFormData,
    errors,
    validateForm,
    resetForm: resetFormData,
  } = useValeMaterialForm(materiales);

  const {
    materialSeleccionado,
    setMaterialSeleccionado,
    generarCopiaRoja,
    submitting,
    crearVale,
    tipoMaterialSeleccionado,
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

  const { generateFolio } = useFolioGenerator();

  // Computed: tipo 3 en flujo directo
  const esTipo3DirectFlow =
    tipoMaterialSeleccionado === 3 && !flags.TIPO3_FLUJO_DOS_PASOS;
  // Presupuesto disponible para obra + material seleccionado
  const { presupuestoMaterial, materialConsultado } = usePresupuestoObra({
    id_obra: obraSeleccionada,
    id_material: formData.materialId,
  });

  // Bloquear creación si presupuesto agotado
  const presupuestoAgotado =
    presupuestoMaterial?.nivel === "blocked" ||
    presupuestoMaterial?.sinConfigurar === true;

  // Efecto: Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (typeof setMounted === "function") {
        setMounted(false);
      }
    };
  }, [setMounted]);

  // Efecto: Actualizar material seleccionado
  useEffect(() => {
    if (formData.materialId && materiales.length > 0) {
      const material = materiales.find(
        (m) => m.id_material === formData.materialId,
      );
      setMaterialSeleccionado(material || null);
    } else {
      setMaterialSeleccionado(null);
    }
  }, [formData.materialId, materiales, setMaterialSeleccionado]);

  // Efecto: Pre-seleccionar obra automáticamente
  useEffect(() => {
    if (obras.length > 0 && !obraSeleccionada) {
      const obraPrincipal = obras.find((o) => o.esPrincipal) || obras[0];
      setObraSeleccionada(obraPrincipal.id);
    }
  }, [obras, obraSeleccionada]);

  // Efecto: Construir obraData para folio
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

  // Efecto: Calcular distancia cuando cambia banco u obra
  useEffect(() => {
    const calcularDistancia = async () => {
      if (!formData.bancoId || !obraSeleccionada) {
        setFormData((prev) => ({ ...prev, distancia: "" }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from("distancias_banco_obra")
          .select("distancia_km")
          .eq("id_banco", formData.bancoId)
          .eq("id_obra", obraSeleccionada)
          .maybeSingle();

        if (error) throw error;

        if (data?.distancia_km) {
          setFormData((prev) => ({
            ...prev,
            distancia: data.distancia_km.toString(),
          }));
        } else {
          setFormData((prev) => ({ ...prev, distancia: "" }));

          const obraActual = obras.find((o) => o.id === obraSeleccionada);
          const nombreObra = obraActual ? obraActual.nombre : "esta obra";

          Alert.alert(
            "Distancia no configurada",
            `No hay una distancia registrada entre el banco seleccionado y ${nombreObra}. Contacta al administrador.`,
          );
        }
      } catch (error) {
        Alert.alert("Error", "No se pudo obtener la distancia");
      }
    };

    calcularDistancia();
  }, [formData.bancoId, obraSeleccionada, obras]);

  // Efecto: Compartir PDF cuando QR esté listo
  useEffect(() => {
    if (qrDataUrl && shouldSharePDF && valeCreado) {
      compartirPDF(valeCreado, generarCopiaRoja);
    }
  }, [qrDataUrl, shouldSharePDF, valeCreado, generarCopiaRoja, compartirPDF]);

  // Efecto: Reset al salir
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      if (isMounted.current) {
        resetForm();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const handleToggleCompletarDespues = () => {
    const nuevoValor = !completarDespues;
    setCompletarDespues(nuevoValor);

    if (nuevoValor) {
      setFormData((prev) => ({
        ...prev,
        selectedOperador: null,
        selectedVehiculo: null,
      }));
    }
  };

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
    if (!validateForm(esTipo3DirectFlow, completarDespues)) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos requeridos",
      );
      return;
    }

    if (!obraSeleccionada) {
      Alert.alert("Error", "Debes seleccionar una obra");
      return;
    }

    if (!obraDataParaFolio) {
      Alert.alert("Error", "Datos de obra no disponibles. Intenta de nuevo.");
      return;
    }

    try {
      const { valeCompleto, folio } = await crearVale(
        { ...formData, completarDespues },
        obraDataParaFolio,
        userProfile,
        generateFolio,
        materiales,
      );

      if (isMounted.current) {
        setValeCreado(valeCompleto);
        setFolioCreado(folio);
        setShowSuccessModal(true);
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert("Error", `No se pudo crear el vale: ${error.message}`);
      }
    }
  };

  // Función: Manejar compartir desde modal
  const handleCompartirDesdeModal = async () => {
    setShowSuccessModal(false);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (qrDataUrl) {
      compartirPDF(valeCreado, generarCopiaRoja);
    } else {
      setShouldSharePDF(true);
    }
  };

  // Loading
  if (loadingCatalogos || loadingObras) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  // Sin obras asignadas
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
      {/* Generador de QR invisible */}
      {valeCreado?.qr_verification_url && (
        <QRCodeGenerator
          value={valeCreado.qr_verification_url}
          onGenerated={handleQRGenerated}
          size={200}
        />
      )}
      {/* Indicador de presupuesto fijo arriba */}
      {materialConsultado && formData.materialId && (
        <View style={styles.presupuestoFijo}>
          <PresupuestoIndicator
            sinConfigurar={presupuestoMaterial?.sinConfigurar}
            label={materialSeleccionado?.material || "Material"}
            disponible={presupuestoMaterial?.disponible}
            presupuesto={presupuestoMaterial?.presupuestados}
            consumidos={presupuestoMaterial?.consumidos}
            porcentaje={presupuestoMaterial?.porcentaje}
            nivel={presupuestoMaterial?.nivel}
            tipo="material"
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
            infoMessage="Información del material a acarrear. Los campos de obra y empresa se llenan automáticamente según tu perfil."
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

          {/* Campo Requisición (solo tipo 1) */}
          {materialSeleccionado?.id_tipo_de_material === 1 && (
            <FormInput
              label="Requisición"
              value={formData.requisicion}
              onChangeText={(value) => {
                const formatted = value
                  .toUpperCase()
                  .replace(/[^A-Z0-9-]/g, "");
                setFormData({ ...formData, requisicion: formatted });
              }}
              placeholder="Ej: REQ-001"
              maxLength={50}
              error={errors.requisicion}
              autoCapitalize="characters"
            />
          )}

          {/* Campo Folio Vale Físico (solo tipo 3 en flujo directo) */}
          {esTipo3DirectFlow && (
            <FormInput
              label="Folio de Vale Físico"
              value={formData.folioValeFisico}
              onChangeText={(value) =>
                setFormData({
                  ...formData,
                  folioValeFisico: value.replace(/[^0-9]/g, ""),
                })
              }
              placeholder="Ej: 12345"
              keyboardType="number-pad"
              error={errors.folioValeFisico}
            />
          )}
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
            disabled={completarDespues}
          />
        </View>

        {/* Información de tipo de copia */}
        {materialSeleccionado && (
          <View style={styles.infoCopiasContainer}>
            <Text style={styles.infoCopiasText}>
              {esTipo3DirectFlow ? (
                <>
                  Se generará{" "}
                  <Text style={styles.infoCopiasDestacado}>copia BLANCA</Text>
                  {" directamente"}
                </>
              ) : tipoMaterialSeleccionado === 2 &&
                !flags.TIPO2_GENERAR_PDF_ROJO ? (
                <>
                  <Text style={styles.infoCopiasDestacado}>
                    Sin PDF al crear
                  </Text>
                  {" — se completará en Acarreos"}
                </>
              ) : (
                <>
                  Se generará copia{" "}
                  <Text style={styles.infoCopiasDestacado}>
                    {generarCopiaRoja ? "ROJA" : "BLANCA"}
                  </Text>
                  {" para "}
                  {generarCopiaRoja ? "el banco de material" : "el operador"}
                </>
              )}
            </Text>
          </View>
        )}

        {/* Botón crear vale */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={presupuestoAgotado ? "Presupuesto Agotado" : "Crear Vale"}
            onPress={handleCrearVale}
            loading={submitting || generatingPDF}
            icon={presupuestoAgotado ? "cancel" : "check-circle"}
            backgroundColor={
              presupuestoAgotado ? colors.disabled : colors.accent
            }
            disabled={presupuestoAgotado}
          />
        </View>
      </KeyboardAvoidingScrollView>

      <SuccessModal
        visible={showSuccessModal}
        title="Vale Creado"
        message={`Vale ${folioCreado} creado exitosamente${
          esTipo3DirectFlow
            ? "\n\nSe generó la copia BLANCA definitiva"
            : tipoMaterialSeleccionado === 2 && !flags.TIPO2_GENERAR_PDF_ROJO
              ? "\n\nEl vale quedó en proceso para completarse en Acarreos"
              : generarCopiaRoja
                ? "\n\nSe generó la copia ROJA preliminar"
                : "\n\nSe generó la copia BLANCA definitiva"
        }`}
        primaryAction={
          tipoMaterialSeleccionado === 2 && !flags.TIPO2_GENERAR_PDF_ROJO
            ? null
            : {
                text: "Compartir PDF",
                icon: "file-pdf-box",
                onPress: handleCompartirDesdeModal,
              }
        }
        onClose={() => {
          setShowSuccessModal(false);
          navegarAcarreos();
        }}
      />
    </View>
  );
};

export default ValeMaterialScreen;

const styles = {
  ...commonStyles,
  presupuestoFijo: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: colors.background,
  },
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
