import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon = "check-circle",
  backgroundColor = colors.accent,
  textColor = colors.surface,
}) => {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: backgroundColor },
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          <MaterialCommunityIcons name={icon} size={24} color={textColor} />
          <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    elevation: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
});
