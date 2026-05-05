/**
 * screens/ValeMaterialScreen.js
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

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

import { useObras } from "../hooks/useObras";
import { useFeatureFlags } from "../hooks/useFeatureFlags";

// Componentes
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";

import SuccessModal from "../componets/common/SuccessModal";
import FormInput from "../componets/forms/FormInput";
import CustomModalPicker from "../componets/forms/CustomModalPicker";
import SelectorCantidadVales from "../componets/vale/SelectorCantidadVales";
import KeyboardAvoidingScrollView from "../componets/common/KeyboardAvoidingScrollView";
import { usePresupuestoObra } from "../hooks/usePresupuestoObra";
import PresupuestoIndicator from "../componets/common/PresupuestoIndicator";

const ValeMaterialScreen = () => {
  const navigation = useNavigation();
  const { userProfile, userRole } = useAuth();
  const { flags } = useFeatureFlags();
  const isMounted = useRef(true);
  const selectorCantidadRef = useRef(null);
  const esChecador = userRole === "CHECADOR";

  const [cantidadVales, setCantidadVales] = useState(1);

  // Datos de obra
  const { obras, loading: loadingObras } = useObras(userProfile?.id_persona);

  // Catálogos
  const { materiales, bancos, sindicatos, loading: loadingCatalogos } =
    useCatalogos(["materiales", "bancos", "sindicatos"]);

  // Estados locales
  const [valeCreado, setValeCreado] = useState(null);
  const [folioCreado, setFolioCreado] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [obraDataParaFolio, setObraDataParaFolio] = useState(null);
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
    crearValesEnLote,
    tipoMaterialSeleccionado,
  } = useValeMaterialLogic(materiales);
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
    };
  }, []);

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

  // Efecto: Reset al salir
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
    setValeCreado(null);
    setFolioCreado(null);
    setMaterialSeleccionado(null);
  };

  // Función: Crear vale
  const handleCrearVale = () => {
    if (cantidadVales > 1) {
      // Validar primero antes de mostrar confirmacion
      if (!validateForm(esTipo3DirectFlow, true)) {
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
      // Delegar al modal de confirmacion del selector
      selectorCantidadRef.current?.pedirConfirmacion();
      return;
    }
    ejecutarCreacionVales();
  };

  const ejecutarCreacionVales = async () => {
    if (!validateForm(esTipo3DirectFlow, true)) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos requeridos",
      );
      return;
    }

    if (!obraSeleccionada) {
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
    const cantidad = cantidadVales;

    try {
      if (cantidad > 1) {
        const { creados } = await crearValesEnLote(
          { ...formData, completarDespues: true },
          obraDataParaFolio,
          userProfile,
          generateFolio,
          materiales,
          cantidad,
        );

        if (isMounted.current) {
          setFolioCreado(`${creados} vales creados`);
          setShowSuccessModal(true);
        }
      } else {
        const { valeCompleto, folio } = await crearVale(
          { ...formData, completarDespues: true },
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
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert("Error", `No se pudo crear el vale: ${error.message}`);
      }
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
        </View>
        {/* SECCIÓN: CANTIDAD DE VALES */}
        <View style={styles.section}>
          <SelectorCantidadVales
            ref={selectorCantidadRef}
            cantidad={cantidadVales}
            onCantidadChange={setCantidadVales}
            onConfirmar={ejecutarCreacionVales}
          />
        </View>

        {/* Botón crear vale */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={presupuestoAgotado ? "Presupuesto Agotado" : "Crear Vale"}
            onPress={handleCrearVale}
            loading={submitting}
            icon={presupuestoAgotado ? "cancel" : "check-circle"}
            backgroundColor={presupuestoAgotado ? colors.disabled : colors.accent}
            disabled={presupuestoAgotado}
          />
        </View>
      </KeyboardAvoidingScrollView>

      <SuccessModal
        visible={showSuccessModal}
        title={cantidadVales > 1 ? "Lote Creado" : "Vale Creado"}
        message={
          cantidadVales > 1
            ? `${folioCreado} exitosamente.\n\nAsigna operador y vehículo a cada uno desde la pantalla de Acarreos.`
            : `Vale ${folioCreado} creado exitosamente.\n\nEl operador y vehículo quedaron pendientes. Asígnalos desde Acarreos.`
        }
        primaryAction={{
          text: "Ir a Acarreos",
          icon: "arrow-right-circle",
          onPress: () => {
            setShowSuccessModal(false);
            navigation.navigate("ValesMain");
            const tabNavigator = navigation.getParent();
            if (tabNavigator?.navigate) tabNavigator.navigate("Acarreos");
          },
        }}
        onClose={() => {}}
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
};
