// src/componets/common/ListaSeleccion.js
//
// Lista vertical de opciones con buscador, pensada para ir DENTRO de un modal
// que ya es un ScrollView. Por eso usa ScrollView + map y no FlatList: anidar
// dos VirtualizedList en el mismo eje dispara el error de React Native
// "VirtualizedLists should never be nested inside plain ScrollViews".
//
// Una opcion puede venir deshabilitada (`deshabilitado: true` + `nota`), que es
// como se bloquean las combinaciones ya registradas para evitar duplicados.
//
// PROPS:
// - label: titulo de la seccion
// - items: [{ id, label, deshabilitado?, nota? }]
// - valor: id seleccionado
// - onSeleccionar: (id) => void
// - placeholderBusqueda / mensajeVacio: textos
// - altura: alto maximo de la lista (default 190)
// - umbralBusqueda: a partir de cuantos items se muestra el buscador (default 6)
import React, { useState, useMemo } from "react";
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

const ListaSeleccion = ({
  label,
  items = [],
  valor,
  onSeleccionar,
  placeholderBusqueda = "Buscar...",
  mensajeVacio = "Sin opciones disponibles",
  altura = 190,
  umbralBusqueda = 6,
}) => {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => String(i.label ?? "").toLowerCase().includes(q));
  }, [items, busqueda]);

  const disponibles = items.filter((i) => !i.deshabilitado).length;

  return (
    <View>
      <View style={estilos.encabezado}>
        <Text style={estilos.label}>{label}</Text>
        {items.length > 0 && (
          <Text style={estilos.contador}>
            {disponibles} disponible{disponibles === 1 ? "" : "s"}
          </Text>
        )}
      </View>

      {items.length >= umbralBusqueda && (
        <View style={estilos.buscador}>
          <MaterialCommunityIcons
            name="magnify"
            size={17}
            color={colors.textSecondary}
          />
          <TextInput
            style={estilos.buscadorInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder={placeholderBusqueda}
            placeholderTextColor={colors.input.placeholder}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={[estilos.contenedorLista, { maxHeight: altura }]}>
        {filtrados.length === 0 ? (
          <Text style={estilos.vacio}>
            {busqueda ? "Sin resultados para la busqueda" : mensajeVacio}
          </Text>
        ) : (
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {filtrados.map((item, indice) => {
              const seleccionado = item.id === valor;
              const bloqueado = !!item.deshabilitado;

              return (
                <TouchableOpacity
                  key={String(item.id)}
                  style={[
                    estilos.fila,
                    indice > 0 && estilos.filaConBorde,
                    seleccionado && estilos.filaSeleccionada,
                    bloqueado && estilos.filaBloqueada,
                  ]}
                  onPress={() => !bloqueado && onSeleccionar(item.id)}
                  disabled={bloqueado}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={
                      bloqueado
                        ? "lock-outline"
                        : seleccionado
                          ? "radiobox-marked"
                          : "radiobox-blank"
                    }
                    size={18}
                    color={
                      bloqueado
                        ? colors.textSecondary
                        : seleccionado
                          ? colors.secondary
                          : colors.border
                    }
                  />
                  <Text
                    style={[
                      estilos.filaTexto,
                      seleccionado && estilos.filaTextoSeleccionado,
                      bloqueado && estilos.filaTextoBloqueado,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {bloqueado && !!item.nota && (
                    <View style={estilos.notaBadge}>
                      <Text style={estilos.notaTexto}>{item.nota}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default ListaSeleccion;

const estilos = StyleSheet.create({
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  contador: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 6,
    backgroundColor: colors.surface,
  },
  buscadorInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },

  contenedorLista: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  vacio: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  filaConBorde: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  filaSeleccionada: {
    backgroundColor: `${colors.secondary}12`,
  },
  filaBloqueada: {
    backgroundColor: colors.background,
  },
  filaTexto: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  filaTextoSeleccionado: {
    fontWeight: "700",
    color: colors.secondary,
  },
  filaTextoBloqueado: {
    color: colors.textSecondary,
  },

  notaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notaTexto: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
