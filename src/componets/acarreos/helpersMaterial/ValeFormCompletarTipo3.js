import React from "react";
import { View, Text } from "react-native";
import { colors } from "../../../config/colors";
import styles from "./valeDetalleMaterialStyles";
import FormDecimalInput from "../../forms/FormDecimalInput";
import FormInput from "../../forms/FormInput";
import EvidenciaCaptura from "../../vale/EvidenciaCaptura";
import PrimaryButton from "../../common/PrimaryButton";

const ValeFormCompletarTipo3 = ({
  detalleMaterial,
  cantidadConfirmada,
  setCantidadConfirmada,
  notasAdicionales,
  setNotasAdicionales,
  esChecador,
  savingToneladas,
  onCompletar,
  evidenciaLista,
  obraTieneCoordenadas,
  dentroDelRadio,
  // Props de evidencia
  foto,
  fotoUrl,
  ubicacion,
  distanciaObra,
  radioConfigurado,
  loadingFoto,
  loadingUbicacion,
  errorFoto,
  errorUbicacion,
  onTomarFoto,
  onCapturarUbicacion,
  folioVale,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Confirmar Cantidad</Text>
      <Text style={styles.sectionSubtitle}>
        Cantidad pedida actual: {detalleMaterial.cantidad_pedida_m3} m³
      </Text>
      <Text style={styles.helperText}>
        Confirma la cantidad o ingresa una diferente si es necesario
      </Text>

      <FormDecimalInput
        label="Cantidad Final (m³)"
        value={cantidadConfirmada}
        onChange={setCantidadConfirmada}
        min={0.01}
        max={999}
        decimalPlaces={2}
        placeholder="0.00"
        suffix="m³"
        disabled={esChecador}
      />

      <FormInput
        label="Notas Adicionales"
        value={notasAdicionales}
        onChangeText={setNotasAdicionales}
        placeholder="Observaciones del viaje (opcional)"
        multiline
        maxLength={200}
      />

      {esChecador && (
        <Text style={styles.helperText}>
          Solo el residente puede modificar la cantidad final
        </Text>
      )}

      <EvidenciaCaptura
        folioVale={folioVale}
        foto={foto}
        fotoUrl={fotoUrl}
        ubicacion={ubicacion}
        distanciaObra={distanciaObra}
        dentroDelRadio={dentroDelRadio}
        obraTieneCoordenadas={obraTieneCoordenadas}
        radioConfigurado={radioConfigurado}
        loadingFoto={loadingFoto}
        loadingUbicacion={loadingUbicacion}
        errorFoto={errorFoto}
        errorUbicacion={errorUbicacion}
        onTomarFoto={onTomarFoto}
        onCapturarUbicacion={onCapturarUbicacion}
      />

      <PrimaryButton
        title="Completar Vale"
        onPress={onCompletar}
        loading={savingToneladas}
        disabled={
          !cantidadConfirmada ||
          cantidadConfirmada <= 0 ||
          !evidenciaLista ||
          (obraTieneCoordenadas && dentroDelRadio === false)
        }
        icon="check-circle"
        backgroundColor={colors.accent}
      />
    </View>
  );
};

export default ValeFormCompletarTipo3;
