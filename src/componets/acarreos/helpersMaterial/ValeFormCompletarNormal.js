import React from "react";
import { View, Text } from "react-native";
import { colors } from "../../../config/colors";
import styles from "./valeDetalleMaterialStyles";
import PrimaryButton from "../../common/PrimaryButton";
import FormInput from "../../forms/FormInput";

const ValeFormCompletarNormal = ({
  savingToneladas,
  onCompletar,
  notasAdicionales,
  onChangeNotas,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Completar Vale</Text>

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
