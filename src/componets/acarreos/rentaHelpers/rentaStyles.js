/**
 * components/acarreos/rentaHelpers/rentaStyles.js
 *
 * Estilos compartidos para el módulo de detalle de renta.
 * Usado por todos los componentes dentro de rentaHelpers/
 */

import { StyleSheet } from "react-native";
import { colors } from "../../../config/colors";

export const rentaStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  folio: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },

  // InfoRow
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "30",
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "right",
    flex: 1,
  },

  // Notas
  notasContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  notasHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notasLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginLeft: 8,
  },
  notasText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Tarifas
  totalContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
  },

  // Completar vale
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  bloqueoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3EE",
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  bloqueoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },

  // Datos pendientes
  datosPendientesInline: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  pendienteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  pendienteTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  pendienteSubtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  botonGuardarDatos: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
    marginTop: 4,
  },
  botonGuardarDatosDisabled: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  botonGuardarDatosTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondary,
  },
  capacidadVisor: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  capacidadVisorAviso: {
    borderColor: "#F4A261",
  },
  capacidadLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  capacidadValor: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.secondary,
  },
  capacidadSinDatos: {
    fontSize: 13,
    color: "#F4A261",
    fontStyle: "italic",
  },
  botonCancelar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  textoCancelar: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.danger,
  },
  motivoCancelacionDivider: {
    height: 1,
    backgroundColor: "#FFD0D0",
    marginVertical: 8,
  },
  reimprimirContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  botonReimprimir: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
  },
  botonReimprimirTexto: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  reimprimirAgotado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    backgroundColor: colors.background,
  },
  reimprimirAgotadoTexto: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
});
