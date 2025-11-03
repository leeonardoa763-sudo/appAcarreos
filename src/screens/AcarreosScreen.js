/**
 * AcarreosScreen.js
 *
 * Pantalla para visualizar todos los vales creados por el usuario
 *
 * PROPÓSITO:
 * - Mostrar vales de Material y Renta en secciones separadas
 * - Permitir ver detalle de cada vale al presionarlo
 * - Permitir capturar hora de salida en vales de renta pendientes
 *
 * FLUJO:
 * 1. Carga vales del usuario desde Supabase
 * 2. Separa por tipo (material/renta)
 * 3. Muestra en dos secciones siempre visibles
 * 4. Al presionar vale → abre modal con detalle
 *
 * NAVEGACIÓN:
 * BottomTabNavigator → AcarreosScreen
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";
import ValeCard from "../componets/acarreos/ValeCard";
import ValeDetalleModal from "../componets/acarreos/ValeDetalleModal";

const AcarreosScreen = () => {
  const { userProfile } = useAuth();

  const [valesMaterial, setValesMaterial] = useState([]);
  const [valesRenta, setValesRenta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVale, setSelectedVale] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (userProfile?.id_persona) {
      fetchVales();
    }
  }, [userProfile]);

  const fetchVales = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: valesData, error: valesError } = await supabase
        .from("vales")
        .select(
          `
          *,
          vale_material_detalles (*),
          vale_renta_detalle (*)
        `
        )
        .eq("id_persona_creador", userProfile.id_persona)
        .order("fecha_creacion", { ascending: false });

      if (valesError) throw valesError;

      const material = valesData.filter((v) => v.tipo_vale === "material");
      const renta = valesData.filter((v) => v.tipo_vale === "renta");

      setValesMaterial(material);
      setValesRenta(renta);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVales();
    setRefreshing(false);
  };

  const handleOpenVale = (vale) => {
    setSelectedVale(vale);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedVale(null);
  };

  const renderValeItem = ({ item }) => (
    <ValeCard vale={item} onPress={() => handleOpenVale(item)} />
  );

  const renderEmptyMaterial = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="package-variant-closed"
        size={50}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyText}>No hay vales de material</Text>
    </View>
  );

  const renderEmptyRenta = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="truck-outline"
        size={50}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyText}>No hay vales de renta</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando acarreos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={60}
          color={colors.danger}
        />
        <Text style={styles.errorText}>Error al cargar los vales</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* Sección Material */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="package-variant"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.sectionTitle}>Material</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{valesMaterial.length}</Text>
          </View>
        </View>

        <View style={styles.valesContainer}>
          <FlatList
            data={valesMaterial}
            renderItem={renderValeItem}
            keyExtractor={(item) => item.id_vale.toString()}
            ListEmptyComponent={renderEmptyMaterial}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Sección Renta */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="truck-cargo-container"
            size={24}
            color={colors.secondary}
          />
          <Text style={styles.sectionTitle}>Renta</Text>
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Text style={styles.badgeText}>{valesRenta.length}</Text>
          </View>
        </View>

        <View style={styles.valesContainer}>
          <FlatList
            data={valesRenta}
            renderItem={renderValeItem}
            keyExtractor={(item) => item.id_vale.toString()}
            ListEmptyComponent={renderEmptyRenta}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Modal de Detalle */}
      <ValeDetalleModal
        visible={modalVisible}
        vale={selectedVale}
        onClose={handleCloseModal}
        onRefresh={fetchVales}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colors.danger,
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  badgeText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "bold",
  },
  valesContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default AcarreosScreen;
