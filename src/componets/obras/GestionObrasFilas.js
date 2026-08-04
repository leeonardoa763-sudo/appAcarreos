// src/componets/obras/GestionObrasFilas.js
// Filas de las listas de GestionObrasScreen y su caja de busqueda.
import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { estilosObras as estilos } from "./gestionObrasStyles";

const OBRA_PRUEBA = 888;

export function CajaBusqueda({ valor, onCambiar, placeholder }) {
  return (
    <View style={estilos.searchRow}>
      <View style={estilos.searchBox}>
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={colors.textSecondary}
        />
        <TextInput
          style={estilos.searchInput}
          value={valor}
          onChangeText={onCambiar}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          autoCorrect={false}
        />
        {valor.length > 0 && (
          <TouchableOpacity
            onPress={() => onCambiar("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Chip de dato (CC, empresa). En tono de advertencia cuando el dato falta,
// porque sin CC ni sufijo de empresa no se puede generar el folio del vale.
function Dato({ icono, texto, faltante }) {
  return (
    <View style={[estilos.dato, faltante && estilos.datoFaltante]}>
      <MaterialCommunityIcons
        name={icono}
        size={12}
        color={faltante ? colors.warning : colors.textSecondary}
      />
      <Text
        style={[estilos.datoTexto, faltante && estilos.datoTextoFaltante]}
        numberOfLines={1}
      >
        {texto}
      </Text>
    </View>
  );
}

export function FilaObra({ obra, onEditar, onToggleActivo }) {
  const activa = !!obra.activo;
  const esPrueba = obra.id_obra === OBRA_PRUEBA;
  const empresa = obra.empresas?.empresa;
  const sufijo = obra.empresas?.sufijo;
  const tieneGPS = obra.latitud != null && obra.longitud != null;

  const meta = [
    `ID ${obra.id_obra}`,
    tieneGPS
      ? `GPS ${obra.radio_validacion_metros ?? "sin"} m`
      : "Sin coordenadas",
    obra.min_minutos_entre_viajes != null
      ? `${obra.min_minutos_entre_viajes} min entre viajes`
      : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <TouchableOpacity
      style={[estilos.fila, !activa && estilos.filaInactiva]}
      onPress={() => onEditar(obra)}
      activeOpacity={0.7}
    >
      <View style={estilos.filaIcono}>
        <MaterialCommunityIcons
          name="office-building-marker-outline"
          size={22}
          color={activa ? colors.secondary : colors.textSecondary}
        />
      </View>

      <View style={estilos.filaTextos}>
        <View style={estilos.filaTituloRow}>
          <Text
            style={[estilos.filaNombre, !activa && estilos.filaNombreApagado]}
            numberOfLines={2}
          >
            {obra.obra}
          </Text>
          {esPrueba && (
            <View style={estilos.etiquetaPrueba}>
              <Text style={estilos.etiquetaPruebaTexto}>PRUEBA</Text>
            </View>
          )}
        </View>

        <View style={estilos.filaSubRow}>
          <Dato
            icono="pound"
            texto={obra.cc != null ? `CC ${obra.cc}` : "Sin CC"}
            faltante={obra.cc == null}
          />
          <Dato
            icono="domain"
            texto={
              empresa ? (sufijo ? `${empresa} (${sufijo})` : empresa) : "Sin empresa"
            }
            faltante={!empresa}
          />
        </View>

        <Text style={estilos.filaMeta}>{meta}</Text>
      </View>

      <TouchableOpacity
        style={[
          estilos.pildoraEstado,
          activa ? estilos.pildoraActiva : estilos.pildoraInactiva,
        ]}
        onPress={() => onToggleActivo(obra)}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <MaterialCommunityIcons
          name={activa ? "power" : "power-off"}
          size={14}
          color={activa ? colors.accent : colors.textSecondary}
        />
        <Text
          style={[
            estilos.pildoraTexto,
            { color: activa ? colors.accent : colors.textSecondary },
          ]}
        >
          {activa ? "Activa" : "Inactiva"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function FilaUsuario({ usuario, totalObras, onPress }) {
  const nombreCompleto =
    [usuario.nombre, usuario.primer_apellido, usuario.segundo_apellido]
      .filter(Boolean)
      .join(" ") || "Sin nombre";
  const sinObras = !totalObras;

  return (
    <TouchableOpacity style={estilos.fila} onPress={onPress} activeOpacity={0.7}>
      <View style={estilos.filaIcono}>
        <MaterialCommunityIcons
          name="account-outline"
          size={22}
          color={colors.secondary}
        />
      </View>

      <View style={estilos.filaTextos}>
        <Text style={estilos.filaNombre} numberOfLines={2}>
          {nombreCompleto}
        </Text>
        <Text style={estilos.filaSubtexto}>
          {usuario.roles?.role ?? "Sin rol"}
        </Text>
      </View>

      {totalObras != null && (
        <View
          style={[estilos.contadorObras, sinObras && estilos.contadorVacio]}
        >
          <MaterialCommunityIcons
            name="office-building-marker-outline"
            size={12}
            color={sinObras ? colors.textSecondary : colors.secondary}
          />
          <Text
            style={[
              estilos.contadorObrasTexto,
              sinObras && estilos.contadorVacioTexto,
            ]}
          >
            {totalObras}
          </Text>
        </View>
      )}

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
}
