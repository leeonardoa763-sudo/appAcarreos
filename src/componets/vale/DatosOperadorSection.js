/**
 * components/vale/DatosOperadorSection.js
 *
 * Sección de formulario para capturar datos del operador
 *
 * PROPÓSITO:
 * - Capturar nombre, placas y notas del operador
 * - Reutilizable en vales de Renta y Material
 * - Validaciones incluidas
 *
 * USADO EN:
 * - ValeRentaScreen
 * - ValeMaterialScreen
 *
 * PROPS:
 * - operadorNombre: string
 * - operadorPlacas: string
 * - notasAdicionales: string
 * - onChangeNombre: function
 * - onChangePlacas: function
 * - onChangeNotas: function
 * - errors: object
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import SectionHeader from "../common/SectionHeader";
import FormInput from "../forms/FormInput";

const DatosOperadorSection = ({
  operadorNombre,
  operadorPlacas,
  notasAdicionales,
  onChangeNombre,
  onChangePlacas,
  onChangeNotas,
  errors = {},
}) => {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Datos de Operador"
        infoTitle="Datos de Operador"
        infoMessage="Información del operador que realizará el trabajo. El operador pertenece a otra empresa externa."
      />

      <FormInput
        label="Nombre"
        value={operadorNombre}
        onChangeText={onChangeNombre}
        placeholder="Ej: Juan Pérez"
        error={errors.operadorNombre}
      />

      <FormInput
        label="Placas"
        value={operadorPlacas}
        onChangeText={onChangePlacas}
        placeholder="Ej: ABC-123-4"
        error={errors.operadorPlacas}
      />

      <FormInput
        label="Notas Adicionales (Opcional)"
        value={notasAdicionales}
        onChangeText={onChangeNotas}
        placeholder="Observaciones adicionales..."
        multiline={true}
        numberOfLines={3}
      />
    </View>
  );
};

export default DatosOperadorSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
  },
});
