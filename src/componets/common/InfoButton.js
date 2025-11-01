//infoButton
//boton de ayuda reutilizable con un signo de interrogacion, sele pone como parametros
//el titulo y el texto que va a llevar
import React from "react";
import { TouchableOpacity, Alert, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const InfoButton = ({
  title,
  message,
  iconSize = 24,
  iconColor = colors.secondary,
}) => {
  const handlePress = () => {
    Alert.alert(title, message, [{ text: "Entendido" }]);
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name="help-circle-outline"
        size={iconSize}
        color={iconColor}
      />
    </TouchableOpacity>
  );
};

export default InfoButton;

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});
