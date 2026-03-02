import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import styles from "./valeDetalleMaterialStyles";
import FormAutocomplete from "../../forms/FormAutocomplete";

const ValeDatosPendientes = ({
  selectedOperador,
  setSelectedOperador,
  selectedVehiculo,
  setSelectedVehiculo,
  operadoresFiltrados,
  vehiculosFiltrados,
  savingDatos,
  onGuardar,
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
        onSelect={setSelectedOperador}
        items={operadoresFiltrados}
        displayField="nombre_completo"
        valueField="id_operador"
        placeholder="Buscar operador..."
        disabled={savingDatos}
      />

      <FormAutocomplete
        label="Placas del Vehículo"
        value={selectedVehiculo?.id_vehiculo}
        onSelect={setSelectedVehiculo}
        items={vehiculosFiltrados}
        displayField="placas"
        valueField="id_vehiculo"
        placeholder="Buscar placas..."
        disabled={savingDatos}
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
        disabled={savingDatos || !selectedOperador || !selectedVehiculo}
        activeOpacity={0.7}
      >
        {savingDatos ? (
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

export default ValeDatosPendientes;
