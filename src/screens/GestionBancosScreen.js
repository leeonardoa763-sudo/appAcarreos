import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { useGestionBancos } from "../hooks/useGestionBancos";
import { useCatalogos } from "../hooks/useCatalogos";
import crossAlert from "../utils/crossAlert";
import { estilosBancos as estilos } from "../componets/bancos/gestionBancosStyles";
import { FilaBanco, FilaRegistro } from "../componets/bancos/GestionBancosFilas";
import {
  ModalBanco,
  ModalDistancia,
  ModalDistanciaPlanta,
  ModalPesoEspecifico,
} from "../componets/bancos/GestionBancosModales";

const PESTANAS = ["Bancos", "Distancias", "Dist. Planta", "Pesos"];
const CATALOGOS_REQUERIDOS = ["materiales"];

const contiene = (texto, query) =>
  String(texto ?? "").toLowerCase().includes(query);

export default function GestionBancosScreen() {
  const {
    bancos,
    distancias,
    distanciasPlanta,
    pesosEspecificos,
    loading,
    error,
    cargarTodo,
    crearBanco,
    editarBanco,
    crearDistancia,
    editarDistancia,
    eliminarDistancia,
    crearDistanciaPlanta,
    editarDistanciaPlanta,
    eliminarDistanciaPlanta,
    crearPeso,
    editarPeso,
    eliminarPeso,
  } = useGestionBancos();

  const { materiales } = useCatalogos(CATALOGOS_REQUERIDOS);
  const [obras, setObras] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState("Bancos");
  const [busqueda, setBusqueda] = useState("");
  const [refrescando, setRefrescando] = useState(false);

  const [modalBancoVisible, setModalBancoVisible] = useState(false);
  const [bancoSeleccionado, setBancoSeleccionado] = useState(null);

  const [modalDistanciaVisible, setModalDistanciaVisible] = useState(false);
  const [distanciaSeleccionada, setDistanciaSeleccionada] = useState(null);

  const [modalDistanciaPlantaVisible, setModalDistanciaPlantaVisible] =
    useState(false);
  const [distanciaPlantaSeleccionada, setDistanciaPlantaSeleccionada] =
    useState(null);

  const [modalPesoVisible, setModalPesoVisible] = useState(false);
  const [pesoSeleccionado, setPesoSeleccionado] = useState(null);

  const cargarObras = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("obras")
      .select("id_obra, obra")
      .neq("id_obra", 888)
      .eq("activo", true)
      .order("obra");
    if (err) {
      console.error("[GestionBancos] Error al cargar obras:", err);
      return;
    }
    setObras(data ?? []);
  }, []);

  useEffect(() => {
    cargarTodo();
    cargarObras();
  }, [cargarTodo, cargarObras]);

  const handleRefrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await Promise.all([cargarTodo(), cargarObras()]);
    } finally {
      setRefrescando(false);
    }
  }, [cargarTodo, cargarObras]);

  const cambiarPestana = (p) => {
    setPestanaActiva(p);
    setBusqueda("");
  };

  // ─── Conteos por banco, para la pestana Bancos ─────────────────────────────
  const conteosPorBanco = useMemo(() => {
    const mapa = {};
    const asegurar = (id) => {
      if (!mapa[id]) mapa[id] = { obras: 0, pesos: 0, planta: false };
      return mapa[id];
    };
    distancias.forEach((d) => (asegurar(d.id_banco).obras += 1));
    pesosEspecificos.forEach((p) => (asegurar(p.id_banco).pesos += 1));
    distanciasPlanta.forEach((d) => (asegurar(d.id_banco).planta = true));
    return mapa;
  }, [distancias, pesosEspecificos, distanciasPlanta]);

  // ─── Filtrado por busqueda ─────────────────────────────────────────────────
  const q = busqueda.trim().toLowerCase();

  const bancosFiltrados = useMemo(
    () => (!q ? bancos : bancos.filter((b) => contiene(b.banco, q))),
    [bancos, q]
  );

  const distanciasFiltradas = useMemo(
    () =>
      !q
        ? distancias
        : distancias.filter(
            (d) => contiene(d.bancos?.banco, q) || contiene(d.obras?.obra, q)
          ),
    [distancias, q]
  );

  const distanciasPlantaFiltradas = useMemo(
    () =>
      !q
        ? distanciasPlanta
        : distanciasPlanta.filter((d) => contiene(d.bancos?.banco, q)),
    [distanciasPlanta, q]
  );

  const pesosFiltrados = useMemo(
    () =>
      !q
        ? pesosEspecificos
        : pesosEspecificos.filter(
            (p) =>
              contiene(p.bancos?.banco, q) || contiene(p.material?.material, q)
          ),
    [pesosEspecificos, q]
  );

  // ─── Eliminar ──────────────────────────────────────────────────────────────
  // Sin el try/catch, un fallo de RLS deja una promesa rechazada sin manejar.
  const confirmarEliminar = (titulo, mensaje, accion, mensajeError) => {
    crossAlert(titulo, mensaje, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await accion();
          } catch (e) {
            console.error("[GestionBancos] Error al eliminar:", e);
            Alert.alert("Error", mensajeError);
          }
        },
      },
    ]);
  };

  // ─── Configuracion de cada pestana ─────────────────────────────────────────
  const PESTANA_CONFIG = {
    Bancos: {
      titulo: "Bancos registrados",
      datos: bancosFiltrados,
      total: bancos.length,
      keyExtractor: (item) => String(item.id_banco),
      renderItem: ({ item }) => (
        <FilaBanco
          banco={item}
          conteos={conteosPorBanco[item.id_banco]}
          onPress={() => {
            setBancoSeleccionado(item);
            setModalBancoVisible(true);
          }}
        />
      ),
      onAgregar: () => {
        setBancoSeleccionado(null);
        setModalBancoVisible(true);
      },
      iconoVacio: "home-city-outline",
      textoVacio: "No hay bancos registrados",
      placeholderBusqueda: "Buscar banco...",
    },

    Distancias: {
      titulo: "Distancias banco-obra",
      datos: distanciasFiltradas,
      total: distancias.length,
      keyExtractor: (item) => String(item.id_distancia_banco_obra),
      renderItem: ({ item }) => (
        <FilaRegistro
          icono="map-marker-distance"
          titulo={item.bancos?.banco}
          subIcono="office-building-outline"
          subTexto={item.obras?.obra}
          badgeTexto={`${item.distancia_km} km`}
          onEditar={() => {
            setDistanciaSeleccionada(item);
            setModalDistanciaVisible(true);
          }}
          onEliminar={() =>
            confirmarEliminar(
              "Eliminar distancia",
              `¿Eliminar ${item.bancos?.banco} → ${item.obras?.obra}?`,
              () => eliminarDistancia(item.id_distancia_banco_obra),
              "No se pudo eliminar la distancia."
            )
          }
        />
      ),
      onAgregar: () => {
        setDistanciaSeleccionada(null);
        setModalDistanciaVisible(true);
      },
      iconoVacio: "map-marker-distance",
      textoVacio: "No hay distancias configuradas",
      placeholderBusqueda: "Buscar banco u obra...",
    },

    "Dist. Planta": {
      titulo: "Distancias a planta",
      datos: distanciasPlantaFiltradas,
      total: distanciasPlanta.length,
      keyExtractor: (item) => String(item.id_distancia_banco_planta),
      renderItem: ({ item }) => (
        <FilaRegistro
          icono="map-marker-distance"
          titulo={item.bancos?.banco}
          subIcono="factory"
          subTexto="Planta de Asfaltos"
          badgeTexto={`${item.distancia_km} km`}
          onEditar={() => {
            setDistanciaPlantaSeleccionada(item);
            setModalDistanciaPlantaVisible(true);
          }}
          onEliminar={() =>
            confirmarEliminar(
              "Eliminar distancia",
              `¿Eliminar ${item.bancos?.banco} → Planta de Asfaltos?`,
              () => eliminarDistanciaPlanta(item.id_distancia_banco_planta),
              "No se pudo eliminar la distancia."
            )
          }
        />
      ),
      onAgregar: () => {
        setDistanciaPlantaSeleccionada(null);
        setModalDistanciaPlantaVisible(true);
      },
      iconoVacio: "map-marker-distance",
      textoVacio: "No hay distancias a planta configuradas",
      placeholderBusqueda: "Buscar banco...",
    },

    Pesos: {
      titulo: "Pesos especificos",
      datos: pesosFiltrados,
      total: pesosEspecificos.length,
      keyExtractor: (item) => String(item.id_peso_especifico),
      renderItem: ({ item }) => (
        <FilaRegistro
          icono="weight-kilogram"
          titulo={item.bancos?.banco}
          subIcono="package-variant-closed"
          subTexto={item.material?.material}
          badgeTexto={`${item.peso_especifico} ton/m3`}
          acentuada
          onEditar={() => {
            setPesoSeleccionado(item);
            setModalPesoVisible(true);
          }}
          onEliminar={() =>
            confirmarEliminar(
              "Eliminar peso especifico",
              `¿Eliminar ${item.bancos?.banco} · ${item.material?.material}?`,
              () => eliminarPeso(item.id_peso_especifico),
              "No se pudo eliminar el peso especifico."
            )
          }
        />
      ),
      onAgregar: () => {
        setPesoSeleccionado(null);
        setModalPesoVisible(true);
      },
      iconoVacio: "weight-kilogram",
      textoVacio: "No hay pesos especificos configurados",
      placeholderBusqueda: "Buscar banco o material...",
    },
  };

  if (error) {
    return (
      <View style={estilos.centrado}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={40}
          color={colors.danger}
        />
        <Text style={estilos.errorTexto}>Error al cargar datos</Text>
        <Text style={estilos.errorDetalle}>{error}</Text>
        <TouchableOpacity style={estilos.btnReintentar} onPress={cargarTodo}>
          <Text style={estilos.btnReintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg = PESTANA_CONFIG[pestanaActiva];

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.toggleRow}>
        {PESTANAS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              estilos.toggleBtn,
              pestanaActiva === p && estilos.toggleBtnActivo,
            ]}
            onPress={() => cambiarPestana(p)}
          >
            <Text
              style={[
                estilos.toggleTexto,
                pestanaActiva === p && estilos.toggleTextoActivo,
              ]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={estilos.tabHeader}>
        <Text style={estilos.tabTitulo}>
          {cfg.titulo}
          {cfg.total > 0 ? ` (${cfg.total})` : ""}
        </Text>
        <TouchableOpacity
          style={estilos.btnAgregar}
          onPress={cfg.onAgregar}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={22} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <View style={estilos.searchRow}>
        <View style={estilos.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            style={estilos.searchInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder={cfg.placeholderBusqueda}
            placeholderTextColor={colors.textSecondary}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refrescando ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          size="large"
          color={colors.primary}
        />
      ) : (
        <FlatList
          key={pestanaActiva}
          data={cfg.datos}
          keyExtractor={cfg.keyExtractor}
          renderItem={cfg.renderItem}
          contentContainerStyle={estilos.listaContenido}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={handleRefrescar}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={estilos.vacio}>
              <MaterialCommunityIcons
                name={cfg.iconoVacio}
                size={36}
                color={colors.textSecondary}
              />
              <Text style={estilos.vacioTexto}>
                {busqueda ? "Sin resultados para la busqueda" : cfg.textoVacio}
              </Text>
            </View>
          }
        />
      )}

      <ModalBanco
        visible={modalBancoVisible}
        banco={bancoSeleccionado}
        bancos={bancos}
        onGuardar={async (nombre) => {
          if (bancoSeleccionado)
            await editarBanco(bancoSeleccionado.id_banco, nombre);
          else await crearBanco(nombre);
        }}
        onCerrar={() => setModalBancoVisible(false)}
      />

      <ModalDistancia
        visible={modalDistanciaVisible}
        distancia={distanciaSeleccionada}
        listaBancos={bancos}
        obras={obras}
        distancias={distancias}
        onGuardar={async (idOrDatos, km) => {
          if (distanciaSeleccionada) await editarDistancia(idOrDatos, km);
          else await crearDistancia(idOrDatos);
        }}
        onCerrar={() => setModalDistanciaVisible(false)}
      />

      <ModalDistanciaPlanta
        visible={modalDistanciaPlantaVisible}
        distancia={distanciaPlantaSeleccionada}
        listaBancos={bancos}
        distanciasPlanta={distanciasPlanta}
        onGuardar={async (idOrDatos, km) => {
          if (distanciaPlantaSeleccionada)
            await editarDistanciaPlanta(idOrDatos, km);
          else await crearDistanciaPlanta(idOrDatos);
        }}
        onCerrar={() => setModalDistanciaPlantaVisible(false)}
      />

      <ModalPesoEspecifico
        visible={modalPesoVisible}
        peso={pesoSeleccionado}
        listaBancos={bancos}
        materiales={materiales}
        pesosEspecificos={pesosEspecificos}
        onGuardar={async (idOrDatos, val) => {
          if (pesoSeleccionado) await editarPeso(idOrDatos, val);
          else await crearPeso(idOrDatos);
        }}
        onCerrar={() => setModalPesoVisible(false)}
      />
    </View>
  );
}
