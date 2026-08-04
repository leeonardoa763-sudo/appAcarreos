import React from "react";
import { View, Text } from "react-native";
import { colors } from "../../../config/colors";
import styles from "./valeDetalleMaterialStyles";
import BotonAyuda from "../../common/BotonAyuda";
import PrimaryButton from "../../common/PrimaryButton";
import FormInput from "../../forms/FormInput";

const ValeFormCompletarNormal = ({
  savingToneladas,
  onCompletar,
  notasAdicionales,
  onChangeNotas,
  ayudaUrl,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, styles.sectionTitleFlex]}>
          Completar Vale
        </Text>
        <BotonAyuda url={ayudaUrl} />
      </View>

      <FormInput
        label="Notas (opcional)"
        value={notasAdicionales}
        onChangeText={onChangeNotas}
        placeholder=""
        multiline
        maxLength={200}
      />

      <PrimaryButton
        title="Completar Vale"
        onPress={onCompletar}
        loading={savingToneladas}
        icon="check-circle"
        backgroundColor={colors.accent}
      />
    </View>
  );
};

export default ValeFormCompletarNormal;
