/**
 * AcarreosScreen.js - CON ESTADOS VERIFICADO Y CONCILIADO
 *
 * CAMBIOS:
 * - Agregadas secciones Verificados y Conciliados
 * - odos los colapsables vienen expandidos por defecto
 * - Visible para todos los roles (incluido RESIDENTE)
 */

import React, { useState, useEffect, useRef } from "react";
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
import { VALE_SELECT_COMPLETO } from "../hooks/queries/valesSelect";
import { useAuth } from "../hooks/useAuth";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useObras } from "../hooks/useObras";
// Estilos
import { commonStyles, listScreenStyles } from "../styles";

import { useAcarreosFilters } from "../hooks/useAcarreosFilters";
import FilterBar from "../componets/acarreos/FilterBar";
import { useCatalogos } from "../hooks/useCatalogos";

import ValeCard from "../componets/acarreos/ValeCard";
import ValeDetalleModal from "../componets/acarreos/ValeDetalleModal";

import CollapsibleSection from "../componets/common/CollapsibleSection";

const AcarreosScreen = () => {
  const { userProfile, userRole } = useAuth();
  const route = useRoute();
  const esChecador = userRole === "CHECADOR";

  //  Obtener obras asignadas (incluir loading)
  const { obras, loading: obrasLoading } = useObras(userProfile?.id_persona);

  const [valesMaterial, setValesMaterial] = useState([]);
  const [valesRenta, setValesRenta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVale, setSelectedVale] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { materiales, sindicatos, operadores, vehiculos } = useCatalogos([
    "materiales",
    "sindicatos",
    "operadores",
    "vehiculos",
  ]);

  const { filters, setFilter, clearFilters, applyFilters, activeCount } =
    useAcarreosFilters(null, esChecador);

  const isMounted = useRef(true);
  const isFetching = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // 🆕 Esperar a que obras esté cargado y que haya obras disponibles
      if (
        isMounted.current &&
        userProfile?.id_persona &&
        !isFetching.current &&
        !obrasLoading && // ✅ Esperar a que termine de cargar
        obras.length > 0 // ✅ Asegurar que hay obras
      ) {
        fetchVales();
      }
    }, [userProfile?.id_persona, obras, obrasLoading]), // ✅ Agregar dependencias
  );

  // Abrir modal automáticamente si viene un vale escaneado desde ValesScreen
  useEffect(() => {
    const valeEscaneado = route.params?.valeEscaneado;
    if (!valeEscaneado) return;

    // Esperar a que la pantalla cargue los vales antes de abrir el modal
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setSelectedVale(valeEscaneado);
        setModalVisible(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [route.params?.valeEscaneado]);

  const fetchVales = async () => {
    if (!userProfile?.id_persona) {
      return;
    }

    if (isFetching.current) {
      return;
    }

    try {
      isFetching.current = true;

      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }

      // 🆕 Obtener IDs de todas las obras asignadas
      const obrasIds = obras.map((obra) => obra.id).filter(Boolean);

      // Si no hay obras asignadas, retornar vacío
      if (obrasIds.length === 0) {
        console.log("[AcarreosScreen] No hay obras asignadas");
        if (isMounted.current) {
          setValesMaterial([]);
          setValesRenta([]);
          setLoading(false);
        }
        isFetching.current = false;
        return;
      }

      let queryVales = supabase
        .from("vales")
        .select(VALE_SELECT_COMPLETO)
        .in("id_obra", obrasIds)
        .order("fecha_creacion", { ascending: false });

      if (esChecador) {
        queryVales = queryVales.not(
          "estado",
          "in",
          '("verificado","conciliado")',
        );
      }

      const { data: valesData, error: valesError } = await queryVales;

      if (valesError) throw valesError;

      const material = valesData.filter((v) => v.tipo_vale === "material");
      const renta = valesData.filter((v) => v.tipo_vale === "renta");

      if (isMounted.current) {
        setValesMaterial(material);
        setValesRenta(renta);
      }
    } catch (error) {
      console.error("[AcarreosScreen] Error fetchVales:", error.message);

      if (
        isMounted.current &&
        error.message !== "Failed to fetch" &&
        error.message !== "Network request failed"
      ) {
        setError(error.message);
      }
    } finally {
      isFetching.current = false;

      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    if (isMounted.current) {
      setRefreshing(true);
    }
    await fetchVales();
    if (isMounted.current) {
      setRefreshing(false);
    }
  };

  const handleOpenVale = (vale) => {
    if (isMounted.current) {
      setSelectedVale(vale);
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    if (isMounted.current) {
      setModalVisible(false);
      setSelectedVale(null);
    }
  };

  const filterVales = (vales) => {
    if (!vales || !Array.isArray(vales)) return [];

    let resultado = vales;

    // Filtro de búsqueda por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      resultado = resultado.filter((vale) => {
        const folio = vale.folio?.toLowerCase() || "";
        const operador = vale.operadores?.nombre_completo?.toLowerCase() || "";
        const placas = vale.vehiculos?.placas?.toLowerCase() || "";
        return (
          folio.includes(query) ||
          operador.includes(query) ||
          placas.includes(query)
        );
      });
    }

    // Filtros avanzados del hook
    return applyFilters(resultado, operadores);
  };

  const filteredValesMaterial = filterVales(valesMaterial);
  const filteredValesRenta = filterVales(valesRenta);

  /**
   * Separa vales por estado: en_proceso, emitido, verificado, conciliado
   */
  const separateValesByStatus = (vales) => {
    if (!vales || !Array.isArray(vales)) {
      return {
        enProceso: [],
        emitidos: [],
        verificados: [],
        conciliados: [],
        cancelados: [],
      };
    }

    return {
      enProceso: vales.filter((v) => v.estado === "en_proceso"),
      emitidos: vales.filter((v) => v.estado === "emitido"),
      verificados: vales.filter((v) => v.estado === "verificado"),
      conciliados: vales.filter((v) => v.estado === "conciliado"),
      cancelados: vales.filter((v) => v.estado === "cancelado"),
    };
  };

  const materialSeparado = separateValesByStatus(filteredValesMaterial);
  const rentaSeparado = separateValesByStatus(filteredValesRenta);

  const renderValeItem = ({ item }) => {
    return <ValeCard vale={item} onPress={() => handleOpenVale(item)} />;
  };

  const EmptyState = ({ icon, text }) => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name={icon}
        size={50}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );

  if (!userProfile?.id_persona) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil de usuario...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {refreshing ? "Actualizando..." : "Cargando acarreos..."}
        </Text>
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
    <>
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
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          setFilter={setFilter}
          clearFilters={clearFilters}
          activeCount={activeCount}
          obras={obras}
          materiales={materiales}
          sindicatos={sindicatos}
          operadores={operadores}
          vehiculos={vehiculos}
          esChecador={esChecador}
        />

        {/* ========== SECCIÓN MATERIAL ========== */}
        <View style={styles.section}>
          <Text style={styles.categoryTitle}>Material</Text>

          {/* Material - En Proceso */}
          <CollapsibleSection
            title="En Proceso"
            icon="progress-clock"
            count={materialSeparado.enProceso.length}
            defaultCollapsed={false}
            iconColor={colors.warning}
            badgeColor={colors.warning}
          >
            <FlatList
              data={materialSeparado.enProceso}
              renderItem={renderValeItem}
              keyExtractor={(item) => item.id_vale.toString()}
              ListEmptyComponent={() => (
                <EmptyState
                  icon="package-variant-closed"
                  text={
                    searchQuery
                      ? "No se encontraron vales en proceso"
                      : "No hay vales de material en proceso"
                  }
                />
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </CollapsibleSection>

          {/* Material - Emitidos */}
          <CollapsibleSection
            title="Emitidos"
            icon="check-circle"
            count={materialSeparado.emitidos.length}
            defaultCollapsed={true}
            iconColor={colors.accent}
            badgeColor={colors.accent}
          >
            <FlatList
              data={materialSeparado.emitidos}
              renderItem={renderValeItem}
              keyExtractor={(item) => item.id_vale.toString()}
              ListEmptyComponent={() => (
                <EmptyState
                  icon="package-variant-closed"
                  text={
                    searchQuery
                      ? "No se encontraron vales emitidos"
                      : "No hay vales de material emitidos"
                  }
                />
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </CollapsibleSection>

          {/* Material - Verificados */}
          {!esChecador && (
            <CollapsibleSection
              title="Verificados"
              icon="check-decagram"
              count={materialSeparado.verificados.length}
              defaultCollapsed={true}
              iconColor={colors.info}
              badgeColor={colors.info}
            >
              <FlatList
                data={materialSeparado.verificados}
                renderItem={renderValeItem}
                keyExtractor={(item) => item.id_vale.toString()}
                ListEmptyComponent={() => (
                  <EmptyState
                    icon="package-variant-closed"
                    text={
                      searchQuery
                        ? "No se encontraron vales verificados"
                        : "No hay vales de material verificados"
                    }
                  />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </CollapsibleSection>
          )}

          {/* Material - Conciliados */}
          {!esChecador && (
            <CollapsibleSection
              title="Conciliados"
              icon="currency-usd"
              count={materialSeparado.conciliados.length}
              defaultCollapsed={true}
              iconColor={colors.success}
              badgeColor={colors.success}
            >
              <FlatList
                data={materialSeparado.conciliados}
                renderItem={renderValeItem}
                keyExtractor={(item) => item.id_vale.toString()}
                ListEmptyComponent={() => (
                  <EmptyState
                    icon="package-variant-closed"
                    text={
                      searchQuery
                        ? "No se encontraron vales conciliados"
                        : "No hay vales de material conciliados"
                    }
                  />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </CollapsibleSection>
          )}
          {/* Material - Cancelados */}
          {!esChecador && (
            <CollapsibleSection
              title="Cancelados"
              icon="cancel"
              count={materialSeparado.cancelados.length}
              defaultCollapsed={true}
              iconColor={colors.danger}
              badgeColor={colors.danger}
            >
              <FlatList
                data={materialSeparado.cancelados}
                renderItem={renderValeItem}
                keyExtractor={(item) => item.id_vale.toString()}
                ListEmptyComponent={() => (
                  <EmptyState
                    icon="package-variant-closed"
                    text={
                      searchQuery
                        ? "No se encontraron vales cancelados"
                        : "No hay vales de material cancelados"
                    }
                  />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </CollapsibleSection>
          )}
        </View>

        {/* ========== SECCIÓN RENTA ========== */}
        <View style={styles.section}>
          <Text style={styles.categoryTitle}> Renta</Text>

          {/* Renta - En Proceso */}
          <CollapsibleSection
            title="En Proceso"
            icon="progress-clock"
            count={rentaSeparado.enProceso.length}
            defaultCollapsed={false}
            iconColor={colors.warning}
            badgeColor={colors.warning}
          >
            <FlatList
              data={rentaSeparado.enProceso}
              renderItem={renderValeItem}
              keyExtractor={(item) => item.id_vale.toString()}
              ListEmptyComponent={() => (
                <EmptyState
                  icon="truck-outline"
                  text={
                    searchQuery
                      ? "No se encontraron vales en proceso"
                      : "No hay vales de renta en proceso"
                  }
                />
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </CollapsibleSection>

          {/* Renta - Emitidos */}
          <CollapsibleSection
            title="Emitidos"
            icon="check-circle"
            count={rentaSeparado.emitidos.length}
            defaultCollapsed={true}
            iconColor={colors.accent}
            badgeColor={colors.accent}
          >
            <FlatList
              data={rentaSeparado.emitidos}
              renderItem={renderValeItem}
              keyExtractor={(item) => item.id_vale.toString()}
              ListEmptyComponent={() => (
                <EmptyState
                  icon="truck-outline"
                  text={
                    searchQuery
                      ? "No se encontraron vales emitidos"
                      : "No hay vales de renta emitidos"
                  }
                />
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </CollapsibleSection>
          {/* Renta - Verificados */}
          {!esChecador && (
            <CollapsibleSection
              title="Verificados"
              icon="check-decagram"
              count={rentaSeparado.verificados.length}
              defaultCollapsed={true}
              iconColor={colors.info}
              badgeColor={colors.info}
            >
              <FlatList
                data={rentaSeparado.verificados}
                renderItem={renderValeItem}
                keyExtractor={(item) => item.id_vale.toString()}
                ListEmptyComponent={() => (
                  <EmptyState
                    icon="truck-outline"
                    text={
                      searchQuery
                        ? "No se encontraron vales verificados"
                        : "No hay vales de renta verificados"
                    }
                  />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </CollapsibleSection>
          )}

          {/* Renta - Conciliados */}
          {!esChecador && (
            <CollapsibleSection
              title="Conciliados"
              icon="currency-usd"
              count={rentaSeparado.conciliados.length}
              defaultCollapsed={true}
              iconColor={colors.success}
              badgeColor={colors.success}
            >
              <FlatList
                data={rentaSeparado.conciliados}
                renderItem={renderValeItem}
                keyExtractor={(item) => item.id_vale.toString()}
                ListEmptyComponent={() => (
                  <EmptyState
                    icon="truck-outline"
                    text={
                      searchQuery
                        ? "No se encontraron vales conciliados"
                        : "No hay vales de renta conciliados"
                    }
                  />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </CollapsibleSection>
          )}

          {/* Renta - Cancelados */}
          {!esChecador && (
            <CollapsibleSection
              title="Cancelados"
              icon="cancel"
              count={rentaSeparado.cancelados.length}
              defaultCollapsed={true}
              iconColor={colors.danger}
              badgeColor={colors.danger}
            >
              <FlatList
                data={rentaSeparado.cancelados}
                renderItem={renderValeItem}
                keyExtractor={(item) => item.id_vale.toString()}
                ListEmptyComponent={() => (
                  <EmptyState
                    icon="truck-outline"
                    text={
                      searchQuery
                        ? "No se encontraron vales cancelados"
                        : "No hay vales de renta cancelados"
                    }
                  />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </CollapsibleSection>
          )}
        </View>
      </ScrollView>

      {/* Modal */}
      <ValeDetalleModal
        visible={modalVisible}
        vale={selectedVale}
        onClose={handleCloseModal}
        onRefresh={fetchVales}
      />
    </>
  );
};

const styles = {
  ...commonStyles,
  ...listScreenStyles,
};

export default AcarreosScreen;
