import React from "react";
import { View, Text } from "react-native";
import { colors } from "../../../config/colors";
import styles from "./valeDetalleMaterialStyles";
import EvidenciaCaptura from "../../vale/EvidenciaCaptura";
import PrimaryButton from "../../common/PrimaryButton";

const ValeFormCompletarNormal = ({
  savingToneladas,
  onCompletar,
  evidenciaLista,
  obraTieneCoordenadas,
  dentroDelRadio,
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
        Captura la evidencia para completar el vale
      </Text>

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
          !evidenciaLista || (obraTieneCoordenadas && dentroDelRadio === false)
        }
        icon="check-circle"
        backgroundColor={colors.accent}
      />
    </View>
  );
};

export default ValeFormCompletarNormal;
