import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import styles from "./styles";

// Este componente es reutilizable para cualquier botón de opción
const ValeOptionButton = ({
  iconName, // Nombre del icono (ej: "attach-money")
  text, // Texto del botón (ej: "Renta")
  onPress, // Función que se ejecuta al presionar
  color = "#4CAF50", // Color del círculo (verde por defecto)
}) => {
  return (
    <TouchableOpacity style={styles.botonOpcion} onPress={onPress}>
      <View style={[styles.iconoContainer, { backgroundColor: color }]}>
        <Icon name={iconName} size={37} color={"white"} />
      </View>
      <Text style={styles.textoOpcion}>{text}</Text>
    </TouchableOpacity>
  );
};

export default ValeOptionButton;
