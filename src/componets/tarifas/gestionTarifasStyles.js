// src/componets/tarifas/gestionTarifasStyles.js
// Estilos compartidos por GestionTarifasScreen, GestionTarifasFilas y GestionTarifasModales.
import { StyleSheet } from "react-native";
import { colors } from "../../config/colors";

export const estilosTarifas = StyleSheet.create({
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

  // ─── Pestanas Material / Renta ────────────────────────────────────────────
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

  // ─── Selector de obra ─────────────────────────────────────────────────────
  selectorObra: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectorObraTextos: {
    flex: 1,
  },
  selectorObraEtiqueta: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectorObraValor: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
  selectorObraPlaceholder: {
    color: colors.textSecondary,
    fontWeight: "600",
  },

  tabSubtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 14,
    marginBottom: 10,
    lineHeight: 17,
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

  listaContenido: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },

  // ─── Tarjeta de combinacion ───────────────────────────────────────────────
  fila: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  filaConTarifaObra: {
    borderColor: colors.primary,
  },
  filaEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    gap: 3,
  },
  filaNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  filaSubtexto: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeDefault: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  badgeObra: {
    backgroundColor: "#FDEEE7",
    borderColor: colors.primary,
  },
  badgeTexto: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  badgeTextoDefault: {
    color: colors.textSecondary,
  },
  badgeTextoObra: {
    color: colors.primary,
  },

  // Rejilla de valores de la tarifa vigente
  valoresRejilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  valorChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  valorChipEtiqueta: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  valorChipValor: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 1,
  },

  sinDefault: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FDF3E3",
    borderWidth: 1,
    borderColor: colors.warning,
  },
  sinDefaultTexto: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: colors.warning,
  },

  accionesRow: {
    flexDirection: "row",
    gap: 8,
  },
  btnAccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnAsignar: {
    flex: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  btnAsignarTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface,
  },
  btnEditar: {
    flex: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
  },
  btnEditarTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.secondary,
  },
  btnQuitar: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnQuitarTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.danger,
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

  // ─── Modales ──────────────────────────────────────────────────────────────
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
    maxHeight: "90%",
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
  modalHeaderTextos: {
    flex: 1,
  },
  modalTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSubtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCuerpo: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },

  campo: {
    gap: 6,
  },
  campoEtiqueta: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  campoAyuda: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  filaCampos: {
    flexDirection: "row",
    gap: 10,
  },
  campoMitad: {
    flex: 1,
    gap: 6,
  },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActivo: {
    borderColor: colors.secondary,
    backgroundColor: "#F2F7FB",
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  chipTextoActivo: {
    color: colors.secondary,
  },

  avisoDefault: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avisoDefaultTexto: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  errorCaja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FBE9E7",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorCajaTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
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
  btnCancelar: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnCancelarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  btnGuardar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  btnGuardarDeshabilitado: {
    opacity: 0.6,
  },
  btnGuardarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },

  // ─── Selector de obra (modal) ─────────────────────────────────────────────
  opcionObra: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  opcionObraActiva: {
    borderColor: colors.secondary,
    backgroundColor: "#F2F7FB",
  },
  opcionObraTextos: {
    flex: 1,
  },
  opcionObraNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  opcionObraMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
