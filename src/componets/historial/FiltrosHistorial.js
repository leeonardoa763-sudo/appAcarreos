/**
 * componets/historial/FiltrosHistorial.js
 *
 * Formulario que pregunta QUE vales quiere ver el usuario antes de cargar nada.
 * Solo UI: recibe el estado y los catalogos por props, no consulta la BD.
 *
 * El periodo tiene tres modos (todos / mes / rango); la traduccion a fechas vive
 * en utils/periodoHistorial.
 *
 * USADO EN:
 * - HistorialValesScreen
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "../../config/colors";
import { TIPOS_HISTORIAL } from "../../hooks/exportHelpers/historialQueries";
import { MODO_PERIODO, opcionesDeMes } from "../../utils/periodoHistorial";
import CustomModalPicker from "../forms/CustomModalPicker";
import CustomDatePicker from "../forms/CustomDatePicker";
import FormCheckbox from "../forms/FormCheckbox";

/**
 * Centinela de "sin filtro" para los pickers.
 *
 * No se usa null: el keyExtractor de CustomModalPicker hace item.id.toString(),
 * que revienta con null. La pantalla lo traduce a null antes de consultar.
 */
export const SIN_FILTRO = "__todos__";

const TIPOS_OPCIONES = [
  { id: TIPOS_HISTORIAL.TODOS, label: "Todos los tipos" },
  { id: TIPOS_HISTORIAL.MATERIAL, label: "Material" },
  { id: TIPOS_HISTORIAL.RENTA, label: "Renta de equipo" },
  { id: TIPOS_HISTORIAL.PIPAS, label: "Pipas de agua" },
];

const ChipPeriodo = ({ activo, icono, texto, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, activo && styles.chipActivo]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons
      name={icono}
      size={16}
      color={activo ? colors.surface : colors.secondary}
    />
    <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
      {texto}
    </Text>
  </TouchableOpacity>
);

const Seccion = ({ icono, titulo, children }) => (
  <View style={styles.seccion}>
    <View style={styles.seccionHeader}>
      <MaterialCommunityIcons
        name={icono}
        size={18}
        color={colors.textPrimary}
      />
      <Text style={styles.seccionTitulo}>{titulo}</Text>
    </View>
    {children}
  </View>
);

const FiltrosHistorial = ({
  filtros,
  setFiltro,
  obras = [],
  materiales = [],
  sindicatos = [],
  bancos = [],
  catalogosCargando = false,
  deshabilitado = false,
}) => {
  const esMaterialODodos =
    filtros.tipo === TIPOS_HISTORIAL.TODOS ||
    filtros.tipo === TIPOS_HISTORIAL.MATERIAL;

  return (
    <View>
      <Seccion icono="calendar-range" titulo="Periodo">
        <View style={styles.chipsFila}>
          <ChipPeriodo
            activo={filtros.modoPeriodo === MODO_PERIODO.TODOS}
            icono="infinity"
            texto="Todos"
            onPress={() => setFiltro("modoPeriodo", MODO_PERIODO.TODOS)}
          />
          <ChipPeriodo
            activo={filtros.modoPeriodo === MODO_PERIODO.MES}
            icono="calendar-month"
            texto="Un mes"
            onPress={() => setFiltro("modoPeriodo", MODO_PERIODO.MES)}
          />
          <ChipPeriodo
            activo={filtros.modoPeriodo === MODO_PERIODO.RANGO}
            icono="calendar-range"
            texto="Rango"
            onPress={() => setFiltro("modoPeriodo", MODO_PERIODO.RANGO)}
          />
        </View>

        {filtros.modoPeriodo === MODO_PERIODO.TODOS && (
          <View style={styles.avisoInfo}>
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={colors.secondary}
            />
            <Text style={styles.avisoInfoTexto}>
              Se incluira todo el historico. Si tienes muchos vales, conviene
              acotar el periodo para que la carga sea mas rapida.
            </Text>
          </View>
        )}

        {filtros.modoPeriodo === MODO_PERIODO.MES && (
          <CustomModalPicker
            label="Mes"
            value={filtros.mes}
            onValueChange={(valor) => setFiltro("mes", valor)}
            items={opcionesDeMes()}
            placeholder="Selecciona un mes"
            enabled={!deshabilitado}
          />
        )}

        {filtros.modoPeriodo === MODO_PERIODO.RANGO && (
          <>
            <CustomDatePicker
              label="Desde"
              value={filtros.fechaDesde}
              onChange={(fecha) => setFiltro("fechaDesde", fecha)}
              placeholder="Fecha inicial"
              enabled={!deshabilitado}
            />
            <CustomDatePicker
              label="Hasta"
              value={filtros.fechaHasta}
              onChange={(fecha) => setFiltro("fechaHasta", fecha)}
              placeholder="Fecha final"
              enabled={!deshabilitado}
            />
          </>
        )}
      </Seccion>

      <Seccion icono="filter-variant" titulo="Que vales">
        {obras.length > 1 && (
          <CustomModalPicker
            label="Obra"
            value={filtros.obraId}
            onValueChange={(valor) => setFiltro("obraId", valor)}
            items={[
              { id: SIN_FILTRO, label: "Todas mis obras" },
              ...obras.map((obra) => ({
                id: obra.id,
                label: obra.cc ? `${obra.nombre} (CC ${obra.cc})` : obra.nombre,
              })),
            ]}
            placeholder="Todas mis obras"
            enabled={!deshabilitado}
          />
        )}

        <CustomModalPicker
          label="Tipo de vale"
          value={filtros.tipo}
          onValueChange={(valor) => setFiltro("tipo", valor)}
          items={TIPOS_OPCIONES}
          enabled={!deshabilitado}
        />

        <CustomModalPicker
          label="Material"
          value={filtros.materialId}
          onValueChange={(valor) => setFiltro("materialId", valor)}
          items={[
            { id: SIN_FILTRO, label: "Todos los materiales" },
            ...materiales.map((m) => ({
              id: m.id_material,
              label: m.material,
            })),
          ]}
          placeholder="Todos los materiales"
          enabled={!deshabilitado}
          loading={catalogosCargando}
        />

        <CustomModalPicker
          label="Sindicato"
          value={filtros.sindicatoId}
          onValueChange={(valor) => setFiltro("sindicatoId", valor)}
          items={[
            { id: SIN_FILTRO, label: "Todos los sindicatos" },
            ...sindicatos.map((s) => ({
              id: s.id_sindicato,
              label: s.sindicato,
            })),
          ]}
          placeholder="Todos los sindicatos"
          enabled={!deshabilitado}
          loading={catalogosCargando}
        />

        <CustomModalPicker
          label="Banco de material"
          value={filtros.bancoId}
          onValueChange={(valor) => setFiltro("bancoId", valor)}
          items={[
            { id: SIN_FILTRO, label: "Todos los bancos" },
            ...bancos.map((b) => ({ id: b.id_banco, label: b.banco })),
          ]}
          placeholder={
            esMaterialODodos ? "Todos los bancos" : "Solo aplica a material"
          }
          enabled={!deshabilitado && esMaterialODodos}
          loading={catalogosCargando}
        />

        <FormCheckbox
          label="Incluir vales cancelados"
          value={filtros.incluirCancelados}
          onChange={(valor) => setFiltro("incluirCancelados", valor)}
          disabled={deshabilitado}
        />
      </Seccion>
    </View>
  );
};

export default FiltrosHistorial;

const styles = StyleSheet.create({
  seccion: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 8,
  },

  chipsFila: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.secondary,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActivo: {
    backgroundColor: colors.secondary,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondary,
    marginLeft: 6,
  },
  chipTextoActivo: {
    color: colors.surface,
  },

  avisoInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: `${colors.secondary}15`,
    borderRadius: 8,
    padding: 12,
  },
  avisoInfoTexto: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    marginLeft: 8,
    lineHeight: 18,
  },
});
