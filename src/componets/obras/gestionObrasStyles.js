// src/componets/obras/gestionObrasStyles.js
// Estilos compartidos por GestionObrasScreen, GestionObrasFilas y ModalAsignacionesUsuario.
import { StyleSheet } from "react-native";
import { colors } from "../../config/colors";

export const estilosObras = StyleSheet.create({
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
    marginBottom: 10,
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
    gap: 10,
  },
  tabTitulo: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tabSubtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 14,
    marginBottom: 8,
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
    marginBottom: 10,
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

  filtrosRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  filtroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filtroChipActivo: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filtroChipTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filtroChipTextoActivo: {
    color: colors.surface,
  },

  listaContenido: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },

  // ─── Tarjeta de obra / usuario ────────────────────────────────────────────
  fila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  filaInactiva: {
    backgroundColor: colors.background,
    borderStyle: "dashed",
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
    gap: 6,
  },
  filaTituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filaNombre: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  filaNombreApagado: {
    color: colors.textSecondary,
  },
  filaSubRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  filaMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  filaSubtexto: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Chip informativo dentro de la tarjeta (CC, empresa, ...)
  dato: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: "100%",
  },
  datoTexto: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  datoFaltante: {
    backgroundColor: "#FDF3E3",
    borderColor: colors.warning,
  },
  datoTextoFaltante: {
    color: colors.warning,
  },

  etiquetaPrueba: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#FDF3E3",
    borderWidth: 1,
    borderColor: colors.warning,
  },
  etiquetaPruebaTexto: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.warning,
  },

  // Pildora de estado que ademas activa/desactiva
  pildoraEstado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pildoraActiva: {
    borderColor: colors.accent,
    backgroundColor: "#EAF6F1",
  },
  pildoraInactiva: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pildoraTexto: {
    fontSize: 11,
    fontWeight: "700",
  },

  contadorObras: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: "#E7EEF5",
  },
  contadorObrasTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.secondary,
  },
  contadorVacio: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  contadorVacioTexto: {
    color: colors.textSecondary,
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

  // ─── Modal de asignaciones ────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  caja: {
    width: "100%",
    maxWidth: 560,
    height: "88%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSubtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalSeleccionable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalSeleccionableActivo: {
    borderColor: colors.secondary,
    backgroundColor: "#F2F7FB",
  },
  modalPie: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalPieTexto: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  btnListo: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  btnListoTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});
