/**
 * screens/ValeMaterialAsfalticoScreen.js
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
import crossAlert from "../utils/crossAlert";

// Hooks personalizados
import { useAuth } from "../hooks/useAuth";
import { useCatalogos } from "../hooks/useCatalogos";
import { useFolioGenerator } from "../hooks/useFolioGenerator";
import { useValeMaterialForm } from "../hooks/useValeMaterialForm";
import { useValeMaterialLogic } from "../hooks/useValeMaterialLogic";
import { useObras } from "../hooks/useObras";
import useEvidenciaVale from "../hooks/useEvidenciaVale";
import useVehiculoQRScanner from "../hooks/useVehiculoQRScanner";
import useVehiculoQR from "../hooks/useVehiculoQR";

// Componentes
import SectionHeader from "../componets/common/SectionHeader";
import PrimaryButton from "../componets/common/PrimaryButton";
import SuccessModal from "../componets/common/SuccessModal";
import FormInput from "../componets/forms/FormInput";
import CustomModalPicker from "../componets/forms/CustomModalPicker";
import KeyboardAvoidingScrollView from "../componets/common/KeyboardAvoidingScrollView";
import QRScannerModal from "../componets/common/QRScannerModal";
import RefrescarCatalogoButton from "../componets/common/RefrescarCatalogoButton";
import EvidenciaCaptura from "../componets/vale/EvidenciaCaptura";
import ModalImprimirTicketRenta from "../componets/acarreos/rentaHelpers/ModalImprimirTicketRenta";
import ModalBuscarVehiculoPlacas from "../componets/acarreos/ModalBuscarVehiculoPlacas";
import ModalSeleccionarOperador from "../componets/modals/asignarVehiculo/ModalSeleccionarOperador";
import { generarYCompartirPDFTicket } from "../services/pdfTicketGenerator";
import { BLUETOOTH_ENABLED, HIDE_ON_WEB } from "../config/features";

let generarTicketMaterial;
if (BLUETOOTH_ENABLED) {
  const tg = require("../services/ticketGenerator");
  generarTicketMaterial = tg.generarTicketMaterial;
}

const ValeMaterialAsfalticoScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const isMounted = useRef(true);

  // Datos de obra
  const { obras, loading: loadingObras } = useObras(userProfile?.id_persona);

  // Catálogos necesarios para asfáltico
  const {
    materiales,
    bancos,
    sindicatos,
    operadores,
    vehiculos,
    loading: loadingCatalogos,
    refrescando: refrescandoCatalogos,
    refrescarCatalogos,
  } = useCatalogos(["materiales", "bancos", "sindicatos", "operadores", "vehiculos"]);

  const materialesFiltrados = materiales.filter(
    (m) => m.id_tipo_de_material === 2,
  );

  // Estados locales
  const [valeCreado, setValeCreado] = useState(null);
  const [folioCreado, setFolioCreado] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [obraDataParaFolio, setObraDataParaFolio] = useState(null);
  const [showModalImpresion, setShowModalImpresion] = useState(false);
  const [valeParaImpresion, setValeParaImpresion] = useState(null);
  const [showModalBuscarVehiculo, setShowModalBuscarVehiculo] = useState(false);
  const [showModalSeleccionarOperador, setShowModalSeleccionarOperador] = useState(false);

  // Hooks de formulario y lógica
  const {
    formData,
    setFormData,
    errors,
    validateForm,
    resetForm: resetFormData,
  } = useValeMaterialForm(materialesFiltrados, true);

  const {
    materialSeleccionado,
    setMaterialSeleccionado,
    generarCopiaRoja,
    submitting,
    crearVale,
  } = useValeMaterialLogic(materialesFiltrados);
  const { generateFolio } = useFolioGenerator();

  const {
    vehiculo: vehiculoQR,
    buscarVehiculoPorQR,
    reset: resetVehiculoQR,
  } = useVehiculoQR({ expectedSindicatoId: formData.sindicatoId });

  const scannerVehiculo = useVehiculoQRScanner({
    onQrDetectado: buscarVehiculoPorQR,
  });

  useEffect(() => {
    if (vehiculoQR) {
      setFormData((prev) => ({
        ...prev,
        selectedVehiculo: vehiculoQR,
        selectedOperador: vehiculoQR.operador_sugerido || null,
      }));
    }
  }, [vehiculoQR, setFormData]);

  useEffect(() => {
    if (
      formData.selectedVehiculo &&
      formData.sindicatoId &&
      formData.selectedVehiculo.id_sindicato !== formData.sindicatoId
    ) {
      setFormData((prev) => ({
        ...prev,
        selectedVehiculo: null,
        selectedOperador: null,
        vehiculoPlacas: "",
      }));
    }
  }, [formData.sindicatoId, formData.selectedVehiculo, setFormData]);

  const obraSeleccionadaData = obras.find((o) => o.id === obraSeleccionada);
  const {
    foto,
    fotoUrl,
    ubicacion,
    loadingFoto,
    loadingUbicacion,
    errorFoto,
    errorUbicacion,
    tomarFoto,
    capturarUbicacion,
    dentroDelRadio,
    obraTieneCoordenadas,
    radioConfigurado,
    resetEvidencia,
  } = useEvidenciaVale(obraSeleccionadaData);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

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

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      vehiculoPlacas: formData.selectedVehiculo
        ? formData.selectedVehiculo.placas || ""
        : "",
    }));
  }, [formData.selectedVehiculo]);

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

  useEffect(() => {
    if (bancos.length === 0) return;
    const planta = bancos.find((b) =>
      b.banco.toLowerCase().includes("asfalto"),
    );
    if (!planta) return;
    setFormData((prev) => {
      if (prev.bancoId) return prev;
      return { ...prev, bancoId: planta.id_banco };
    });
  }, [bancos, setFormData]);

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

  const resetForm = () => {
    resetFormData();
    setValeCreado(null);
    setFolioCreado(null);
    setMaterialSeleccionado(null);
  };

  const handleVehiculoManual = (vehiculo) => {
    setFormData((prev) => ({
      ...prev,
      selectedVehiculo: vehiculo,
      selectedOperador: vehiculo.operador_sugerido || null,
    }));
  };

  const handleOperadorSeleccionado = (operador) => {
    setFormData((prev) => ({ ...prev, selectedOperador: operador }));
    setShowModalSeleccionarOperador(false);
  };

  const operadoresDelSindicato = operadores.filter(
    (op) => op.id_sindicato === formData.sindicatoId,
  );
  const sindicatoSeleccionadoNombre = sindicatos.find(
    (s) => s.id_sindicato === formData.sindicatoId,
  )?.sindicato;

  const alertarCamposIncompletos = () => {
    if (formData.selectedVehiculo && !formData.selectedVehiculo.capacidad_m3) {
      Alert.alert(
        "Vehículo sin capacidad",
        "El vehículo seleccionado no tiene capacidad registrada. Contacta al administrador para actualizarla.",
      );
      return;
    }
    Alert.alert(
      "Campos incompletos",
      "Por favor completa todos los campos requeridos",
    );
  };

  const handleCrearVale = () => {
    if (!validateForm(false, false)) {
      alertarCamposIncompletos();
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
    ejecutarCreacionValeAsfaltico();
  };

  const ejecutarCreacionValeAsfaltico = async () => {
    if (!validateForm(false, false)) {
      alertarCamposIncompletos();
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
        formData,
        obraDataParaFolio,
        userProfile,
        generateFolio,
        materialesFiltrados,
        {
          estadoInicial: "emitido",
          idOperador: formData.selectedOperador?.id_operador ?? null,
          idVehiculo: formData.selectedVehiculo?.id_vehiculo ?? null,
          capacidadM3: formData.selectedVehiculo?.capacidad_m3 ?? null,
          cantidadPedidaM3: parseFloat(formData.cantidadMaterial),
        },
      );

      if (isMounted.current) {
        setValeCreado(valeCompleto);
        setFolioCreado(folio);
        setShowSuccessModal(false);
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert("Error", `No se pudo crear el vale: ${error.message}`);
      }
    }
  };

  const handleCompartirPDF = async () => {
    if (!valeCreado) {
      Alert.alert("Error", "No hay vale disponible para generar el PDF.");
      return;
    }

    try {
      // Antes de generar el PDF, si hay evidencia (foto) cargarla en la DB
      try {
        if (fotoUrl && valeCreado?.vale_material_detalles?.[0]?.id_detalle_material) {
          const idDetalle = valeCreado.vale_material_detalles[0].id_detalle_material;
          await supabase
            .from("vale_material_detalles")
            .update({
              foto_evidencia_url: fotoUrl,
              // Si tenemos coordenadas, guardarlas junto con la foto
              // las columnas latitud_registro/longitud_registro están en viajes, pero
              // guardaremos ubicacion en la tabla de detalles si existen columnas
              // Alternativamente, solo actualizamos la foto aquí
            })
            .eq("id_detalle_material", idDetalle);

          // Refrescar el objeto local para incluir la foto
          setValeCreado((prev) => {
            if (!prev) return prev;
            const copia = { ...prev };
            if (copia.vale_material_detalles && copia.vale_material_detalles[0]) {
              copia.vale_material_detalles[0] = {
                ...copia.vale_material_detalles[0],
                foto_evidencia_url: fotoUrl,
              };
            }
            return copia;
          });
        }
      } catch (uErr) {
        console.warn("No se pudo actualizar la foto en la DB:", uErr.message || uErr);
      }

      await generarYCompartirPDFTicket(valeCreado);
      setValeParaImpresion(valeCreado);
      setShowModalImpresion(true);
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo generar o compartir el PDF. Intenta de nuevo.",
      );
    }
  };

  const cerrarModalImpresion = () => {
    setShowModalImpresion(false);
    setValeParaImpresion(null);
    resetForm();
    resetEvidencia();
    resetVehiculoQR();
    navigation.navigate("ValesMain");
  };

  if (loadingCatalogos || loadingObras) {
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
      <KeyboardAvoidingScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <SectionHeader
            title="Datos de Vale"
            infoTitle="Datos de Vale"
            infoMessage="Información del material asfáltico a acarrear. Los campos de obra y empresa se llenan automáticamente según tu perfil."
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
            items={materialesFiltrados.map((m) => ({
              id: m.id_material,
              label: m.material,
            }))}
            placeholder="Selecciona el material"
            error={errors.materialId}
          />

          <FormInput
            label="Banco"
            value={
              bancos.find((b) => b.id_banco === formData.bancoId)?.banco ||
              "Cargando..."
            }
            onChangeText={() => {}}
            editable={false}
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

          <FormInput
            label="Cantidad de material (m³)"
            value={formData.cantidadMaterial}
            onChangeText={(value) => {
              // Permitir punto decimal, pero solo uno
              let sanitized = value.replace(/[^0-9.]/g, "");
              const parts = sanitized.split(".");
              if (parts.length > 2) {
                sanitized = parts[0] + "." + parts.slice(1).join("");
              }
              setFormData({ ...formData, cantidadMaterial: sanitized });
            }}
            placeholder="Ej: 12.5"
            keyboardType="numeric"
            error={errors.cantidadMaterial}
          />

          <PrimaryButton
            title="Asignar Vehículo"
            onPress={() => {
              if (!formData.sindicatoId) {
                Alert.alert(
                  "Selecciona un sindicato",
                  "Debes seleccionar el sindicato antes de asignar el vehículo.",
                );
                return;
              }

              resetVehiculoQR();
              if (HIDE_ON_WEB) {
                setShowModalBuscarVehiculo(true);
                return;
              }
              crossAlert(
                "Asignar Vehículo",
                "¿Cómo deseas buscar el vehículo?",
                [
                  {
                    text: "Escanear QR",
                    onPress: () => scannerVehiculo.abrirScanner(),
                  },
                  {
                    text: "Buscar por placas",
                    onPress: () => setShowModalBuscarVehiculo(true),
                  },
                  { text: "Cancelar", style: "cancel" },
                ],
              );
            }}
            icon="truck-plus"
            backgroundColor={colors.secondary}
            disabled={!formData.sindicatoId}
          />

          <FormInput
            label="Placas"
            value={formData.vehiculoPlacas}
            onChangeText={() => {}}
            placeholder="Escanea un vehículo"
            editable={false}
            error={errors.vehiculoId}
          />

          <FormInput
            label="Operador"
            value={formData.selectedOperador?.nombre_completo || ""}
            onChangeText={() => {}}
            placeholder="Escanea un vehículo"
            editable={false}
            error={errors.operadorId}
          />

          <PrimaryButton
            title="Cambiar Operador"
            onPress={() => {
              if (!formData.sindicatoId) {
                Alert.alert(
                  "Selecciona un sindicato",
                  "Debes seleccionar el sindicato antes de cambiar el operador.",
                );
                return;
              }
              setShowModalSeleccionarOperador(true);
            }}
            icon="account-hard-hat"
            backgroundColor={colors.secondary}
            disabled={!formData.sindicatoId}
          />

          <FormInput
            label="Notas"
            value={formData.notasAdicionales}
            onChangeText={(value) =>
              setFormData({ ...formData, notasAdicionales: value })
            }
            placeholder="Notas adicionales"
            multiline={true}
            numberOfLines={3}
          />

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

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Crear Vale"
            onPress={handleCrearVale}
            loading={submitting}
            icon="check-circle"
            backgroundColor={colors.accent}
          />
        </View>

        {valeCreado && HIDE_ON_WEB && (
          <View style={styles.section}>
            <SectionHeader title="Vale Creado" infoTitle="Vale Creado" />
            <Text style={{ color: colors.textPrimary, fontSize: 15 }}>
              Vale creado: folio {folioCreado}
            </Text>
          </View>
        )}

        {valeCreado && !HIDE_ON_WEB && (
          <View style={styles.section}>
            <SectionHeader
              title="Verificación de Foto"
              infoTitle="Verificación de Foto"
              infoMessage="Toma la evidencia del vale asfáltico antes de compartir el PDF."
            />

            <EvidenciaCaptura
              folioVale={folioCreado}
              foto={foto}
              fotoUrl={fotoUrl}
              ubicacion={ubicacion}
              distanciaObra={null}
              dentroDelRadio={dentroDelRadio}
              obraTieneCoordenadas={obraTieneCoordenadas}
              loadingFoto={loadingFoto}
              loadingUbicacion={loadingUbicacion}
              errorFoto={errorFoto}
              errorUbicacion={errorUbicacion}
              onTomarFoto={tomarFoto}
              onCapturarUbicacion={capturarUbicacion}
              radioConfigurado={radioConfigurado}
            />

            <View style={styles.buttonContainer}>
              <PrimaryButton
                title="Compartir PDF por WhatsApp"
                onPress={handleCompartirPDF}
                loading={false}
                icon="share-variant"
                backgroundColor={colors.secondary}
                disabled={!fotoUrl}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingScrollView>

      <QRScannerModal
        visible={scannerVehiculo.scannerVisible}
        scanning={scannerVehiculo.scanning}
        onBarCodeScanned={scannerVehiculo.handleBarCodeScanned}
        onClose={scannerVehiculo.cerrarScanner}
      />

      <ModalBuscarVehiculoPlacas
        visible={showModalBuscarVehiculo}
        onClose={() => setShowModalBuscarVehiculo(false)}
        onVehiculoSeleccionado={handleVehiculoManual}
        expectedSindicatoId={formData.sindicatoId}
      />

      <ModalSeleccionarOperador
        visible={showModalSeleccionarOperador}
        operadores={operadoresDelSindicato}
        sindicatoNombre={sindicatoSeleccionadoNombre}
        asignando={false}
        onSeleccionar={handleOperadorSeleccionado}
        onCancelar={() => setShowModalSeleccionarOperador(false)}
      />

      <ModalImprimirTicketRenta
        visible={showModalImpresion}
        valeData={valeParaImpresion}
        generarLineas={
          BLUETOOTH_ENABLED && generarTicketMaterial && valeParaImpresion
            ? () => generarTicketMaterial(valeParaImpresion)
            : undefined
        }
        resumenDatos={
          valeParaImpresion
            ? {
                folio: valeParaImpresion.folio,
                operador: valeParaImpresion.operadores?.nombre_completo,
                placas: valeParaImpresion.vehiculos?.placas,
                descripcion: `${valeParaImpresion.vale_material_detalles?.[0]?.material?.material ?? "Material"} — ${valeParaImpresion.vale_material_detalles?.[0]?.bancos?.banco ?? "Banco"}`,
              }
            : undefined
        }
        onImpreso={cerrarModalImpresion}
        onSinImpresora={cerrarModalImpresion}
      />
    </View>
  );
};

export default ValeMaterialAsfalticoScreen;

const styles = {
  ...commonStyles,
};
