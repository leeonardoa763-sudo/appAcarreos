// components/UserProfile.js
import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const UserProfile = ({
  userName = "Fernanda",
  iconName = "person",
  iconSize = 50,
}) => {
  const { width } = useWindowDimensions();
  const containerWidth = width * 0.9; // 90% del ancho de la pantalla

  return (
    <View style={[styles.residenteContainer, { width: containerWidth }]}>
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={iconSize} color={"black"} />
      </View>
      <View style={styles.textWrapper}>
        <Text
          style={styles.residenteText}
          numberOfLines={1}
          ellipsizeMode="tail"
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          maxFontSizeMultiplier={1.2}
        >
          {userName}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  residenteContainer: {
    backgroundColor: "#ffffff",
    marginVertical: 17,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    minHeight: 80,
    maxWidth: "100%",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  textWrapper: {
    flex: 1,
    minWidth: 0, // Importante para que el texto se ajuste
  },
  residenteText: {
    fontSize: 30,
    fontWeight: "bold",
    includeFontPadding: false, // Elimina padding interno de la fuente
  },
});

export default UserProfile;
