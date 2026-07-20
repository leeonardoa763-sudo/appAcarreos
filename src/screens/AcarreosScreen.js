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

import SeccionValesPorEstado from "../componets/acarreos/SeccionValesPorEstado";
import ValeDetalleModal from "../componets/acarreos/ValeDetalleModal";
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
  const [valesPipas, setValesPipas] = useState([]);
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
          setValesPipas([]);
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
      // Renta de equipo y pipas de agua son ambos tipo_vale="renta"; se separan
      // por el sello es_pipa_agua (ver utils/pipasAgua).
      let renta = valesData.filter(
        (v) => v.tipo_vale === "renta" && !v.es_pipa_agua,
      );
      let pipas = valesData.filter(
        (v) => v.tipo_vale === "renta" && v.es_pipa_agua,
      );

      // Vales de planta y vales de obra son mundos separados: cada rol solo
      // ve los suyos (ver utils/plantaAsfaltos). Además, el rol Planta de
      // Asfaltos no gestiona renta ni pipas en esta pantalla.
      material = filtrarValesMaterialPorRol(material, userRole);
      if (esPlantaAsfaltos) {
        renta = [];
        pipas = [];
      }

      if (isMounted.current) {
        setValesMaterial(material);
        setValesRenta(renta);
        setValesPipas(pipas);
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

  const filteredValesPipas = useMemo(
    () => filterVales(valesPipas),
    [valesPipas, searchQuery, filters, operadores],
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

  const pipasSeparado = useMemo(
    () => separateValesByStatus(filteredValesPipas),
    [filteredValesPipas],
  );

  // ─── Paginación visual por sección ────────────────────────────────────────

  const { secciones: matPag, resetear: resetMatPag } =
    useSectionPagination(materialSeparado);

  const { secciones: rentaPag, resetear: resetRentaPag } =
    useSectionPagination(rentaSeparado);

  const { secciones: pipasPag, resetear: resetPipasPag } =
    useSectionPagination(pipasSeparado);

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
      resetPipasPag();
      prevSearchRef.current = searchQuery;
      prevFiltersRef.current = filters;
    }
  }, [searchQuery, filters]);

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
        <SeccionValesPorEstado
          titulo="Material"
          nombreTipo="material"
          emptyIcon="package-variant-closed"
          pag={matPag}
          separado={materialSeparado}
          esAdministrador={esAdministrador}
          esChecador={esChecador}
          searchQuery={searchQuery}
          onOpenVale={handleOpenVale}
        />

        {/* ========== SECCIÓN RENTA ========== */}
        <SeccionValesPorEstado
          titulo="Renta"
          nombreTipo="renta"
          emptyIcon="truck-outline"
          pag={rentaPag}
          separado={rentaSeparado}
          esAdministrador={esAdministrador}
          esChecador={esChecador}
          searchQuery={searchQuery}
          onOpenVale={handleOpenVale}
        />

        {/* ========== SECCIÓN PIPAS DE AGUA ========== */}
        <SeccionValesPorEstado
          titulo="Pipas de Agua"
          nombreTipo="pipa de agua"
          emptyIcon="water-off"
          pag={pipasPag}
          separado={pipasSeparado}
          esAdministrador={esAdministrador}
          esChecador={esChecador}
          searchQuery={searchQuery}
          onOpenVale={handleOpenVale}
        />
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
