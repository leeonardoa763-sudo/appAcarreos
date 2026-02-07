import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";
import { formatearFecha } from "../utils/formatters";

import SearchBar from "../componets/common/SearchBar";
import CollapsibleSection from "../componets/common/CollapsibleSection";
import ValeDetalleModal from "../componets/acarreos/ValeDetalleModal";

const ArchivadosScreen = () => {
  const { userProfile } = useAuth();

  const [valesMaterial, setValesMaterial] = useState([]);
  const [valesRenta, setValesRenta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVale, setSelectedVale] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (userProfile?.id_persona) {
      fetchValesArchivados();
    }
  }, [userProfile?.id_persona]);

  const fetchValesArchivados = async () => {
    if (!userProfile?.id_persona) return;

    try {
      if (isMounted.current) {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from("vales")
        .select(
          `
          id_vale,
          folio,
          fecha_creacion,
          tipo_vale,
          estado,
          obras (obra),
          operadores:id_operador (nombre_completo),
          vehiculos:id_vehiculo (placas)
        `,
        )
        .eq("id_persona_creador", userProfile.id_persona)
        .eq("archivado", true)
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;

      const material = data.filter((v) => v.tipo_vale === "material");
      const renta = data.filter((v) => v.tipo_vale === "renta");

      if (isMounted.current) {
        setValesMaterial(material);
        setValesRenta(renta);
      }
    } catch (error) {
      console.error("[ArchivadosScreen] Error:", error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    if (isMounted.current) setRefreshing(true);
    await fetchValesArchivados();
    if (isMounted.current) setRefreshing(false);
  };

  const handleOpenVale = async (vale) => {
    try {
      const { data, error } = await supabase
        .from("vales")
        .select(
          `
          *,
          obras (obra, cc, empresas (empresa, sufijo, logo)),
          persona:id_persona_creador (nombre, primer_apellido, segundo_apellido),
          persona_completador:id_persona_completador (nombre, primer_apellido, segundo_apellido),
          operadores:id_operador (nombre_completo),
          vehiculos:id_vehiculo (placas, sindicatos:id_sindicato (sindicato)),
          vale_material_detalles (*,
            material:id_material (material),
            bancos:id_banco (banco)
          ),
          vale_renta_detalle (*,
            material:id_material (material),
            sindicatos:id_sindicato (sindicato),
            precios_renta (costo_hr, costo_dia)
          )
        `,
        )
        .eq("id_vale", vale.id_vale)
        .single();

      if (error) throw error;

      if (isMounted.current) {
        setSelectedVale(data);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("[ArchivadosScreen] Error cargando detalle:", error);
    }
  };

  const filterVales = (vales) => {
    if (!vales || !Array.isArray(vales)) return [];
    if (!searchQuery.trim()) return vales;

    const query = searchQuery.toLowerCase().trim();
    return vales.filter((vale) => vale.folio?.toLowerCase().includes(query));
  };

  const renderValeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.valeItem}
      onPress={() => handleOpenVale(item)}
    >
      <View style={styles.valeInfo}>
        <Text style={styles.folio}>{item.folio}</Text>
        <Text style={styles.fecha}>{formatearFecha(item.fecha_creacion)}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  if (!userProfile?.id_persona) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando archivados...</Text>
      </View>
    );
  }

  const filteredMaterial = filterVales(valesMaterial);
  const filteredRenta = filterVales(valesRenta);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por folio"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.categoryTitle}>Material</Text>
          <CollapsibleSection
            title="Archivados"
            icon="archive"
            count={filteredMaterial.length}
            defaultCollapsed={false}
            iconColor={colors.textSecondary}
            badgeColor={colors.textSecondary}
          >
            <FlatList
              data={filteredMaterial}
              renderItem={renderValeItem}
              keyExtractor={(item) => item.id_vale.toString()}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="archive-off"
                    size={50}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? "No se encontraron vales"
                      : "No hay vales de material archivados"}
                  </Text>
                </View>
              )}
              scrollEnabled={false}
            />
          </CollapsibleSection>
        </View>

        <View style={styles.section}>
          <Text style={styles.categoryTitle}> Renta</Text>
          <CollapsibleSection
            title="Archivados"
            icon="archive"
            count={filteredRenta.length}
            defaultCollapsed={false}
            iconColor={colors.textSecondary}
            badgeColor={colors.textSecondary}
          >
            <FlatList
              data={filteredRenta}
              renderItem={renderValeItem}
              keyExtractor={(item) => item.id_vale.toString()}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="archive-off"
                    size={50}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? "No se encontraron vales"
                      : "No hay vales de renta archivados"}
                  </Text>
                </View>
              )}
              scrollEnabled={false}
            />
          </CollapsibleSection>
        </View>
      </ScrollView>

      <ValeDetalleModal
        visible={modalVisible}
        vale={selectedVale}
        onClose={() => {
          if (isMounted.current) {
            setModalVisible(false);
            setSelectedVale(null);
          }
        }}
        onRefresh={fetchValesArchivados}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchContainer: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  valeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  valeInfo: {
    flex: 1,
  },
  folio: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  fecha: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
});

export default ArchivadosScreen;
