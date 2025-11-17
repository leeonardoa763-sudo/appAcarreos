/**
 * components/common/CollapsibleSection.js
 *
 * Sección colapsable con header clickeable
 *
 * PROPÓSITO:
 * - Mostrar/ocultar contenido al hacer clic en el header
 * - Animación suave de expansión/colapso
 * - Indicador visual del estado (flecha arriba/abajo)
 * - Contador de elementos en la sección
 *
 * USADO EN:
 * - AcarreosScreen (secciones de vales completados)
 *
 * PROPS:
 * - title: string - Título de la sección
 * - icon: string - Nombre del icono (MaterialCommunityIcons)
 * - count: number - Cantidad de elementos
 * - defaultCollapsed: boolean - Si inicia colapsado (default: true)
 * - iconColor: string - Color del icono
 * - badgeColor: string - Color del badge contador
 * - children: ReactNode - Contenido de la sección
 *
 * EJEMPLO DE USO:
 * <CollapsibleSection
 *   title="Renta - Completados"
 *   icon="check-circle"
 *   count={5}
 *   defaultCollapsed={true}
 *   iconColor={colors.secondary}
 * >
 *   <ValeCard vale={vale1} />
 *   <ValeCard vale={vale2} />
 * </CollapsibleSection>
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CollapsibleSection = ({
  title,
  icon,
  count = 0,
  defaultCollapsed = true,
  iconColor = colors.primary,
  badgeColor = colors.primary,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(!collapsed);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleCollapse}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
          <Text style={styles.title}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name={collapsed ? "chevron-down" : "chevron-up"}
          size={24}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {!collapsed && <View style={styles.content}>{children}</View>}
    </View>
  );
};

export default CollapsibleSection;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "bold",
  },
  content: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    marginTop: -8,
  },
});
