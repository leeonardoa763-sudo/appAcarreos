// src/componets/acarreos/rentaHelpers/MaterialTicketModal.js

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import { supabase } from "../../../config/supabase";

const MaterialTicketModal = ({
  visible,
  materialDefault,
  numeroTicket,
  onConfirmar,
  onCancelar,
}) => {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    if (!visible) return;
    cargarMateriales();
  }, [visible]);

  // Preseleccionar el material del vale cuando carguen los datos
  useEffect(() => {
    if (materiales.length > 0 && materialDefault?.id_material) {
      const encontrado = materiales.find(
        (m) => m.id_material === materialDefault.id_material,
      );
      setSeleccionado(encontrado ?? null);
    }
  }, [materiales, materialDefault]);

  const cargarMateriales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("material")
        .select("id_material, material")
        .order("material", { ascending: true });

      if (error) throw error;
      setMateriales(data ?? []);
    } catch (error) {
      setMateriales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = () => {
    if (!seleccionado) return;
    onConfirmar(seleccionado);
  };

  const handleCancelar = () => {
    setSeleccionado(null);
    onCancelar();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancelar}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="package-variant"
              size={22}
              color={colors.secondary}
            />
            <Text style={styles.titulo}>
              Material — Ticket #{String(numeroTicket).padStart(2, "0")}
            </Text>
          </View>

          <Text style={styles.subtitulo}>
            Selecciona el material que se está moviendo en este viaje
          </Text>

          {/* Lista */}
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={materiales}
              keyExtractor={(item) => String(item.id_material)}
              style={styles.lista}
              renderItem={({ item }) => {
                const esSeleccionado =
                  seleccionado?.id_material === item.id_material;
                const esPorDefecto =
                  materialDefault?.id_material === item.id_material;
                return (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      esSeleccionado && styles.itemSeleccionado,
                    ]}
                    onPress={() => setSeleccionado(item)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={
                        esSeleccionado ? "radiobox-marked" : "radiobox-blank"
                      }
                      size={20}
                      color={
                        esSeleccionado ? colors.secondary : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.itemTexto,
                        esSeleccionado && styles.itemTextoSeleccionado,
                      ]}
                    >
                      {item.material}
                    </Text>
                    {esPorDefecto && (
                      <View style={styles.badgeDefault}>
                        <Text style={styles.badgeDefaultTexto}>del vale</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Botones */}
          <View style={styles.botones}>
            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={handleCancelar}
              activeOpacity={0.7}
            >
              <Text style={styles.botonCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.botonConfirmar,
                !seleccionado && styles.botonDeshabilitado,
              ]}
              onPress={handleConfirmar}
              disabled={!seleccionado}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.botonConfirmarTexto,
                  !seleccionado && styles.botonTextoDeshabilitado,
                ]}
              >
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 24,
  },
  lista: {
    maxHeight: 320,
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  itemSeleccionado: {
    backgroundColor: "#EEF4FB",
  },
  itemTexto: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  itemTextoSeleccionado: {
    fontWeight: "600",
    color: colors.secondary,
  },
  badgeDefault: {
    backgroundColor: colors.background,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeDefaultTexto: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  botones: {
    flexDirection: "row",
    gap: 10,
  },
  botonCancelar: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    alignItems: "center",
  },
  botonCancelarTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  botonConfirmar: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: "center",
  },
  botonDeshabilitado: {
    backgroundColor: colors.background,
  },
  botonConfirmarTexto: {
    fontSize: 14,
    color: colors.surface,
    fontWeight: "700",
  },
  botonTextoDeshabilitado: {
    color: colors.textSecondary,
  },
});

export default MaterialTicketModal;
