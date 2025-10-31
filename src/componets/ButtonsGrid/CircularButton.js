// components/CircularButton.js
import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const CircularButton = ({
  onPress,
  iconName,
  iconSize = 70,
  buttonText,
  backgroundColor = colors.primary,
  iconColor = "white",
  textColor = colors.textPrimary,
}) => {
  return (
    <TouchableOpacity style={styles.botonCircular} onPress={onPress}>
      <View style={[styles.iconoBotonContainer, { backgroundColor }]}>
        <MaterialCommunityIcons
          name={iconName}
          size={iconSize}
          color={iconColor}
        />
      </View>
      <Text style={[styles.textoBoton, { color: textColor }]}>
        {buttonText}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  botonCircular: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconoBotonContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default CircularButton;
