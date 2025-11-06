import { StyleSheet } from "react-native";
import { colors } from "../config/colors";

export const screenStyles = StyleSheet.create({
  // ESTOS SON LOS NOMBRES ORIGINALES - NO CAMBIAR
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  form: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  footer: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  timeoutWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  timeoutWarningText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
