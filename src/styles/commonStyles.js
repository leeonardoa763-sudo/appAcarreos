/**
 * commonStyles.js
 *
 * ESTILOS COMUNES REUTILIZABLES EN TODA LA APLICACIÓN
 *
 * CONTIENE:
 * - Contenedores principales
 * - Estados de UI (loading, error, empty)
 * - Secciones y cards base
 * - Utilidades compartidas
 *
 * USADO EN:
 * - Todas las pantallas y componentes
 */

import { StyleSheet } from "react-native";
import { colors } from "../config/colors";

export const commonStyles = StyleSheet.create({
  // Contenedores principales
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Secciones y cards
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Estados de UI
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colors.danger,
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  buttonContainer: {
    marginTop: 8,
  },

  // Componentes específicos de vales
  infoCopiasContainer: {
    backgroundColor: colors.accent + "20",
    padding: 12,
    borderRadius: 8,
    marginTop: 0,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  infoCopiasText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  infoCopiasDestacado: {
    fontWeight: "bold",
    color: colors.accent,
  },
});
