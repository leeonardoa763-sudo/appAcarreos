import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";

const TarifasModal = ({ visible, onClose, userObras }) => {
  const [activeTab, setActiveTab] = useState("renta");
  const [loading, setLoading] = useState(false);

  const [tarifasRenta, setTarifasRenta] = useState([]);
  const [tarifasMaterial, setTarifasMaterial] = useState([]);
  const [bancosMaterial, setBancosMaterial] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, userObras]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const obraIds = userObras.map((o) => o.id);

      // Fetch Tarifas de Renta (agrupadas por sindicato)
      const { data: rentaData, error: rentaError } = await supabase
        .from("precios_renta")
        .select(
          `
          *,
          sindicatos:id_sindicato(sindicato)
        `,
        )
        .order("id_sindicato");

      if (rentaError) throw rentaError;
      setTarifasRenta(rentaData || []);

      // Fetch Tarifas de Material
      const { data: materialData, error: materialError } = await supabase
        .from("precios_material")
        .select(
          `
          *,
          sindicatos:id_sindicato(sindicato),
          tipo_de_material:id_tipo_de_material(tipo_de_material)
        `,
        )
        .order("id_sindicato");

      if (materialError) throw materialError;
      setTarifasMaterial(materialData || []);

      // Fetch Bancos con distancias (filtrados por obras del usuario)
      const { data: distanciasData, error: distanciasError } = await supabase
        .from("distancias_banco_obra")
        .select(
          `
            distancia_km,
            id_banco,
            id_obra,
            bancos:id_banco(id_banco, banco),
            obras:id_obra(obra, cc)
        `,
        )
        .in("id_obra", obraIds)
        .order("id_obra");

      if (distanciasError) throw distanciasError;

      // Obtener pesos específicos para cada banco
      const bancosConDatos = await Promise.all(
        (distanciasData || []).map(async (distancia) => {
          const { data: pesosData, error: pesosError } = await supabase
            .from("peso_especifico")
            .select(
              "id_material, peso_especifico, material:id_material(material)",
            )
            .eq("id_banco", distancia.id_banco);

          if (pesosError) {
            console.error("Error obteniendo pesos:", pesosError);
            return {
              ...distancia,
              pesos: [],
            };
          }

          return {
            banco: distancia.bancos?.banco || "Sin nombre",
            obra: `${distancia.obras?.cc || "N/A"} - ${distancia.obras?.obra || "Sin obra"}`,
            distancia_km: distancia.distancia_km,
            pesos: pesosData || [],
          };
        }),
      );

      setBancosMaterial(bancosConDatos);
    } catch (error) {
      console.error("Error al cargar tarifas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar tarifas de renta por sindicato
  const groupRentaBySindicato = () => {
    const grouped = {};
    tarifasRenta.forEach((tarifa) => {
      const sindicato = tarifa.sindicatos?.sindicato || "Sin sindicato";
      if (!grouped[sindicato]) {
        grouped[sindicato] = [];
      }
      grouped[sindicato].push(tarifa);
    });
    return grouped;
  };

  // Agrupar tarifas de material por sindicato
  const groupMaterialBySindicato = () => {
    const grouped = {};
    tarifasMaterial.forEach((tarifa) => {
      const sindicato = tarifa.sindicatos?.sindicato || "Sin sindicato";
      if (!grouped[sindicato]) {
        grouped[sindicato] = [];
      }
      grouped[sindicato].push(tarifa);
    });
    return grouped;
  };

  // Agrupar bancos por obra
  const groupBancosByObra = () => {
    const grouped = {};
    bancosMaterial.forEach((banco) => {
      const obra = banco.obra;
      if (!grouped[obra]) {
        grouped[obra] = [];
      }
      grouped[obra].push(banco);
    });
    return grouped;
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando tarifas...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case "renta":
        return <RentaTab data={groupRentaBySindicato()} />;
      case "material":
        return <MaterialTab data={groupMaterialBySindicato()} />;
      case "bancos":
        return <BancosTab data={groupBancosByObra()} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tarifas y Distancias</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "renta" && styles.activeTab]}
              onPress={() => setActiveTab("renta")}
            >
              <MaterialCommunityIcons
                name="truck"
                size={20}
                color={
                  activeTab === "renta" ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "renta" && styles.activeTabText,
                ]}
              >
                Renta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "material" && styles.activeTab]}
              onPress={() => setActiveTab("material")}
            >
              <MaterialCommunityIcons
                name="cube-outline"
                size={20}
                color={
                  activeTab === "material"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "material" && styles.activeTabText,
                ]}
              >
                Material
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "bancos" && styles.activeTab]}
              onPress={() => setActiveTab("bancos")}
            >
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={20}
                color={
                  activeTab === "bancos" ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "bancos" && styles.activeTabText,
                ]}
              >
                Bancos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// COMPONENTE: TAB DE RENTA
// ============================================
const RentaTab = ({ data }) => {
  if (Object.keys(data).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="truck-alert"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyText}>
          No hay tarifas de renta configuradas
        </Text>
      </View>
    );
  }

  return (
    <View>
      {Object.entries(data).map(([sindicato, tarifas]) => (
        <View key={sindicato} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color={colors.secondary}
            />
            <Text style={styles.sectionTitle}>{sindicato}</Text>
          </View>
          {tarifas.map((tarifa, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>{tarifa.equipo}</Text>
              <View style={styles.cardRow}>
                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>Por hora</Text>
                  <Text style={styles.cardValue}>
                    ${tarifa.costo_hr?.toFixed(2) || "0.00"}
                  </Text>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>Por día</Text>
                  <Text style={styles.cardValue}>
                    ${tarifa.costo_dia?.toFixed(2) || "0.00"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// ============================================
// COMPONENTE: TAB DE MATERIAL
// ============================================
const MaterialTab = ({ data }) => {
  if (Object.keys(data).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="cube-off-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyText}>
          No hay tarifas de material configuradas
        </Text>
      </View>
    );
  }

  return (
    <View>
      {Object.entries(data).map(([sindicato, tarifas]) => (
        <View key={sindicato} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color={colors.secondary}
            />
            <Text style={styles.sectionTitle}>{sindicato}</Text>
          </View>
          {tarifas.map((tarifa, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>
                {tarifa.tipo_de_material?.tipo_de_material || "Sin tipo"}
              </Text>
              <View style={styles.cardRow}>
                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>Primer kilómetro</Text>
                  <Text style={styles.cardValue}>
                    ${tarifa.primer_km?.toFixed(2) || "0.00"}
                  </Text>
                </View>
              </View>
              {tarifa.numero_de_intervalos >= 1 && (
                <View style={styles.cardRow}>
                  <View style={styles.cardItem}>
                    <Text style={styles.cardLabel}>
                      Km subsecuente (Int. 1)
                    </Text>
                    <Text style={styles.cardValue}>
                      ${tarifa.km_sub_int1?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                  {tarifa.limite_int1 && (
                    <View style={styles.cardItem}>
                      <Text style={styles.cardLabel}>Hasta</Text>
                      <Text style={styles.cardValue}>
                        {tarifa.limite_int1} km
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// ============================================
// COMPONENTE: TAB DE BANCOS
// ============================================
const BancosTab = ({ data }) => {
  if (Object.keys(data).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="map-marker-off"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyText}>
          No hay bancos de material configurados
        </Text>
      </View>
    );
  }

  return (
    <View>
      {Object.entries(data).map(([obra, bancos]) => (
        <View key={obra} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="office-building"
              size={20}
              color={colors.secondary}
            />
            <Text style={styles.sectionTitle}>{obra}</Text>
          </View>
          {bancos.map((banco, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>{banco.banco}</Text>

              <View style={styles.cardRow}>
                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>Distancia</Text>
                  <Text style={styles.cardValue}>{banco.distancia_km} km</Text>
                </View>
              </View>

              {banco.pesos && banco.pesos.length > 0 && (
                <View style={styles.pesosContainer}>
                  <Text style={styles.pesosTitle}>Pesos específicos:</Text>
                  {banco.pesos.map((peso, idx) => (
                    <View key={idx} style={styles.pesoRow}>
                      <Text style={styles.pesoMaterial}>
                        {peso.material?.material || "Material"}
                      </Text>
                      <Text style={styles.pesoValue}>
                        {peso.peso_especifico} ton/m³
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECEF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.secondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8ECEF",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardItem: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  cardDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E8ECEF",
    marginHorizontal: 12,
  },
  pesosContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E8ECEF",
  },
  pesosTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  pesoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  pesoMaterial: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  pesoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
  },
});

export default TarifasModal;
