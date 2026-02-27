// src/componets/stats/StatsFilterBar.js

/**
 * StatsFilterBar
 *
 * Barra de filtros fija para EstadisticasScreen.
 * Misma arquitectura que FilterBar de Acarreos.
 *
 * ESTRUCTURA:
 * - Fila 1: Chips de período (Día, Semana, Mes, Semestre, Año)
 *           Solo uno activo a la vez. Al tocar se aplica de inmediato.
 * - Fila 2: Chips de filtro (Obra, Material, Sindicato) + botón limpiar
 *           Al seleccionar en el dropdown se aplica de inmediato.
 *
 * PROPS:
 * - periodo:         string   — período activo ('dia'|'semana'|'mes'|'semestre'|'año')
 * - onPeriodoChange: function — callback al cambiar período
 * - filters:         object   — { obraId, obraLabel, materialId, materialLabel, sindicatoId, sindicatoLabel }
 * - setFilter:       function — (key, value, label) => void
 * - clearFilters:    function
 * - activeCount:     number
 * - obras:           array    — [{ id, nombre }]
 * - materiales:      array    — [{ id_material, material }]
 * - sindicatos:      array    — [{ id_sindicato, sindicato }]
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

// ─── Períodos disponibles ─────────────────────────────────────────────────────

const PERIODOS = [
  { id: "dia", label: "Día", icon: "calendar-today" },
  { id: "semana", label: "Semana", icon: "calendar-week" },
  { id: "mes", label: "Mes", icon: "calendar-month" },
  { id: "semestre", label: "Semestre", icon: "calendar-multiple" },
  { id: "año", label: "Año", icon: "calendar" },
];

// ─── Chip de período ──────────────────────────────────────────────────────────

const PeriodoChip = ({ id, label, icon, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons
      name={icon}
      size={15}
      color={active ? colors.surface : colors.textSecondary}
      style={styles.chipIcon}
    />
    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Chip de filtro (con X para limpiar) ─────────────────────────────────────

const FilterChip = ({ icon, label, active, onPress, onClear }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons
      name={icon}
      size={15}
      color={active ? colors.surface : colors.textSecondary}
      style={styles.chipIcon}
    />
    <Text
      style={[styles.chipLabel, active && styles.chipLabelActive]}
      numberOfLines={1}
    >
      {label}
    </Text>
    {active && (
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onClear();
        }}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
        style={styles.chipClear}
      >
        <MaterialCommunityIcons name="close" size={13} color={colors.surface} />
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

// ─── Dropdown inline ──────────────────────────────────────────────────────────

const InlineDropdown = ({
  items,
  selectedId,
  onSelect,
  displayField,
  valueField,
  placeholder,
}) => {
  const [searchText, setSearchText] = useState("");

  const filtered = searchText.trim()
    ? items.filter((i) =>
        i[displayField]?.toLowerCase().includes(searchText.toLowerCase()),
      )
    : items;

  return (
    <View style={styles.dropdown}>
      {/* Buscador interno */}
      <View style={styles.dropdownSearch}>
        <MaterialCommunityIcons
          name="magnify"
          size={16}
          color={colors.textSecondary}
        />
        <TextInput
          style={styles.dropdownSearchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={`Buscar ${placeholder}...`}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <MaterialCommunityIcons
              name="close-circle"
              size={15}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de opciones */}
      <ScrollView
        style={styles.dropdownList}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <Text style={styles.dropdownEmpty}>Sin resultados</Text>
        ) : (
          filtered.map((item) => {
            const isSelected = item[valueField] === selectedId;
            return (
              <TouchableOpacity
                key={item[valueField]?.toString() ?? Math.random().toString()}
                style={[
                  styles.dropdownItem,
                  isSelected && styles.dropdownItemSelected,
                ]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    isSelected && styles.dropdownItemTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {item[displayField]}
                </Text>
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const StatsFilterBar = ({
  periodo,
  onPeriodoChange,
  filters,
  setFilter,
  clearFilters,
  activeCount,
  obras = [],
  materiales = [],
  sindicatos = [],
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const closeAll = () => setOpenDropdown(null);

  // Configuración de chips de filtro
  const filterChips = [
    {
      key: "obra",
      icon: "office-building",
      label: filters.obraLabel || "Obra",
      active: filters.obraId !== null,
      onPress: () => toggleDropdown("obra"),
      onClear: () => {
        setFilter("obraId", null, null);
        closeAll();
      },
    },
    {
      key: "material",
      icon: "package-variant",
      label: filters.materialLabel || "Material",
      active: filters.materialId !== null,
      onPress: () => toggleDropdown("material"),
      onClear: () => {
        setFilter("materialId", null, null);
        closeAll();
      },
    },
    {
      key: "sindicato",
      icon: "account-group",
      label: filters.sindicatoLabel || "Sindicato",
      active: filters.sindicatoId !== null,
      onPress: () => toggleDropdown("sindicato"),
      onClear: () => {
        setFilter("sindicatoId", null, null);
        closeAll();
      },
    },
  ];

  return (
    <View style={styles.wrapper}>
      {/* ── Fila 1: Chips de período ─────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodoRow}
        keyboardShouldPersistTaps="handled"
      >
        {PERIODOS.map((p) => (
          <PeriodoChip
            key={p.id}
            id={p.id}
            label={p.label}
            icon={p.icon}
            active={periodo === p.id}
            onPress={() => {
              closeAll();
              onPeriodoChange(p.id);
            }}
          />
        ))}
      </ScrollView>

      {/* Separador entre filas */}
      <View style={styles.rowDivider} />

      {/* ── Fila 2: Chips de filtro + botón limpiar ──────────────────────── */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          keyboardShouldPersistTaps="handled"
        >
          {filterChips.map((chip) => (
            <FilterChip
              key={chip.key}
              icon={chip.icon}
              label={chip.label}
              active={chip.active}
              onPress={chip.onPress}
              onClear={chip.onClear}
            />
          ))}
        </ScrollView>

        {/* Botón limpiar filtros — solo visible si hay activos */}
        {activeCount > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => {
              clearFilters();
              closeAll();
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="filter-off"
              size={18}
              color={colors.surface}
            />
            <Text style={styles.clearAllText}>{activeCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Dropdowns inline ─────────────────────────────────────────────── */}

      {openDropdown === "obra" && (
        <InlineDropdown
          items={obras}
          selectedId={filters.obraId}
          displayField="nombre"
          valueField="id"
          placeholder="obra"
          onSelect={(item) => {
            setFilter("obraId", item.id, item.nombre || item.obra);
            closeAll();
          }}
        />
      )}

      {openDropdown === "material" && (
        <InlineDropdown
          items={materiales}
          selectedId={filters.materialId}
          displayField="nombre"
          valueField="id"
          placeholder="material"
          onSelect={(item) => {
            setFilter("materialId", item.id_material, item.material);
            closeAll();
          }}
        />
      )}

      {openDropdown === "sindicato" && (
        <InlineDropdown
          items={sindicatos}
          selectedId={filters.sindicatoId}
          displayField="nombre"
          valueField="id"
          placeholder="sindicato"
          onSelect={(item) => {
            setFilter("sindicatoId", item.id_sindicato, item.sindicato);
            closeAll();
          }}
        />
      )}
    </View>
  );
};

export default StatsFilterBar;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  // ── Período ────────────────────────────────────────────────────────────────
  periodoRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },

  // Separador entre filas
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
    marginHorizontal: -16,
  },

  // ── Filtros ────────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },

  // Botón limpiar filtros
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
  },
  clearAllText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Chips compartidos ──────────────────────────────────────────────────────
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIcon: {
    marginRight: 1,
  },
  chipLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    maxWidth: 100,
  },
  chipLabelActive: {
    color: colors.surface,
    fontWeight: "600",
  },
  chipClear: {
    marginLeft: 2,
  },

  // ── Dropdown inline ────────────────────────────────────────────────────────
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
    maxHeight: 240,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dropdownSearch: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownEmpty: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 16,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary + "12",
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});
