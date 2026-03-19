/**
 * DEV ONLY — Eliminar antes de producción
 * Modal temporal para probar impresión de tickets de material
 * sin necesidad de crear un vale nuevo.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { supabase } from "../../config/supabase";
import { BLUETOOTH_ENABLED } from "../../config/features";
import ModalImprimirTicketRenta from "../acarreos/rentaHelpers/ModalImprimirTicketRenta";

let generarTicketMaterial;
if (BLUETOOTH_ENABLED) {
  const tg = require("../../services/ticketGenerator");
  generarTicketMaterial = tg.generarTicketMaterial;
}

const VALE_SELECT = `
  *,
  obras:id_obra (obra, cc, empresas:id_empresa (empresa, sufijo, logo)),
  operadores:id_operador (nombre_completo),
  vehiculos:id_vehiculo (placas, capacidad_m3, sindicatos:id_sindicato (sindicato)),
  vale_material_detalles (
    *,
    material:id_material (id_material, material, id_tipo_de_material),
    bancos:id_banco (id_banco, banco),
    sindicatos:id_sindicato (sindicato),
    vale_material_viajes (*)
  )
`;

const ModalPruebaImpresion = ({ visible, onCerrar }) => {
  const [vales, setVales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [valeSeleccionado, setValeSeleccionado] = useState(null);
  const [mostrarImpresion, setMostrarImpresion] = useState(false);

  // Cargar vales emitidos al abrir
  useEffect(() => {
    if (!visible) return;
    cargarVales();
  }, [visible]);

  const cargarVales = useCallback(async () => {
    try {
      setLoading(true);
      // DESPUÉS
      const { data, error } = await supabase
        .from("vales")
        .select(VALE_SELECT)
        .eq("estado", "emitido")
        .eq("tipo_vale", "material")
        .order("fecha_completado", { ascending: false })
        .limit(20);

      if (error) throw error;
      setVales(data || []);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los vales.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSeleccionar = useCallback((vale) => {
    setValeSeleccionado(vale);
    setMostrarImpresion(true);
  }, []);

  const handleCerrarImpresion = useCallback(() => {
    setMostrarImpresion(false);
    setValeSeleccionado(null);
  }, []);

  const renderVale = ({ item }) => {
    const detalle = item.vale_material_detalles?.[0];
    const material = detalle?.material?.material ?? "N/A";
    const totalViajes = detalle?.vale_material_viajes?.length ?? 0;
    const volumen = detalle?.volumen_real_m3
      ? `${parseFloat(detalle.volumen_real_m3).toFixed(2)} m3`
      : "N/A";

    return (
      <TouchableOpacity
        style={styles.valeItem}
        onPress={() => handleSeleccionar(item)}
        activeOpacity={0.7}
      >
        <View style={styles.valeIcono}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={20}
            color={colors.secondary}
          />
        </View>
        <View style={styles.valeInfo}>
          <Text style={styles.valeFolio}>{item.folio}</Text>
          <Text style={styles.valeMaterial}>{material}</Text>
          <Text style={styles.valeDatos}>
            {totalViajes} viaje{totalViajes !== 1 ? "s" : ""} · {volumen}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="printer-pos"
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal
        visible={visible && !mostrarImpresion}
        transparent
        animationType="slide"
        onRequestClose={onCerrar}
      >
        <View style={styles.overlay}>
          <View style={styles.contenedor}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MaterialCommunityIcons
                  name="bug-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.headerTitulo}>Prueba de Impresión</Text>
                <View style={styles.devBadge}>
                  <Text style={styles.devBadgeTexto}>DEV</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onCerrar}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.separador} />

            <Text style={styles.subtitulo}>
              Selecciona un vale emitido para probar el ticket
            </Text>

            {/* Lista */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingTexto}>Cargando vales...</Text>
              </View>
            ) : vales.length === 0 ? (
              <View style={styles.vacios}>
                <MaterialCommunityIcons
                  name="file-search-outline"
                  size={40}
                  color={colors.textSecondary}
                />
                <Text style={styles.vaciosTexto}>
                  No hay vales de material emitidos
                </Text>
              </View>
            ) : (
              <FlatList
                data={vales}
                keyExtractor={(item) => String(item.id_vale)}
                renderItem={renderVale}
                style={styles.lista}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => (
                  <View style={styles.separadorLista} />
                )}
              />
            )}

            {/* Botón recargar */}
            <TouchableOpacity
              style={styles.botonRecargar}
              onPress={cargarVales}
              disabled={loading}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={16}
                color={colors.secondary}
              />
              <Text style={styles.botonRecargarTexto}>Recargar lista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de impresión reutilizado */}
      <ModalImprimirTicketRenta
        visible={mostrarImpresion}
        valeData={valeSeleccionado}
        generarLineas={
          BLUETOOTH_ENABLED && generarTicketMaterial && valeSeleccionado
            ? () => generarTicketMaterial(valeSeleccionado)
            : undefined
        }
        resumenDatos={
          valeSeleccionado
            ? {
                folio: valeSeleccionado.folio,
                operador: valeSeleccionado.operadores?.nombre_completo,
                placas: valeSeleccionado.vehiculos?.placas,
                descripcion: `${valeSeleccionado.vale_material_detalles?.[0]?.material?.material ?? "Material"} — ${valeSeleccionado.vale_material_detalles?.[0]?.bancos?.banco ?? "Banco"}`,
              }
            : undefined
        }
        onImpreso={handleCerrarImpresion}
        onSinImpresora={handleCerrarImpresion}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  contenedor: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  devBadge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  devBadgeTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.surface,
  },
  separador: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  vacios: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  vaciosTexto: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  lista: {
    paddingHorizontal: 20,
    paddingTop: 4,
    maxHeight: 420,
  },
  valeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  separadorLista: {
    height: 6,
  },
  valeIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  valeInfo: {
    flex: 1,
  },
  valeFolio: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  valeMaterial: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
    fontWeight: "600",
  },
  valeDatos: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  botonRecargar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 14,
    paddingHorizontal: 20,
  },
  botonRecargarTexto: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: "600",
  },
});

export default ModalPruebaImpresion;
