// components/CircularButton.js
import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const CircularButton = ({
  onPress,
  iconName,
  iconSize = 70,
  buttonText,
  backgroundColor = "#035798ff",
  iconColor = "white",
  textColor = "#333",
}) => {
  return (
    <TouchableOpacity style={styles.botonCircular} onPress={onPress}>
      <View style={[styles.iconoBotonContainer, { backgroundColor }]}>
        <Icon name={iconName} size={iconSize} color={iconColor} />
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
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CircularButton;
