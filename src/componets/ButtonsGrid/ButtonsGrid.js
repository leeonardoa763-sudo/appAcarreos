// components/ButtonsGrid.js
import React from "react";
import { View, StyleSheet } from "react-native";
import CircularButton from "./CircularButton";

const ButtonsGrid = ({ buttons = [] }) => {
  return (
    <View style={styles.botonesContainer}>
      {buttons.map((button, index) => (
        <CircularButton
          key={index}
          onPress={button.onPress}
          iconName={button.iconName}
          iconSize={button.iconSize}
          buttonText={button.buttonText}
          backgroundColor={button.backgroundColor}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  botonesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 15,
    flexWrap: "wrap",
  },
});

export default ButtonsGrid;
