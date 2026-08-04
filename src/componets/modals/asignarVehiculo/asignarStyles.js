import { StyleSheet } from "react-native";
import { colors } from "../../../config/colors";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Lado derecho del header: ayuda + cerrar. Van juntos en una fila porque el
  // header usa space-between; como tercer hijo suelto quedarian repartidos.
  headerAcciones: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.surface,
  },
  headerCerrar: {
    padding: 4,
  },

  scrollContent: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
  },

  // Estados
  estadoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
    paddingHorizontal: 32,
  },
  idleIconWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 50,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  estadoTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  estadoSubtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  errorTexto: {
    color: colors.danger,
  },
  botonEscanear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginTop: 8,
  },
  botonEscanearTexto: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },

  // Card vehículo
  cardVehiculo: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    gap: 10,
  },
  cardVehiculoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardVehiculoIcono: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
  },
  cardVehiculoInfo: {
    flex: 1,
  },
  cardVehiculoPlacas: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  cardVehiculoCapacidad: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardRescanBtn: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  cardVehiculoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  cardVehiculoOperador: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  sinOperador: {
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  cardVehiculoActivos: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  foliosActivosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  folioBadge: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  folioBadgeTexto: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "600",
  },
  folioBadgePeligro: {
    borderColor: colors.danger,
    backgroundColor: "#FFF0F0",
  },
  folioBadgeTextoPeligro: {
    color: colors.danger,
  },

  // Banner límite
  bannerLimite: {
    backgroundColor: "#FFF0F0",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  bannerLimiteTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.danger,
  },
  bannerLimiteTexto: {
    fontSize: 13,
    color: colors.danger,
    textAlign: "center",
    lineHeight: 18,
  },

  // Lista de vales
  listaContainer: {
    gap: 10,
  },
  listaTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    paddingHorizontal: 4,
  },
  sinValesContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  sinValesTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },

  // Grupos
  grupoContainer: {
    gap: 8,
    marginBottom: 8,
  },
  grupoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  grupoTitulo: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  grupoBadge: {
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  grupoBadgeTexto: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Item vale
  itemVale: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  itemValeTipoBar: {
    width: 5,
    alignSelf: "stretch",
  },
  barMaterial: {
    backgroundColor: colors.primary,
  },
  barRenta: {
    backgroundColor: colors.secondary,
  },
  itemValeBody: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  itemValeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemValeFolio: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  itemValeTipoBadge: {
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeMaterial: {
    backgroundColor: "#FFF0EA",
  },
  badgeRenta: {
    backgroundColor: "#EAF0FF",
  },
  itemValeTipoTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  itemValeObra: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemValeMaterial: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemValeEmpresa: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  itemValeBadgePlanta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  itemValeBadgePlantaTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.secondary,
  },
  itemValeBadgeProgramado: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  itemValeBadgeProgramadoTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
});

export default styles;
