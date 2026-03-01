/**
 * components/acarreos/rentaHelpers/DatosPendientesForm.js
 *
 * Formulario inline para asignar operador y vehículo cuando el vale
 * fue creado sin estos datos (tieneDatosPendientes === true).
 *
 * PROPS:
 * - operadoresFiltrados: array — lista de operadores del sindicato
 * - vehiculosFiltrados: array — lista de vehículos del sindicato
 * - selectedOperador: object | null — operador seleccionado
 * - selectedVehiculo: object | null — vehículo seleccionado
 * - onSelectOperador: function — setter del operador
 * - onSelectVehiculo: function — setter del vehículo
 * - onGuardar: function — callback al presionar guardar
 * - saving: boolean — estado de carga al guardar
 */

import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import { rentaStyles as styles } from "./rentaStyles";
import FormAutocomplete from "../../forms/FormAutocomplete";

const DatosPendientesForm = ({
  operadoresFiltrados,
  vehiculosFiltrados,
  selectedOperador,
  selectedVehiculo,
  onSelectOperador,
  onSelectVehiculo,
  onGuardar,
  saving,
}) => {
  return (
    <View style={styles.datosPendientesInline}>
      <View style={styles.pendienteHeader}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={18}
          color={colors.primary}
        />
        <Text style={styles.pendienteTitulo}>Asignar Operador y Vehículo</Text>
      </View>

      <Text style={styles.pendienteSubtitulo}>
        Requeridos para completar el vale
      </Text>

      <FormAutocomplete
        label="Operador"
        value={selectedOperador?.id_operador}
        onSelect={onSelectOperador}
        items={operadoresFiltrados}
        displayField="nombre_completo"
        valueField="id_operador"
        placeholder="Buscar operador..."
        disabled={saving}
      />

      <FormAutocomplete
        label="Placas del Vehículo"
        value={selectedVehiculo?.id_vehiculo}
        onSelect={onSelectVehiculo}
        items={vehiculosFiltrados}
        displayField="placas"
        valueField="id_vehiculo"
        placeholder="Buscar placas..."
        disabled={saving}
      />

      {selectedVehiculo && (
        <View
          style={[
            styles.capacidadVisor,
            !selectedVehiculo.capacidad_m3 && styles.capacidadVisorAviso,
          ]}
        >
          <Text style={styles.capacidadLabel}>Capacidad del vehículo</Text>
          {selectedVehiculo.capacidad_m3 ? (
            <Text style={styles.capacidadValor}>
              {selectedVehiculo.capacidad_m3} m³
            </Text>
          ) : (
            <Text style={styles.capacidadSinDatos}>
              Sin capacidad configurada
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.botonGuardarDatos,
          (!selectedOperador || !selectedVehiculo) &&
            styles.botonGuardarDatosDisabled,
        ]}
        onPress={onGuardar}
        disabled={saving || !selectedOperador || !selectedVehiculo}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.secondary} />
        ) : (
          <MaterialCommunityIcons
            name="content-save"
            size={16}
            color={colors.secondary}
          />
        )}
        <Text style={styles.botonGuardarDatosTexto}>Guardar datos</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DatosPendientesForm;
