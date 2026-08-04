// src/componets/bancos/gestionBancosStyles.js
// Estilos compartidos por GestionBancosScreen y GestionBancosFilas.
import { StyleSheet } from "react-native";
import { colors } from "../../config/colors";

export const estilosBancos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  errorTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  errorDetalle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  btnReintentar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  btnReintentarTexto: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },

  toggleRow: {
    flexDirection: "row",
    margin: 14,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleBtnActivo: {
    backgroundColor: colors.secondary,
  },
  toggleTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  toggleTextoActivo: {
    color: colors.surface,
  },

  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  tabTitulo: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  btnAgregar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  searchRow: {
    paddingHorizontal: 14,
    marginBottom: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },

  listaContenido: {
    padding: 14,
    paddingBottom: 40,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  filaIcono: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  filaTextos: {
    flex: 1,
    gap: 4,
  },
  filaNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  filaSubRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  filaSubtexto: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  badgeAcento: {
    backgroundColor: "#EAF6F1",
    borderColor: colors.accent,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  btnEliminar: {
    padding: 4,
  },

  vacio: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },
  vacioTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
