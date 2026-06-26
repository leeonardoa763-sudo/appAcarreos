// src/componets/acarreos/FilterBar.js

/**
 * FilterBar
 *
 * Barra de filtros para AcarreosScreen.
 *
 * ESTRUCTURA:
 * - Fila 1: SearchBar mejorada con icono de filtros activos
 * - Fila 2: Chips horizontales scrolleables (Hoy, Obra, Material, Sindicato, Operador, Placas)
 * - Cuando un chip tiene dropdown (Obra, Material, etc.) se expande inline debajo
 *
 * PROPS:
 * - searchQuery:    string
 * - onSearchChange: function
 * - filters:        object  (del hook useAcarreosFilters)
 * - setFilter:      function
 * - clearFilters:   function
 * - activeCount:    number
 * - obras:          array   [{id, nombre}]
 * - materiales:     array   [{id_material, material}]
 * - sindicatos:     array   [{id_sindicato, sindicato}]
 * - operadores:     array   [{id_operador, nombre_completo}]
 * - vehiculos:      array   [{id_vehiculo, placas}]
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

// ─── Chip individual ───────────────────────────────────────────────────────────

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

// ─── Dropdown inline ───────────────────────────────────────────────────────────

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
      {/* Buscador interno del dropdown */}
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
                key={item[valueField].toString()}
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

// ─── Dropdown de placas (input libre) ─────────────────────────────────────────

const PlacasDropdown = ({ value, onSelect, vehiculos }) => {
  const [texto, setTexto] = useState(value || "");

  const placasUnicas = vehiculos
    ? [...new Map(vehiculos.map((v) => [v.placas, v])).values()]
    : [];

  const filtered = texto.trim()
    ? placasUnicas.filter((v) =>
        v.placas?.toLowerCase().includes(texto.toLowerCase()),
      )
    : placasUnicas;

  return (
    <View style={styles.dropdown}>
      <View style={styles.dropdownSearch}>
        <MaterialCommunityIcons
          name="car"
          size={16}
          color={colors.textSecondary}
        />
        <TextInput
          style={styles.dropdownSearchInput}
          value={texto}
          onChangeText={(t) => {
            setTexto(t);
            if (t.trim() === "") onSelect(null, null);
          }}
          placeholder="Escribir o seleccionar placas..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {texto.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setTexto("");
              onSelect(null, null);
            }}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={15}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {filtered.length > 0 && (
        <ScrollView
          style={styles.dropdownList}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((v) => {
            const isSelected = v.placas === value;
            return (
              <TouchableOpacity
                key={v.id_vehiculo.toString()}
                style={[
                  styles.dropdownItem,
                  isSelected && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setTexto(v.placas);
                  onSelect(v.placas, v.placas);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    isSelected && styles.dropdownItemTextSelected,
                  ]}
                >
                  {v.placas}
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
          })}
        </ScrollView>
      )}
    </View>
  );
};

// ─── Selector de mes (solo admin) ─────────────────────────────────────────────

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MesSelectorRow = ({ mesSeleccionado, onMesChange }) => {
  const hoy = new Date();
  const esMesActual =
    mesSeleccionado.mes === hoy.getMonth() + 1 &&
    mesSeleccionado.anio === hoy.getFullYear();

  const irMesAnterior = () => {
    const { mes, anio } = mesSeleccionado;
    if (mes === 1) {
      onMesChange({ mes: 12, anio: anio - 1 });
    } else {
      onMesChange({ mes: mes - 1, anio });
    }
  };

  const irMesSiguiente = () => {
    if (esMesActual) return;
    const { mes, anio } = mesSeleccionado;
    if (mes === 12) {
      onMesChange({ mes: 1, anio: anio + 1 });
    } else {
      onMesChange({ mes: mes + 1, anio });
    }
  };

  return (
    <View style={styles.mesSelectorRow}>
      <TouchableOpacity
        onPress={irMesAnterior}
        style={styles.mesFlechaBtn}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="chevron-left" size={22} color={colors.secondary} />
      </TouchableOpacity>

      <Text style={styles.mesTexto}>
        {MESES[mesSeleccionado.mes - 1]} {mesSeleccionado.anio}
      </Text>

      <TouchableOpacity
        onPress={irMesSiguiente}
        style={[styles.mesFlechaBtn, esMesActual && styles.mesFlechaBtnDisabled]}
        activeOpacity={esMesActual ? 1 : 0.7}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={esMesActual ? colors.textSecondary : colors.secondary}
        />
      </TouchableOpacity>
    </View>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────────

const FilterBar = ({
  searchQuery,
  onSearchChange,
  filters,
  setFilter,
  clearFilters,
  activeCount,
  obras = [],
  materiales = [],
  sindicatos = [],
  operadores = [],
  vehiculos = [],
  esChecador = false,
  esAdministrador = false,
  mesSeleccionado = null,
  onMesChange = null,
}) => {
  // Controla qué dropdown está abierto. Solo uno a la vez.
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const closeAll = () => setOpenDropdown(null);

  // ── Helpers para construir items de catálogos ──────────────────────────────

  const obrasItems = obras.map((o) => ({
    id: o.id,
    label: o.nombre || o.obra,
  }));

  // ── Configuración de chips ─────────────────────────────────────────────────

  const chips = [
    // DESPUÉS
    {
      key: "soloHoy",
      icon: "calendar-today",
      label: "Hoy",
      active: filters.soloHoy,
      hasDropdown: false,
      onPress: () => {
        closeAll();
        const nuevoValor = !filters.soloHoy;
        setFilter("soloHoy", nuevoValor);
        if (nuevoValor) setFilter("soloAyer", false);
      },
      onClear: () => {
        setFilter("soloHoy", false);
      },
    },
    {
      key: "soloAyer",
      icon: "calendar-arrow-left",
      label: "Ayer",
      active: filters.soloAyer,
      hasDropdown: false,
      onPress: () => {
        closeAll();
        const nuevoValor = !filters.soloAyer;
        setFilter("soloAyer", nuevoValor);
        if (nuevoValor) setFilter("soloHoy", false);
      },
      onClear: () => {
        setFilter("soloAyer", false);
      },
    },
    {
      key: "obra",
      icon: "office-building",
      label: filters.obraLabel || "Obra",
      active: filters.obraId !== null,
      hasDropdown: true,
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
      hasDropdown: true,
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
      hasDropdown: true,
      onPress: () => toggleDropdown("sindicato"),
      onClear: () => {
        setFilter("sindicatoId", null, null);
        closeAll();
      },
    },
    {
      key: "operador",
      icon: "account-hard-hat",
      label: filters.operadorLabel || "Operador",
      active: filters.operadorId !== null,
      hasDropdown: true,
      onPress: () => toggleDropdown("operador"),
      onClear: () => {
        setFilter("operadorId", null, null);
        closeAll();
      },
    },
    {
      key: "placas",
      icon: "card-text",
      label: filters.placas || "Placas",
      active: filters.placas !== null,
      hasDropdown: true,
      onPress: () => toggleDropdown("placas"),
      onClear: () => {
        setFilter("placas", null, null);
        closeAll();
      },
    },
  ];

  return (
    <View style={styles.wrapper}>
      {/* ── SearchBar ────────────────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Folio, operador o placas..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange("")}
              style={styles.searchClear}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Botón limpiar todos los filtros — solo visible si hay activos */}
        {activeCount > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => {
              clearFilters();
              closeAll();
            }}
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

      {/* ── Selector de mes (solo admin) ─────────────────────────────────── */}
      {esAdministrador && mesSeleccionado && onMesChange && (
        <MesSelectorRow mesSeleccionado={mesSeleccionado} onMesChange={onMesChange} />
      )}

      {/* ── Chips scrolleables ───────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        keyboardShouldPersistTaps="handled"
      >
        {chips.map((chip) => (
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
          displayField="material"
          valueField="id_material"
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
          displayField="sindicato"
          valueField="id_sindicato"
          placeholder="sindicato"
          onSelect={(item) => {
            setFilter("sindicatoId", item.id_sindicato, item.sindicato);
            closeAll();
          }}
        />
      )}

      {openDropdown === "operador" && (
        <InlineDropdown
          items={operadores}
          selectedId={filters.operadorId}
          displayField="nombre_completo"
          valueField="id_operador"
          placeholder="operador"
          onSelect={(item) => {
            setFilter("operadorId", item.id_operador, item.nombre_completo);
            closeAll();
          }}
        />
      )}

      {openDropdown === "placas" && (
        <PlacasDropdown
          value={filters.placas}
          vehiculos={vehiculos}
          onSelect={(placas, label) => {
            if (placas) {
              setFilter("placas", placas, label);
              closeAll();
            } else {
              setFilter("placas", null, null);
            }
          }}
        />
      )}
    </View>
  );
};

export default FilterBar;

// ─── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // SearchBar
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  searchClear: {
    padding: 2,
  },

  // Botón limpiar filtros
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 4,
  },
  clearAllText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },

  // Selector de mes
  mesSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 8,
  },
  mesFlechaBtn: {
    padding: 4,
  },
  mesFlechaBtnDisabled: {
    opacity: 0.35,
  },
  mesTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.secondary,
    minWidth: 140,
    textAlign: "center",
  },

  // Chips
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },
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
    maxWidth: 90,
  },
  chipLabelActive: {
    color: colors.surface,
    fontWeight: "600",
  },
  chipClear: {
    marginLeft: 2,
  },

  // Dropdown inline
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
