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

/**
 * Cruza las tarifas por defecto del sindicato con las tarifas propias de las
 * obras del usuario y marca cada fila con su origen.
 *
 * Es lo que evita que este modal diga un precio que no coincide con el del vale:
 * si la obra tiene tarifa propia, es esa la que se cotiza (ver
 * utils/preciosMaterial.js y utils/preciosRenta.js), no el default.
 *
 * Cada fila queda con:
 *   _obraNombre    nombre de la obra si es tarifa de obra; null si es el default
 *   _sustituidaEn  obras donde este default NO aplica por tener tarifa propia
 *
 * @param {Array} defaults - Filas de precios_material / precios_renta
 * @param {Array} deObra - Filas de precios_material_obra / precios_renta_obra
 * @param {Function} claveDe - Identifica la combinacion que ambas comparten
 */
const anotarOrigen = (defaults, deObra, claveDe) => {
  const obrasPorClave = new Map();
  (deObra || []).forEach((t) => {
    const clave = claveDe(t);
    const nombre = t.obras?.obra ?? `Obra ${t.id_obra}`;
    obrasPorClave.set(clave, [...(obrasPorClave.get(clave) ?? []), nombre]);
  });

  const filasDeObra = (deObra || []).map((t) => ({
    ...t,
    _obraNombre: t.obras?.obra ?? `Obra ${t.id_obra}`,
    _sustituidaEn: [],
  }));

  const filasDefault = (defaults || []).map((t) => ({
    ...t,
    _obraNombre: null,
    _sustituidaEn: obrasPorClave.get(claveDe(t)) ?? [],
  }));

  // Las de obra primero: son las que realmente aplican
  return [...filasDeObra, ...filasDefault];
};

const claveMaterial = (t) => `${t.id_tipo_de_material}-${t.id_sindicato}`;
const claveRenta = (t) => String(t.id_sindicato);

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

      // Tarifas por defecto del sindicato + las propias de las obras del
      // usuario. El cruce lo hace anotarOrigen (ver arriba).
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

      const { data: rentaObraData, error: rentaObraError } = await supabase
        .from("precios_renta_obra")
        .select(
          `
          *,
          sindicatos:id_sindicato(sindicato),
          obras:id_obra(obra)
        `,
        )
        .in("id_obra", obraIds)
        .eq("activo", true)
        .order("id_sindicato");

      if (rentaObraError) throw rentaObraError;

      setTarifasRenta(anotarOrigen(rentaData, rentaObraData, claveRenta));

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

      const { data: materialObraData, error: materialObraError } =
        await supabase
          .from("precios_material_obra")
          .select(
            `
          *,
          sindicatos:id_sindicato(sindicato),
          tipo_de_material:id_tipo_de_material(tipo_de_material),
          obras:id_obra(obra)
        `,
          )
          .in("id_obra", obraIds)
          .eq("activo", true)
          .order("id_sindicato");

      if (materialObraError) throw materialObraError;

      setTarifasMaterial(
        anotarOrigen(materialData, materialObraData, claveMaterial),
      );

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
// COMPONENTE: ETIQUETA DE ORIGEN DE LA TARIFA
// ============================================
// Naranja  = tarifa propia de una obra; es la que se cotiza ahi.
// Gris      = default del sindicato. Si ademas hay obras que lo sustituyen, se
//             listan para que nadie use este precio en una obra donde no aplica.
const EtiquetaOrigen = ({ tarifa }) => {
  if (tarifa._obraNombre) {
    return (
      <View style={styles.badgeObra}>
        <MaterialCommunityIcons
          name="office-building-marker-outline"
          size={12}
          color={colors.primary}
        />
        <Text style={styles.badgeObraTexto}>
          Tarifa especial de {tarifa._obraNombre}
        </Text>
      </View>
    );
  }

  const sustituidaEn = tarifa._sustituidaEn ?? [];

  return (
    <View style={styles.badgeFila}>
      <View style={styles.badgeDefault}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={12}
          color={colors.textSecondary}
        />
        <Text style={styles.badgeDefaultTexto}>Tarifa general</Text>
      </View>

      {sustituidaEn.length > 0 && (
        <View style={styles.badgeSustituida}>
          <MaterialCommunityIcons
            name="alert-outline"
            size={12}
            color={colors.warning}
          />
          <Text style={styles.badgeSustituidaTexto}>
            No aplica en {sustituidaEn.join(", ")}
          </Text>
        </View>
      )}
    </View>
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
              <EtiquetaOrigen tarifa={tarifa} />
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
              <EtiquetaOrigen tarifa={tarifa} />
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
  badgeFila: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: -6,
    marginBottom: 12,
  },
  badgeObra: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#FDEEE7",
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: -6,
    marginBottom: 12,
  },
  badgeObraTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  badgeDefault: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeDefaultTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  badgeSustituida: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#FDF3E3",
    borderWidth: 1,
    borderColor: colors.warning,
  },
  badgeSustituidaTexto: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "700",
    color: colors.warning,
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
