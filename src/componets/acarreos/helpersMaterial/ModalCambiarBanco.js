// components/acarreos/helpersMaterial/ModalCambiarBanco.js

// 1. React
import React, { useState, useEffect } from "react";

// 2. React Native
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local
import { colors } from "../../../config/colors";
import { supabase } from "../../../config/supabase";

const ModalCambiarBanco = ({
  visible,
  idObra,
  bancoActual,
  onConfirmar,
  onCancelar,
}) => {
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setSeleccionado(null);
    cargarBancos();
  }, [visible]);

  const cargarBancos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("distancias_banco_obra")
        .select(
          `
          id_distancia_banco_obra,
          distancia_km,
          bancos:id_banco (
            id_banco,
            banco
          )
        `,
        )
        .eq("id_obra", idObra);

      if (error) throw error;

      const lista = (data ?? []).map((d) => ({
        id_banco: d.bancos.id_banco,
        banco: d.bancos.banco,
        distancia_km: d.distancia_km,
      }));

      setBancos(lista);
    } catch (error) {
      setBancos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = () => {
    if (!seleccionado) return;
    onConfirmar(seleccionado);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancelar}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="bank-outline"
              size={22}
              color={colors.secondary}
            />
            <Text style={styles.titulo}>Cambiar Banco</Text>
          </View>

          <Text style={styles.subtitulo}>
            Selecciona el banco para este viaje. El costo se recalculará con la
            distancia correspondiente.
          </Text>

          {/* Banco actual */}
          {bancoActual && (
            <View style={styles.bancoActualContainer}>
              <Text style={styles.bancoActualLabel}>Banco del vale:</Text>
              <Text style={styles.bancoActualValor}>{bancoActual}</Text>
            </View>
          )}

          {/* Lista */}
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loader}
            />
          ) : bancos.length === 0 ? (
            <View style={styles.sinBancos}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={styles.sinBancosTexto}>
                No hay bancos configurados para esta obra
              </Text>
            </View>
          ) : (
            <FlatList
              data={bancos}
              keyExtractor={(item) => String(item.id_banco)}
              style={styles.lista}
              renderItem={({ item }) => {
                const esSeleccionado = seleccionado?.id_banco === item.id_banco;
                const esActual = item.banco === bancoActual;
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
                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemTexto,
                          esSeleccionado && styles.itemTextoSeleccionado,
                        ]}
                      >
                        {item.banco}
                      </Text>
                      <Text style={styles.itemDistancia}>
                        {item.distancia_km} km
                      </Text>
                    </View>
                    {esActual && (
                      <View style={styles.badgeActual}>
                        <Text style={styles.badgeActualTexto}>actual</Text>
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
              onPress={onCancelar}
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
    justifyContent: "flex-end",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    maxHeight: "75%",
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  bancoActualContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  bancoActualLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bancoActualValor: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  loader: {
    marginVertical: 24,
  },
  sinBancos: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  sinBancosTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  lista: {
    maxHeight: 280,
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
  itemInfo: {
    flex: 1,
  },
  itemTexto: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  itemTextoSeleccionado: {
    fontWeight: "600",
    color: colors.secondary,
  },
  itemDistancia: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeActual: {
    backgroundColor: colors.background,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#E8EAF0",
  },
  badgeActualTexto: {
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

export default ModalCambiarBanco;
