import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import styles from "./styles";

const ValeOptionButton = ({
  iconName,
  text,
  onPress,
  color = colors.primary, // Color por defecto de la paleta
}) => {
  return (
    <TouchableOpacity style={styles.botonOpcion} onPress={onPress}>
      <View style={[styles.iconoContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={iconName} size={37} color="white" />
      </View>
      <Text style={styles.textoOpcion}>{text}</Text>
    </TouchableOpacity>
  );
};

export default ValeOptionButton;
