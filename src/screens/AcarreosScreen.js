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

//Estilos
import { commonStyles, listScreenStyles } from "../styles";

import ValeCard from "../componets/acarreos/ValeCard";
import ValeDetalleModal from "../componets/acarreos/ValeDetalleModal";
import SearchBar from "../componets/common/SearchBar";
import CollapsibleSection from "../componets/common/CollapsibleSection";

const AcarreosScreen = () => {
  const { userProfile } = useAuth();

  const [valesMaterial, setValesMaterial] = useState([]);
  const [valesRenta, setValesRenta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVale, setSelectedVale] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
          obras (
            obra,
            cc,
            empresas (
              empresa,
              sufijo,
              logo
            )
          ),
          persona:id_persona_creador (
              nombre,
              primer_apellido,
              segundo_apellido
           ),
          vale_material_detalles (
            *,
            material (material),
            bancos (banco)
          ),
          vale_renta_detalle (
            *,
            material (material),
            sindicatos (sindicato),
            precios_renta (
              costo_hr,
              costo_dia
            )
          )
        `
        )
        .eq("id_persona_creador", userProfile.id_persona)
        .order("fecha_creacion", { ascending: false });

      if (valesError) throw valesError;

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

  const filterVales = (vales) => {
    if (!searchQuery.trim()) return vales;

    const query = searchQuery.toLowerCase().trim();

    return vales.filter((vale) => {
      const folio = vale.folio?.toLowerCase() || "";
      const operador = vale.operador_nombre?.toLowerCase() || "";
      const placas = vale.placas_vehiculo?.toLowerCase() || "";

      return (
        folio.includes(query) ||
        operador.includes(query) ||
        placas.includes(query)
      );
    });
  };

  const filteredValesMaterial = filterVales(valesMaterial);
  const filteredValesRenta = filterVales(valesRenta);

  const separateValesByStatus = (vales, tipo) => {
    if (tipo === "material") {
      const enProceso = vales.filter((vale) => vale.estado === "en_proceso");
      const completados = vales.filter((vale) => vale.estado === "emitido");
      return { enProceso, completados };
    } else if (tipo === "renta") {
      const enProceso = vales.filter((vale) => vale.estado === "en_proceso");
      const completados = vales.filter((vale) => vale.estado === "emitido");
      return { enProceso, completados };
    }
    return { enProceso: [], completados: [] };
  };

  const materialSeparado = separateValesByStatus(
    filteredValesMaterial,
    "material"
  );
  const rentaSeparado = separateValesByStatus(filteredValesRenta, "renta");

  const renderValeItem = ({ item }) => {
    return <ValeCard vale={item} onPress={() => handleOpenVale(item)} />;
  };

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
      {/* Barra de Búsqueda Global */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por folio, operador o placas"
        />
        {searchQuery.length > 0 && (
          <Text style={styles.searchResults}>
            {materialSeparado.enProceso.length +
              materialSeparado.completados.length +
              rentaSeparado.enProceso.length +
              rentaSeparado.completados.length}{" "}
            resultado(s)
          </Text>
        )}
      </View>

      {/* Sección Material */}
      <View style={styles.section}>
        <Text style={styles.categoryTitle}> Material</Text>

        {/* Material - En Proceso */}
        <View style={styles.subsection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="progress-clock"
              size={24}
              color={colors.warning}
            />
            <Text style={styles.sectionTitle}>En Proceso</Text>
            <View style={[styles.badge, { backgroundColor: colors.warning }]}>
              <Text style={styles.badgeText}>
                {materialSeparado.enProceso.length}
              </Text>
            </View>
          </View>

          <View style={styles.valesContainer}>
            <FlatList
              data={materialSeparado.enProceso}
              renderItem={renderValeItem}
              keyExtractor={(item) => item.id_vale.toString()}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="package-variant-closed"
                    size={50}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? "No se encontraron vales en proceso"
                      : "No hay vales de material en proceso"}
                  </Text>
                </View>
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>

        {/* Material - Completados (Colapsable) */}
        <CollapsibleSection
          title="Emitidos"
          icon="check-circle"
          count={materialSeparado.completados.length}
          defaultCollapsed={true}
          iconColor={colors.accent}
          badgeColor={colors.accent}
        >
          <FlatList
            data={materialSeparado.completados}
            renderItem={renderValeItem}
            keyExtractor={(item) => item.id_vale.toString()}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={50}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No se encontraron vales completados"
                    : "No hay vales de material completados"}
                </Text>
              </View>
            )}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </CollapsibleSection>
      </View>

      {/* Sección Renta */}
      <View style={styles.section}>
        <Text style={styles.categoryTitle}> Renta</Text>

        {/* Renta - En Proceso */}
        <View style={styles.subsection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="progress-clock"
              size={24}
              color={colors.warning}
            />
            <Text style={styles.sectionTitle}>En Proceso</Text>
            <View style={[styles.badge, { backgroundColor: colors.warning }]}>
              <Text style={styles.badgeText}>
                {rentaSeparado.enProceso.length}
              </Text>
            </View>
          </View>

          <View style={styles.valesContainer}>
            <FlatList
              data={rentaSeparado.enProceso}
              renderItem={renderValeItem}
              keyExtractor={(item) => item.id_vale.toString()}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="truck-outline"
                    size={50}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? "No se encontraron vales en proceso"
                      : "No hay vales de renta en proceso"}
                  </Text>
                </View>
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>

        {/* Renta - Completados (Colapsable) */}
        <CollapsibleSection
          title="Emitidos"
          icon="check-circle"
          count={rentaSeparado.completados.length}
          defaultCollapsed={true}
          iconColor={colors.accent}
          badgeColor={colors.accent}
        >
          <FlatList
            data={rentaSeparado.completados}
            renderItem={renderValeItem}
            keyExtractor={(item) => item.id_vale.toString()}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="truck-outline"
                  size={50}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No se encontraron vales completados"
                    : "No hay vales de renta completados"}
                </Text>
              </View>
            )}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </CollapsibleSection>
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

const styles = {
  ...commonStyles,
  ...listScreenStyles,
};

export default AcarreosScreen;
