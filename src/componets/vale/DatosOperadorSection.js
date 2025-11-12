/**
 * components/vale/DatosOperadorSection.js
 *
 * Sección de formulario para capturar datos del operador
 *
 * PROPÓSITO:
 * - Autocompletado de operadores y vehículos desde BD
 * - Filtrado por sindicato automático
 * - Validaciones incluidas
 *
 * PROPS:
 * - selectedOperador: object - Operador seleccionado completo
 * - selectedVehiculo: object - Vehículo seleccionado completo
 * - onSelectOperador: function
 * - onSelectVehiculo: function
 * - notasAdicionales: string
 * - onChangeNotas: function
 * - errors: object
 * - sindicatoId: number - Para filtrar operadores/vehículos
 * - operadores: array - Lista de operadores
 * - vehiculos: array - Lista de vehículos
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import SectionHeader from "../common/SectionHeader";
import FormInput from "../forms/FormInput";
import FormAutocomplete from "../forms/FormAutocomplete";

const DatosOperadorSection = ({
  selectedOperador,
  selectedVehiculo,
  onSelectOperador,
  onSelectVehiculo,
  notasAdicionales,
  onChangeNotas,
  errors = {},
  sindicatoId,
  operadores = [],
  vehiculos = [],
}) => {
  // Filtrar operadores por sindicato seleccionado
  const operadoresFiltrados = useMemo(() => {
    if (!sindicatoId) return operadores;
    return operadores.filter((op) => op.id_sindicato === sindicatoId);
  }, [operadores, sindicatoId]);

  // Filtrar vehículos por sindicato seleccionado
  const vehiculosFiltrados = useMemo(() => {
    if (!sindicatoId) return vehiculos;
    return vehiculos.filter((v) => v.id_sindicato === sindicatoId);
  }, [vehiculos, sindicatoId]);

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Datos de Operador"
        infoTitle="Datos de Operador"
        infoMessage="Información del operador que realizará el trabajo. El operador pertenece a otra empresa externa."
      />

      <FormAutocomplete
        label="Nombre del Operador"
        value={selectedOperador?.id_operador}
        onSelect={onSelectOperador}
        items={operadoresFiltrados}
        displayField="nombre_completo"
        valueField="id_operador"
        placeholder="Buscar operador..."
        error={errors.operadorId}
      />

      <FormAutocomplete
        label="Placas del Vehículo"
        value={selectedVehiculo?.id_vehiculo}
        onSelect={onSelectVehiculo}
        items={vehiculosFiltrados}
        displayField="placas"
        valueField="id_vehiculo"
        placeholder="Buscar placas..."
        error={errors.vehiculoId}
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
