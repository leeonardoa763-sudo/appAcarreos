import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InfoButton from "./InfoButton";
import { colors } from "../../config/colors";

const SectionHeader = ({
  title,
  infoTitle,
  infoMessage,
  showInfoButton = true,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {showInfoButton && infoTitle && infoMessage && (
        <InfoButton title={infoTitle} message={infoMessage} />
      )}
    </View>
  );
};

export default SectionHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
