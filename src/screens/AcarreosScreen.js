/**
 * AcarreosScreen.js
 *
 * CAMBIOS:
 * - Agregadas secciones Verificados y Conciliados (solo Administrador)
 * - Paginación visual por sección (20 por defecto, "Ver más" para cargar más)
 * - useMemo en filtros y separación de estados
 * - Reset de paginación al cambiar búsqueda o filtros
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { VALE_SELECT_LISTA } from "../hooks/queries/valesSelect";
import { useAuth } from "../hooks/useAuth";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useObras } from "../hooks/useObras";
import { filtrarValesMaterialPorRol } from "../utils/plantaAsfaltos";
import { commonStyles, listScreenStyles } from "../styles";

import { useAcarreosFilters } from "../hooks/useAcarreosFilters";
import FilterBar from "../componets/acarreos/FilterBar";
import { useCatalogos } from "../hooks/useCatalogos";
import { useSectionPagination } from "../hooks/useSectionPagination";

import ValeCard from "../componets/acarreos/ValeCard";
import ValeDetalleModal from "../componets/acarreos/ValeDetalleModal";
import CollapsibleSection from "../componets/common/CollapsibleSection";
import BotonVerMas from "../componets/common/BotonVerMas";
import ModalPruebaImpresion from "../componets/dev/ModalPruebaImpresion";
import TutorialValeDetalleModal from "../componets/tutorial/TutorialValeDetalleModal";
import { useTutorialSeen } from "../hooks/useTutorialSeen";

const AcarreosScreen = () => {
  const { userProfile, userRole } = useAuth();
  const route = useRoute();
  const esChecador = userRole === "CHECADOR";
  const esAdministrador = userRole === "Administrador";
  const esPlantaAsfaltos = userRole === "Planta de Asfaltos";

  const { obras, loading: obrasLoading } = useObras(userProfile?.id_persona, esAdministrador);

  const [valesMaterial, setValesMaterial] = useState([]);
  const [valesRenta, setValesRenta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVale, setSelectedVale] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalPruebaVisible, setModalPruebaVisible] = useState(false);

  const hoyInit = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState({
    mes: hoyInit.getMonth() + 1,
    anio: hoyInit.getFullYear(),
  });
  const mesSeleccionadoRef = useRef(mesSeleccionado);
  useEffect(() => {
    mesSeleccionadoRef.current = mesSeleccionado;
  }, [mesSeleccionado]);

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
  const lastFetchRef = useRef(0);
  // Ref para evitar stale closure: userRole llega en render separado a userProfile.id_persona
  const esAdministradorRef = useRef(esAdministrador);
  useEffect(() => {
    esAdministradorRef.current = esAdministrador;
  }, [esAdministrador]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (
        isMounted.current &&
        userProfile?.id_persona &&
        !isFetching.current &&
        !obrasLoading &&
        obras.length > 0
      ) {
        fetchVales();
      }
    }, [userProfile?.id_persona, obras, obrasLoading, esAdministrador]),
  );

  // Si esAdministrador carga después del primer fetch (stale closure), fuerza re-fetch
  useEffect(() => {
    if (esAdministrador && obras.length > 0 && !obrasLoading) {
      fetchVales(true, true);
    }
  }, [esAdministrador]);

  // Re-fetch al cambiar mes (solo admin)
  useEffect(() => {
    if (esAdministradorRef.current && obras.length > 0 && !obrasLoading) {
      fetchVales(false, true);
    }
  }, [mesSeleccionado]);

  const handleMesChange = (nuevoMes) => {
    setMesSeleccionado(nuevoMes);
    setSearchQuery("");
  };

  // Abrir modal automáticamente si viene un vale escaneado desde ValesScreen
  useEffect(() => {
    const valeEscaneado = route.params?.valeEscaneado;
    if (!valeEscaneado) return;

    const timer = setTimeout(() => {
      if (isMounted.current) {
        setSelectedVale(valeEscaneado);
        setModalVisible(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [route.params?.valeEscaneado]);

  // ─── Tutorial guiado (checador): vale ficticio simulado ────────────────────
  // Independiente del efecto de valeEscaneado real (arriba): usa un nombre de
  // parámetro distinto para nunca disparar un fetch real a Supabase con un
  // id_vale ficticio. Ver src/componets/tutorial/TutorialValeDetalleModal.js.

  const tutorialSeenAcarreos = useTutorialSeen(esChecador ? "CHECADOR" : null);
  const [tutorialValeVisible, setTutorialValeVisible] = useState(false);
  const [tutorialValeFake, setTutorialValeFake] = useState(null);

  useEffect(() => {
    const valeFicticio = route.params?.tutorialValeFicticio;
    if (!valeFicticio) return;

    const timer = setTimeout(() => {
      if (isMounted.current) {
        setTutorialValeFake(valeFicticio);
        setTutorialValeVisible(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [route.params?.tutorialValeFicticio, route.params?.tutorialTs]);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchVales = async (silent = false, force = false) => {
    if (!userProfile?.id_persona) return;
    if (isFetching.current) return;
    if (!force && Date.now() - lastFetchRef.current < 30000) return;

    try {
      isFetching.current = true;

      if (isMounted.current) {
        if (!silent) setLoading(true);
        setError(null);
      }

      const obrasIds = obras.map((obra) => obra.id).filter(Boolean);

      if (obrasIds.length === 0) {
        if (isMounted.current) {
          setValesMaterial([]);
          setValesRenta([]);
          setLoading(false);
        }
        isFetching.current = false;
        return;
      }

      const esAdmin = esAdministradorRef.current;
      const { mes, anio } = mesSeleccionadoRef.current;

      let queryBase = supabase
        .from("vales")
        .select(VALE_SELECT_LISTA)
        .in("id_obra", obrasIds)
        .order("fecha_creacion", { ascending: false });

      let valesData;

      if (esAdmin) {
        // Admin: solo el mes seleccionado, todos los estados, sin límite artificial
        const mesStr = String(mes).padStart(2, "0");
        const inicioMes = `${anio}-${mesStr}-01`;
        const finMes =
          mes === 12
            ? `${anio + 1}-01-01`
            : `${anio}-${String(mes + 1).padStart(2, "0")}-01`;

        const { data, error } = await queryBase
          .gte("fecha_creacion", inicioMes)
          .lt("fecha_creacion", finMes);

        if (error) throw error;
        valesData = data || [];
      } else {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 60);
        const fechaLimiteStr = `${fechaLimite.getFullYear()}-${String(fechaLimite.getMonth() + 1).padStart(2, "0")}-${String(fechaLimite.getDate()).padStart(2, "0")}`;

        const { data, error } = await queryBase
          .gte("fecha_creacion", fechaLimiteStr)
          .not("estado", "in", '("verificado","conciliado")')
          .limit(1000);

        if (error) throw error;
        valesData = data || [];
      }

      let material = valesData.filter((v) => v.tipo_vale === "material");
      let renta = valesData.filter((v) => v.tipo_vale === "renta");

      // Vales de planta y vales de obra son mundos separados: cada rol solo
      // ve los suyos (ver utils/plantaAsfaltos). Además, el rol Planta de
      // Asfaltos no gestiona renta en esta pantalla.
      material = filtrarValesMaterialPorRol(material, userRole);
      if (esPlantaAsfaltos) {
        renta = [];
      }

      if (isMounted.current) {
        setValesMaterial(material);
        setValesRenta(renta);
        lastFetchRef.current = Date.now();
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
      if (isMounted.current) setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (isMounted.current) setRefreshing(true);
    await fetchVales(false, true);
    if (isMounted.current) setRefreshing(false);
  };

  const handleOpenVale = useCallback((vale) => {
    if (isMounted.current) {
      setSelectedVale(vale);
      setModalVisible(true);
    }
  }, []);

  const handleCloseModal = () => {
    if (isMounted.current) {
      setModalVisible(false);
      setSelectedVale(null);
    }
  };

  // ─── Filtros ──────────────────────────────────────────────────────────────

  const filterVales = (vales) => {
    if (!vales || !Array.isArray(vales)) return [];

    let resultado = vales;

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

    return applyFilters(resultado, operadores);
  };

  const filteredValesMaterial = useMemo(
    () => filterVales(valesMaterial),
    [valesMaterial, searchQuery, filters, operadores],
  );

  const filteredValesRenta = useMemo(
    () => filterVales(valesRenta),
    [valesRenta, searchQuery, filters, operadores],
  );

  // ─── Separación por estado ────────────────────────────────────────────────

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

  const materialSeparado = useMemo(
    () => separateValesByStatus(filteredValesMaterial),
    [filteredValesMaterial],
  );

  const rentaSeparado = useMemo(
    () => separateValesByStatus(filteredValesRenta),
    [filteredValesRenta],
  );

  // ─── Paginación visual por sección ────────────────────────────────────────

  const { secciones: matPag, resetear: resetMatPag } =
    useSectionPagination(materialSeparado);

  const { secciones: rentaPag, resetear: resetRentaPag } =
    useSectionPagination(rentaSeparado);

  // Resetear paginación al cambiar búsqueda o filtros
  const prevSearchRef = useRef(searchQuery);
  const prevFiltersRef = useRef(filters);

  useEffect(() => {
    if (
      prevSearchRef.current !== searchQuery ||
      prevFiltersRef.current !== filters
    ) {
      resetMatPag();
      resetRentaPag();
      prevSearchRef.current = searchQuery;
      prevFiltersRef.current = filters;
    }
  }, [searchQuery, filters]);

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderValeItem = useCallback(({ item }) => (
    <ValeCard vale={item} onPress={handleOpenVale} />
  ), [handleOpenVale]);

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

  const renderSeccion = (seccionPag, _seccionCompleta, emptyIcon, emptyText) => (
    <>
      <FlatList
        data={seccionPag.items}
        renderItem={renderValeItem}
        keyExtractor={(item) => item.id_vale.toString()}
        ListEmptyComponent={() => (
          <EmptyState icon={emptyIcon} text={emptyText} />
        )}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
      {seccionPag.hayMas && (
        <BotonVerMas
          onPress={seccionPag.cargarMas}
          totalMostrados={seccionPag.items.length}
          total={seccionPag.total}
        />
      )}
    </>
  );

  // ─── Guards ───────────────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
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
        esAdministrador={esAdministrador}
        mesSeleccionado={mesSeleccionado}
        onMesChange={handleMesChange}
      />

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
            {renderSeccion(
              matPag.enProceso,
              materialSeparado.enProceso,
              "package-variant-closed",
              searchQuery
                ? "No se encontraron vales en proceso"
                : "No hay vales de material en proceso",
            )}
          </CollapsibleSection>

          {/* Material - Emitidos */}
          <CollapsibleSection
            title="Emitidos"
            icon="check-circle"
            count={materialSeparado.emitidos.length}
            defaultCollapsed={true}
            forceExpanded={!!searchQuery.trim()}
            iconColor={colors.accent}
            badgeColor={colors.accent}
          >
            {renderSeccion(
              matPag.emitidos,
              materialSeparado.emitidos,
              "package-variant-closed",
              searchQuery
                ? "No se encontraron vales emitidos"
                : "No hay vales de material emitidos",
            )}
          </CollapsibleSection>

          {/* Material - Verificados (solo Administrador) */}
          {esAdministrador && (
            <CollapsibleSection
              title="Verificados"
              icon="check-decagram"
              count={materialSeparado.verificados.length}
              defaultCollapsed={true}
              forceExpanded={!!searchQuery.trim()}
              iconColor={colors.info}
              badgeColor={colors.info}
            >
              {renderSeccion(
                matPag.verificados,
                materialSeparado.verificados,
                "package-variant-closed",
                searchQuery
                  ? "No se encontraron vales verificados"
                  : "No hay vales de material verificados",
              )}
            </CollapsibleSection>
          )}

          {/* Material - Conciliados (solo Administrador) */}
          {esAdministrador && (
            <CollapsibleSection
              title="Conciliados"
              icon="currency-usd"
              count={materialSeparado.conciliados.length}
              defaultCollapsed={true}
              forceExpanded={!!searchQuery.trim()}
              iconColor={colors.success}
              badgeColor={colors.success}
            >
              {renderSeccion(
                matPag.conciliados,
                materialSeparado.conciliados,
                "package-variant-closed",
                searchQuery
                  ? "No se encontraron vales conciliados"
                  : "No hay vales de material conciliados",
              )}
            </CollapsibleSection>
          )}

          {/* Material - Cancelados (oculto para Checador) */}
          {!esChecador && (
            <CollapsibleSection
              title="Cancelados"
              icon="cancel"
              count={materialSeparado.cancelados.length}
              defaultCollapsed={true}
              forceExpanded={!!searchQuery.trim()}
              iconColor={colors.danger}
              badgeColor={colors.danger}
            >
              {renderSeccion(
                matPag.cancelados,
                materialSeparado.cancelados,
                "package-variant-closed",
                searchQuery
                  ? "No se encontraron vales cancelados"
                  : "No hay vales de material cancelados",
              )}
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
            {renderSeccion(
              rentaPag.enProceso,
              rentaSeparado.enProceso,
              "truck-outline",
              searchQuery
                ? "No se encontraron vales en proceso"
                : "No hay vales de renta en proceso",
            )}
          </CollapsibleSection>

          {/* Renta - Emitidos */}
          <CollapsibleSection
            title="Emitidos"
            icon="check-circle"
            count={rentaSeparado.emitidos.length}
            defaultCollapsed={true}
            forceExpanded={!!searchQuery.trim()}
            iconColor={colors.accent}
            badgeColor={colors.accent}
          >
            {renderSeccion(
              rentaPag.emitidos,
              rentaSeparado.emitidos,
              "truck-outline",
              searchQuery
                ? "No se encontraron vales emitidos"
                : "No hay vales de renta emitidos",
            )}
          </CollapsibleSection>

          {/* Renta - Verificados (solo Administrador) */}
          {esAdministrador && (
            <CollapsibleSection
              title="Verificados"
              icon="check-decagram"
              count={rentaSeparado.verificados.length}
              defaultCollapsed={true}
              forceExpanded={!!searchQuery.trim()}
              iconColor={colors.info}
              badgeColor={colors.info}
            >
              {renderSeccion(
                rentaPag.verificados,
                rentaSeparado.verificados,
                "truck-outline",
                searchQuery
                  ? "No se encontraron vales verificados"
                  : "No hay vales de renta verificados",
              )}
            </CollapsibleSection>
          )}

          {/* Renta - Conciliados (solo Administrador) */}
          {esAdministrador && (
            <CollapsibleSection
              title="Conciliados"
              icon="currency-usd"
              count={rentaSeparado.conciliados.length}
              defaultCollapsed={true}
              forceExpanded={!!searchQuery.trim()}
              iconColor={colors.success}
              badgeColor={colors.success}
            >
              {renderSeccion(
                rentaPag.conciliados,
                rentaSeparado.conciliados,
                "truck-outline",
                searchQuery
                  ? "No se encontraron vales conciliados"
                  : "No hay vales de renta conciliados",
              )}
            </CollapsibleSection>
          )}

          {/* Renta - Cancelados (oculto para Checador) */}
          {!esChecador && (
            <CollapsibleSection
              title="Cancelados"
              icon="cancel"
              count={rentaSeparado.cancelados.length}
              defaultCollapsed={true}
              forceExpanded={!!searchQuery.trim()}
              iconColor={colors.danger}
              badgeColor={colors.danger}
            >
              {renderSeccion(
                rentaPag.cancelados,
                rentaSeparado.cancelados,
                "truck-outline",
                searchQuery
                  ? "No se encontraron vales cancelados"
                  : "No hay vales de renta cancelados",
              )}
            </CollapsibleSection>
          )}
        </View>
      </ScrollView>

      <ValeDetalleModal
        visible={modalVisible}
        vale={selectedVale}
        onClose={handleCloseModal}
        onRefresh={() => fetchVales(true, true)}
      />

      <TutorialValeDetalleModal
        visible={tutorialValeVisible}
        vale={tutorialValeFake}
        onClose={() => setTutorialValeVisible(false)}
        onFinalizarTutorial={() => tutorialSeenAcarreos.markSeen()}
      />
    </>
  );
};

const styles = {
  ...commonStyles,
  ...listScreenStyles,
  botonDev: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 80,
    right: 16,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 99,
  },
  botonDevTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
  },
};

export default AcarreosScreen;
