/**
 * componets/acarreos/SeccionValesPorEstado.js
 *
 * Una categoria de vales (Material, Renta, Pipas de Agua) con sus cinco
 * subsecciones por estado (En Proceso, Emitidos, Verificados, Conciliados,
 * Cancelados), cada una colapsable y paginada.
 *
 * Extraido de AcarreosScreen para no repetir el bloque una vez por categoria.
 * Comportamiento identico al original: Verificados/Conciliados solo para
 * Administrador, Cancelados oculto para Checador, y forceExpanded ligado a la
 * busqueda (cuando no hay busqueda cae al estado interno de CollapsibleSection,
 * asi que "En Proceso" sigue abierto por defecto).
 */

import React from "react";
import { View, Text, FlatList } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { commonStyles, listScreenStyles } from "../../styles";
import CollapsibleSection from "../common/CollapsibleSection";
import BotonVerMas from "../common/BotonVerMas";
import ValeCard from "./ValeCard";

const EmptyState = ({ icon, text }) => (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons name={icon} size={50} color={colors.textSecondary} />
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

const SeccionValesPorEstado = ({
  titulo,
  nombreTipo,
  emptyIcon,
  pag,
  separado,
  esAdministrador,
  esChecador,
  searchQuery,
  onOpenVale,
}) => {
  const hayBusqueda = !!searchQuery.trim();

  const subsecciones = [
    {
      key: "enProceso",
      title: "En Proceso",
      icon: "progress-clock",
      color: colors.warning,
      defaultCollapsed: false,
      palabra: "en proceso",
      mostrar: true,
    },
    {
      key: "emitidos",
      title: "Emitidos",
      icon: "check-circle",
      color: colors.accent,
      defaultCollapsed: true,
      palabra: "emitidos",
      mostrar: true,
    },
    {
      key: "verificados",
      title: "Verificados",
      icon: "check-decagram",
      color: colors.info,
      defaultCollapsed: true,
      palabra: "verificados",
      mostrar: esAdministrador,
    },
    {
      key: "conciliados",
      title: "Conciliados",
      icon: "currency-usd",
      color: colors.success,
      defaultCollapsed: true,
      palabra: "conciliados",
      mostrar: esAdministrador,
    },
    {
      key: "cancelados",
      title: "Cancelados",
      icon: "cancel",
      color: colors.danger,
      defaultCollapsed: true,
      palabra: "cancelados",
      mostrar: !esChecador,
    },
  ];

  const renderValeItem = ({ item }) => (
    <ValeCard vale={item} onPress={onOpenVale} />
  );

  return (
    <View style={styles.section}>
      <Text style={styles.categoryTitle}>{titulo}</Text>

      {subsecciones
        .filter((s) => s.mostrar)
        .map((s) => {
          const seccionPag = pag[s.key];
          const emptyText = hayBusqueda
            ? `No se encontraron vales ${s.palabra}`
            : `No hay vales de ${nombreTipo} ${s.palabra}`;

          return (
            <CollapsibleSection
              key={s.key}
              title={s.title}
              icon={s.icon}
              count={separado[s.key].length}
              defaultCollapsed={s.defaultCollapsed}
              forceExpanded={hayBusqueda}
              iconColor={s.color}
              badgeColor={s.color}
            >
              <FlatList
                data={seccionPag.items}
                renderItem={renderValeItem}
                keyExtractor={(item) => item.id_vale.toString()}
                ListEmptyComponent={() => (
                  <EmptyState icon={emptyIcon} text={emptyText} />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
              {seccionPag.hayMas && (
                <BotonVerMas
                  onPress={seccionPag.cargarMas}
                  totalMostrados={seccionPag.items.length}
                  total={seccionPag.total}
                />
              )}
            </CollapsibleSection>
          );
        })}
    </View>
  );
};

export default SeccionValesPorEstado;

const styles = {
  ...commonStyles,
  ...listScreenStyles,
};
