/**
 * componets/historial/ListaFoliosHistorial.js
 *
 * Lista de folios resultante de los filtros del historial, con buscador.
 * El buscador filtra en memoria: no vuelve a consultar la BD.
 *
 * USADO EN:
 * - HistorialValesScreen
 */

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "../../config/colors";
import { formatearFecha } from "../../utils/formatters";
import { TIPOS_HISTORIAL } from "../../hooks/exportHelpers/historialQueries";
import StatusBadge from "../common/StatusBadge";

const ICONO_TIPO = {
  [TIPOS_HISTORIAL.MATERIAL]: "package-variant",
  [TIPOS_HISTORIAL.RENTA]: "truck-cargo-container",
  [TIPOS_HISTORIAL.PIPAS]: "water",
};

const ETIQUETA_TIPO = {
  [TIPOS_HISTORIAL.MATERIAL]: "Material",
  [TIPOS_HISTORIAL.RENTA]: "Renta",
  [TIPOS_HISTORIAL.PIPAS]: "Pipa de agua",
};

const ListaFoliosHistorial = ({ folios = [], onSeleccionar, ListHeaderComponent }) => {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    if (!query) return folios;
    return folios.filter((item) =>
      String(item.folio || "").toLowerCase().includes(query),
    );
  }, [folios, busqueda]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onSeleccionar(item)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={ICONO_TIPO[item.tipo] || "file-document-outline"}
        size={24}
        color={colors.secondary}
        style={styles.itemIcono}
      />

      <View style={styles.itemInfo}>
        <Text style={styles.folio}>{item.folio}</Text>
        <Text style={styles.meta}>
          {ETIQUETA_TIPO[item.tipo] || "Vale"} ·{" "}
          {formatearFecha(item.fecha_creacion)} · {item.totalViajes}{" "}
          {item.totalViajes === 1 ? "viaje" : "viajes"}
        </Text>
      </View>

      <View style={styles.itemDerecha}>
        <StatusBadge estado={item.estado} size="small" />
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={filtrados}
      renderItem={renderItem}
      keyExtractor={(item) => String(item.id_vale)}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          {ListHeaderComponent}

          <View style={styles.buscadorContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.buscadorInput}
              placeholder="Buscar por folio"
              placeholderTextColor={colors.input.placeholder}
              value={busqueda}
              onChangeText={setBusqueda}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity
                onPress={() => setBusqueda("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.conteo}>
            {filtrados.length}{" "}
            {filtrados.length === 1 ? "vale" : "vales"}
            {busqueda.trim() ? ` de ${folios.length}` : ""}
          </Text>
        </>
      }
      ListEmptyComponent={
        <View style={styles.vacio}>
          <MaterialCommunityIcons
            name="file-search-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.vacioTexto}>
            Ningun folio coincide con la busqueda
          </Text>
        </View>
      }
    />
  );
};

export default ListaFoliosHistorial;

const styles = StyleSheet.create({
  contenido: {
    padding: 16,
    paddingBottom: 32,
  },

  buscadorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.input.border,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  buscadorInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: colors.input.text,
  },
  conteo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  itemIcono: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  folio: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemDerecha: {
    alignItems: "flex-end",
  },

  vacio: {
    alignItems: "center",
    paddingVertical: 48,
  },
  vacioTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
