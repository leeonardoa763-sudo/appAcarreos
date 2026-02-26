/**
 * ValeRentaScreen.js
 *
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
import { useObras } from "../hooks/useObras";

// Validaciones
import {
  validateOperadorId,
  validateVehiculoId,
  validateCapacidad,
  validateHoraInicioNoFutura,
  validateMaterialId,
  validateSindicatoId,
} from "../utils/validations";

// Componentes
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";
import FormInput from "../componets/forms/FormInput";
import FormPicker from "../componets/forms/FormPicker";
import CustomModalPicker from "../componets/forms/CustomModalPicker";
import FormTimePicker from "../componets/forms/FormTimePicker";
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
  // Refs para control
  const isMounted = useRef(true);

  // Hook para obtener obras del usuario
  const { obras, loading: loadingObras } = useObras(userProfile?.id_persona);

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

  // Hook para generar folio CON obraDataParaFolio
  const { generateFolio } = useFolioGenerator();
  // Estados del formulario
  const [formData, setFormData] = useState({
    materialId: null,
    capacidad: "",
    sindicatoId: null,
    horaInicio: new Date(),
    selectedOperador: null,
    selectedVehiculo: null,
    notasAdicionales: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [valeCreado, setValeCreado] = useState(null);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [obraDataParaFolio, setObraDataParaFolio] = useState(null);

  // Presupuesto de renta disponible para la obra seleccionada
  const { presupuestoRenta, rentaConsultada } = usePresupuestoObra({
    id_obra: obraSeleccionada,
  });

  // Bloquear creación si presupuesto agotado
  const presupuestoAgotado =
    presupuestoRenta?.nivel === "blocked" ||
    presupuestoRenta?.sinConfigurar === true;

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

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
        const obraData = {
          id_obra: obraActual.id,
          obra: obraActual.nombre,
          cc: obraActual.cc,
          empresas: {
            id_empresa: obraActual.id_empresa,
            empresa: obraActual.empresa,
            sufijo: obraActual.sufijo,
            logo: obraActual.logo,
          },
        };

        setObraDataParaFolio(obraData);
      } else {
        setObraDataParaFolio(null);
      }
    } else {
      setObraDataParaFolio(null);
    }
  }, [obraSeleccionada, obras]);

  // Validaciones
  const validateForm = () => {
    const newErrors = {};

    const errorMaterial = validateMaterialId(formData.materialId);
    if (errorMaterial) newErrors.materialId = errorMaterial;

    const errorCapacidad = validateCapacidad(formData.capacidad);
    if (errorCapacidad) newErrors.capacidad = errorCapacidad;

    const errorSindicato = validateSindicatoId(formData.sindicatoId);
    if (errorSindicato) newErrors.sindicatoId = errorSindicato;

    const errorHora = validateHoraInicioNoFutura(formData.horaInicio);
    if (errorHora) newErrors.horaInicio = errorHora;

    const errorOperador = validateOperadorId(
      formData.selectedOperador?.id_operador,
    );
    if (errorOperador) newErrors.operadorId = errorOperador;

    const errorVehiculo = validateVehiculoId(
      formData.selectedVehiculo?.id_vehiculo,
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
          id_obra: obraDataParaFolio.id_obra,
          id_empresa: obraDataParaFolio.empresas.id_empresa,
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
        (p) => p.id_sindicato === formData.sindicatoId,
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

  // Loading
  if (loadingObras || loadingCatalogos) {
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
            title={presupuestoAgotado ? "Presupuesto Agotado" : "Crear Vale"}
            onPress={handleCrearVale}
            loading={submitting}
            icon={presupuestoAgotado ? "cancel" : "check-circle"}
            backgroundColor={
              presupuestoAgotado ? colors.disabled : colors.accent
            }
            disabled={presupuestoAgotado}
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
