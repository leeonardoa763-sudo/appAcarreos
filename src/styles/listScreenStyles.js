/**
 * listScreenStyles.js
 *
 * ESTILOS ESPECÍFICOS PARA PANTALLAS DE LISTADO Y ACARREOS
 *
 * CONTIENE:
 * - Estilos específicos para listas y grids
 * - Layout de secciones de acarreos
 * - Componentes de búsqueda y filtros
 *
 * USADO EN:
 * - AcarreosScreen.js
 * - Futuras pantallas de listados
 */

import { StyleSheet } from "react-native";
import { colors } from "../config/colors";

export const listScreenStyles = StyleSheet.create({
  // Hereda container y contentContainer de commonStyles
  // pero los redefine si son diferentes

  contentContainer: {
    paddingBottom: 20,
  },

  // Búsqueda y filtros
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchResults: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Secciones y categorías específicas de acarreos
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },

  // Badges y contadores
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  badgeText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "bold",
  },

  // Contenedores de listas específicos
  valesContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
});
