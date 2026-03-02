import React from "react";
import { View, Text } from "react-native";
import { colors } from "../../../config/colors";
import styles from "./valeDetalleMaterialStyles";
import FormDecimalInput from "../../forms/FormDecimalInput";
import FormInput from "../../forms/FormInput";
import EvidenciaCaptura from "../../vale/EvidenciaCaptura";
import PrimaryButton from "../../common/PrimaryButton";

const ValeFormCompletarNormal = ({
  pesoToneladas,
  setPesoToneladas,
  folioBanco,
  setFolioBanco,
  notasAdicionales,
  setNotasAdicionales,
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
      <Text style={styles.sectionTitle}>Completar Vale</Text>
      <Text style={styles.sectionSubtitle}>
        Captura el peso y la remision del banco para completar el vale
      </Text>

      <FormDecimalInput
        label="Peso en Toneladas"
        value={pesoToneladas}
        onChange={setPesoToneladas}
        min={0.01}
        max={999}
        decimalPlaces={2}
        placeholder="0.00"
        suffix="ton"
        disabled={false}
      />

      <FormInput
        label="Remision del Banco"
        value={folioBanco}
        onChangeText={setFolioBanco}
        placeholder="Ej: 123456789"
        keyboardType="default"
        editable={true}
        maxLength={20}
      />

      <FormInput
        label="Notas Adicionales"
        value={notasAdicionales}
        onChangeText={setNotasAdicionales}
        placeholder="Observaciones del viaje (opcional)"
        multiline
        maxLength={200}
      />

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
          !pesoToneladas ||
          pesoToneladas <= 0 ||
          !folioBanco ||
          folioBanco.trim() === "" ||
          !evidenciaLista ||
          (obraTieneCoordenadas && dentroDelRadio === false)
        }
        icon="check-circle"
        backgroundColor={colors.accent}
      />

      <Text style={styles.helperText}>
        Ambos campos son requeridos para completar el vale
      </Text>
    </View>
  );
};

export default ValeFormCompletarNormal;
