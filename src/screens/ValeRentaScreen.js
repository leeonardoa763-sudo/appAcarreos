/**
 * ValeRentaScreen.js
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  InteractionManager,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  validateHoraInicioNoFutura,
  validateMaterialId,
  validateSindicatoId,
} from "../utils/validations";

// Componentes
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";
import FormInput from "../componets/forms/FormInput";
import CustomModalPicker from "../componets/forms/CustomModalPicker";
import CustomTimePicker from "../componets/forms/CustomTimePicker";
import SuccessModal from "../componets/common/SuccessModal";
import KeyboardAvoidingScrollView from "../componets/common/KeyboardAvoidingScrollView";
import { usePresupuestoObra } from "../hooks/usePresupuestoObra";
import PresupuestoIndicator from "../componets/common/PresupuestoIndicator";
import RefrescarCatalogoButton from "../componets/common/RefrescarCatalogoButton";

// Utils
import { generateVerificationUrl } from "../utils/qrGenerator";
import {
  MODO_PIPA,
  filtrarMaterialesPorModo,
  filtrarSindicatosPorModo,
} from "../utils/pipasAgua";
import { resolverTarifaRenta } from "../utils/preciosRenta";

const ValeRentaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // La misma pantalla crea vales de renta normal y de pipa de agua. El modo se
  // conoce de entrada por el parametro de navegacion (ver ValeSelectionModal).
  // Declarado antes de cualquier consumidor por la TDZ estricta del build web.
  const esModoPipa = route.params?.modo === MODO_PIPA;
  const { userProfile, userRole } = useAuth();
  const esChecador = userRole === "CHECADOR";
  const isMounted = useRef(true);

  const { obras, loading: loadingObras } = useObras(userProfile?.id_persona);

  // preciosRenta ya no se pide aqui: la tarifa se resuelve contra la BD al crear
  // el vale (resolverTarifaRenta), porque una tarifa por obra recien capturada
  // debe aplicar de inmediato y el catalogo tiene un TTL de 4 h.
  const {
    materiales,
    sindicatos,
    loading: loadingCatalogos,
    refrescando: refrescandoCatalogos,
    refrescarCatalogos,
  } = useCatalogos(["materiales", "sindicatos"]);

  // Particion bidireccional segun el modo: en modo pipa SOLO existe el material
  // Agua y el sindicato Pipas; en modo renta normal ninguno de los dos aparece.
  // Al conocerse el modo de entrada, basta particionar los catalogos desde el
  // arranque (no hace falta filtrado reactivo cruzado).
  const materialesVisibles = useMemo(
    () => filtrarMaterialesPorModo(materiales, esModoPipa),
    [materiales, esModoPipa],
  );
  const sindicatosVisibles = useMemo(
    () => filtrarSindicatosPorModo(sindicatos, esModoPipa),
    [sindicatos, esModoPipa],
  );

  const { generateFolio } = useFolioGenerator();

  const [formData, setFormData] = useState({
    materialId: null,
    sindicatoId: null,
    horaInicio: null,
    notasAdicionales: "",
  });

  const [esTurnoNocturno, setEsTurnoNocturno] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [valeCreado, setValeCreado] = useState(null);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [obraDataParaFolio, setObraDataParaFolio] = useState(null);
  // Las pipas de agua NO consumen presupuesto_renta_obra: pasando id_obra=null
  // el hook deja presupuestoRenta=null y rentaConsultada=false, asi que el
  // PresupuestoIndicator no se monta, presupuestoAgotado queda false (no bloquea
  // el boton) y ademas se ahorra la consulta.
  const { presupuestoRenta, rentaConsultada } = usePresupuestoObra({
    id_obra: esModoPipa ? null : obraSeleccionada,
  });

  const presupuestoAgotado =
    presupuestoRenta?.nivel === "blocked" ||
    presupuestoRenta?.sinConfigurar === true;

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (obras.length > 0 && !obraSeleccionada) {
      const obraPrincipal = obras.find((o) => o.esPrincipal) || obras[0];
      setObraSeleccionada(obraPrincipal.id);
    }
  }, [obras, obraSeleccionada]);

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

  const validateForm = () => {
    const newErrors = {};

    const errorMaterial = validateMaterialId(formData.materialId);
    if (errorMaterial) newErrors.materialId = errorMaterial;

    const errorSindicato = validateSindicatoId(formData.sindicatoId);
    if (errorSindicato) newErrors.sindicatoId = errorSindicato;

    const errorHora = validateHoraInicioNoFutura(formData.horaInicio);
    if (errorHora) newErrors.horaInicio = errorHora;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

    // Guard defensivo contra cache stale: el material y el sindicato elegidos
    // deben corresponder al modo (pipa o renta normal). Si la cache local aun no
    // tenia las marcas es_agua_pipa/es_pipas, el picker pudo mostrar opciones
    // que no debia; se pide refrescar antes de crear un vale mal clasificado.
    const materialSel = materiales.find(
      (m) => m.id_material === formData.materialId,
    );
    const sindicatoSel = sindicatos.find(
      (s) => s.id_sindicato === formData.sindicatoId,
    );
    if (
      !!materialSel?.es_agua_pipa !== esModoPipa ||
      !!sindicatoSel?.es_pipas !== esModoPipa
    ) {
      Alert.alert(
        "Catálogo desactualizado",
        "El material y el sindicato no corresponden al tipo de vale. Usa el botón Refrescar catálogos e intenta de nuevo.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const folio = await generateFolio(obraDataParaFolio);

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
          // Spread condicional (no propiedad fija): si la migracion aun no
          // agrego la columna es_pipa_agua, la creacion de renta normal sigue
          // funcionando y solo truena la de pipas.
          ...(esModoPipa && { es_pipa_agua: true }),
          id_obra: obraDataParaFolio.id_obra,
          id_empresa: obraDataParaFolio.empresas.id_empresa,
          id_persona_creador: userProfile.id_persona,
          id_operador: null,
          id_vehiculo: null,
          estado: "en_proceso",
          qr_verification_url: generateVerificationUrl(folio),
        })
        .select()
        .single();

      if (valeError) throw valeError;

      // Tarifa propia de la obra si la tiene; si no, la del sindicato.
      // Se consulta a la BD (no al catalogo cacheado) para que una tarifa recien
      // capturada aplique de inmediato.
      const tarifa = await resolverTarifaRenta(
        formData.sindicatoId,
        obraDataParaFolio.id_obra,
      );

      if (!tarifa) {
        throw new Error("No se encontró precio para el sindicato seleccionado");
      }

      const { error: detalleError } = await supabase
        .from("vale_renta_detalle")
        .insert({
          id_vale: valeData.id_vale,
          id_material: formData.materialId,
          id_sindicato: formData.sindicatoId,

          numero_viajes: 1,
          hora_inicio: formData.horaInicio.toISOString(),
          hora_fin: null,
          id_precios_renta: tarifa.idPreciosRenta,
          id_precios_renta_obra: tarifa.idPreciosRentaObra,
          // Congelada: un cambio posterior de tarifa no reprecia este vale
          costo_hr_aplicado: tarifa.costoHr,
          costo_dia_aplicado: tarifa.costoDia,
          notas_adicionales: formData.notasAdicionales.trim() || null,
          es_turno_nocturno: esTurnoNocturno,
        });

      if (detalleError) throw detalleError;

      if (!isMounted.current) return;

      // Construir objeto con relaciones que necesita el recibo térmico
      const valeParaPDF = {
        ...valeData,
        folio,
        obras: {
          obra: obraDataParaFolio.obra,
          cc: obraDataParaFolio.cc,
          empresas: obraDataParaFolio.empresas,
        },
        operadores: null,
        vehiculos: null,
        persona: {
          nombre: userProfile.nombre,
          primer_apellido: userProfile.primer_apellido,
          segundo_apellido: userProfile.segundo_apellido,
        },
        vale_renta_detalle: [
          {
            material: {
              material:
                materiales.find((m) => m.id_material === formData.materialId)
                  ?.material || "N/A",
            },
            sindicatos: {
              sindicato:
                sindicatos.find((s) => s.id_sindicato === formData.sindicatoId)
                  ?.sindicato || "Pendiente",
            },

            hora_inicio: formData.horaInicio.toISOString(),
            hora_fin: null,
            es_renta_por_dia: false,
            total_horas: null,
            total_dias: null,
            notas_adicionales: formData.notasAdicionales.trim() || null,
            // Congelada, igual que en el insert: el recibo termico inmediato
            // debe mostrar la misma tarifa que quedo guardada en el vale
            costo_hr_aplicado: tarifa.costoHr,
            costo_dia_aplicado: tarifa.costoDia,
          },
        ],
      };

      setValeCreado(valeParaPDF);
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

  const handleNavigateToAcarreos = () => {
    if (isMounted.current) {
      setShowSuccessModal(false);
    }

    InteractionManager.runAfterInteractions(() => {
      if (!isMounted.current) return;

      navigation.navigate("ValesMain");

      requestAnimationFrame(() => {
        if (!isMounted.current) return;

        const tabNavigator = navigation.getParent();
        if (tabNavigator && tabNavigator.navigate) {
          tabNavigator.navigate("Acarreos");
        }
      });
    });
  };

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

  if (loadingObras || loadingCatalogos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

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

          <RefrescarCatalogoButton
            onPress={refrescarCatalogos}
            refrescando={refrescandoCatalogos}
          />

          <CustomModalPicker
            label="Material"
            value={formData.materialId}
            onValueChange={(value) =>
              setFormData({ ...formData, materialId: value })
            }
            items={materialesVisibles.map((m) => ({
              id: m.id_material,
              label: m.material,
            }))}
            placeholder="Selecciona el material movido"
            error={errors.materialId}
          />

          <CustomModalPicker
            label="Sindicato"
            value={formData.sindicatoId}
            onValueChange={(value) =>
              setFormData({ ...formData, sindicatoId: value })
            }
            items={sindicatosVisibles.map((s) => ({
              id: s.id_sindicato,
              label: s.sindicato,
            }))}
            placeholder="Selecciona el sindicato"
            error={errors.sindicatoId}
          />

          <CustomTimePicker
            label="Hora de Inicio"
            value={formData.horaInicio}
            onChange={(value) =>
              setFormData({ ...formData, horaInicio: value })
            }
            error={errors.horaInicio}
          />
        </View>

        {/* SECCIÓN: DATOS DE OPERADOR */}
        <View style={styles.section}>
          {/* Checkbox: turno nocturno */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setEsTurnoNocturno(!esTurnoNocturno)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                esTurnoNocturno && styles.checkboxActivo,
              ]}
            >
              {esTurnoNocturno && (
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color={colors.surface}
                />
              )}
            </View>
            <View style={styles.checkboxTextos}>
              <Text style={styles.checkboxLabel}>Turno nocturno</Text>
              <Text style={styles.checkboxSubtitle}>
                El vale podra completarse hasta 12 hrs desde el inicio
              </Text>
            </View>
          </TouchableOpacity>

        </View>

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
        title="Vale Creado"
        message={`Vale ${valeCreado?.folio} creado exitosamente.\n\nEl operador y vehículo quedaron pendientes. Asígnalos desde Acarreos.`}
        primaryAction={{
          text: "Continuar",
          icon: "check-circle",
          onPress: () => {
            setShowSuccessModal(false);
            InteractionManager.runAfterInteractions(() => {
              navigation.navigate("ValesMain");
              requestAnimationFrame(() => {
                const tabNavigator = navigation.getParent();
                if (tabNavigator?.navigate) {
                  tabNavigator.navigate("Acarreos");
                }
              });
            });
          },
        }}
        onClose={() => {}}
      />

    </View>
  );
};

export default ValeRentaScreen;

const styles = {
  ...commonStyles,
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
