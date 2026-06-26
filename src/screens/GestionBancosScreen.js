import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { useGestionBancos } from "../hooks/useGestionBancos";
import { useCatalogos } from "../hooks/useCatalogos";
import {
  ModalBanco,
  ModalDistancia,
  ModalPesoEspecifico,
} from "../componets/bancos/GestionBancosModales";

const PESTANAS = ["Bancos", "Distancias", "Pesos"];

export default function GestionBancosScreen() {
  const {
    bancos,
    distancias,
    pesosEspecificos,
    loading,
    error,
    fetchBancos,
    fetchDistancias,
    fetchPesos,
    crearBanco,
    editarBanco,
    crearDistancia,
    editarDistancia,
    eliminarDistancia,
    crearPeso,
    editarPeso,
    eliminarPeso,
  } = useGestionBancos();

  const { materiales } = useCatalogos(["materiales"]);
  const [obras, setObras] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState("Bancos");

  const [modalBancoVisible, setModalBancoVisible] = useState(false);
  const [bancoSeleccionado, setBancoSeleccionado] = useState(null);

  const [modalDistanciaVisible, setModalDistanciaVisible] = useState(false);
  const [distanciaSeleccionada, setDistanciaSeleccionada] = useState(null);

  const [modalPesoVisible, setModalPesoVisible] = useState(false);
  const [pesoSeleccionado, setPesoSeleccionado] = useState(null);

  useEffect(() => {
    fetchBancos();
    fetchDistancias();
    fetchPesos();
    supabase
      .from("obras")
      .select("id_obra, obra")
      .neq("id_obra", 888)
      .order("obra")
      .then(({ data }) => setObras(data ?? []));
  }, []);

  const abrirNuevoBanco = () => { setBancoSeleccionado(null); setModalBancoVisible(true); };
  const abrirEditarBanco = (b) => { setBancoSeleccionado(b); setModalBancoVisible(true); };

  const abrirNuevaDistancia = () => { setDistanciaSeleccionada(null); setModalDistanciaVisible(true); };
  const abrirEditarDistancia = (d) => { setDistanciaSeleccionada(d); setModalDistanciaVisible(true); };

  const abrirNuevoPeso = () => { setPesoSeleccionado(null); setModalPesoVisible(true); };
  const abrirEditarPeso = (p) => { setPesoSeleccionado(p); setModalPesoVisible(true); };

  const confirmarEliminarDistancia = (item) => {
    Alert.alert(
      "Eliminar distancia",
      `¿Eliminar ${item.bancos?.banco} → ${item.obras?.obra}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => eliminarDistancia(item.id_distancia_banco_obra) },
      ]
    );
  };

  const confirmarEliminarPeso = (item) => {
    Alert.alert(
      "Eliminar peso especifico",
      `¿Eliminar ${item.bancos?.banco} · ${item.material?.material}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => eliminarPeso(item.id_peso_especifico) },
      ]
    );
  };

  const renderBanco = ({ item }) => (
    <TouchableOpacity style={estilos.fila} onPress={() => abrirEditarBanco(item)} activeOpacity={0.7}>
      <View style={estilos.filaIcono}>
        <MaterialCommunityIcons name="home-city-outline" size={22} color={colors.secondary} />
      </View>
      <View style={estilos.filaTextos}>
        <Text style={estilos.filaNombre}>{item.banco}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderDistancia = ({ item }) => (
    <TouchableOpacity style={estilos.fila} onPress={() => abrirEditarDistancia(item)} activeOpacity={0.7}>
      <View style={estilos.filaIcono}>
        <MaterialCommunityIcons name="map-marker-distance" size={22} color={colors.secondary} />
      </View>
      <View style={estilos.filaTextos}>
        <Text style={estilos.filaNombre}>{item.bancos?.banco}</Text>
        <View style={estilos.filaSubRow}>
          <MaterialCommunityIcons name="office-building-outline" size={12} color={colors.textSecondary} />
          <Text style={estilos.filaSubtexto}>{item.obras?.obra}</Text>
          <View style={estilos.badge}>
            <MaterialCommunityIcons name="ruler" size={11} color={colors.secondary} />
            <Text style={[estilos.badgeTexto, { color: colors.secondary }]}>
              {item.distancia_km} km
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={estilos.btnEliminar}
        onPress={() => confirmarEliminarDistancia(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#E74C3C" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderPeso = ({ item }) => (
    <TouchableOpacity style={estilos.fila} onPress={() => abrirEditarPeso(item)} activeOpacity={0.7}>
      <View style={estilos.filaIcono}>
        <MaterialCommunityIcons name="weight-kilogram" size={22} color={colors.secondary} />
      </View>
      <View style={estilos.filaTextos}>
        <Text style={estilos.filaNombre}>{item.bancos?.banco}</Text>
        <View style={estilos.filaSubRow}>
          <MaterialCommunityIcons name="package-variant-closed" size={12} color={colors.textSecondary} />
          <Text style={estilos.filaSubtexto}>{item.material?.material}</Text>
          <View style={[estilos.badge, { backgroundColor: "#EAF6F1", borderColor: colors.accent }]}>
            <Text style={[estilos.badgeTexto, { color: colors.accent }]}>
              {item.peso_especifico} ton/m3
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={estilos.btnEliminar}
        onPress={() => confirmarEliminarPeso(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#E74C3C" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={estilos.centrado}>
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#E74C3C" />
        <Text style={estilos.errorTexto}>Error al cargar datos</Text>
        <TouchableOpacity
          style={estilos.btnReintentar}
          onPress={() => { fetchBancos(); fetchDistancias(); fetchPesos(); }}
        >
          <Text style={estilos.btnReintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const listaBancosActivos = bancos;

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.toggleRow}>
        {PESTANAS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[estilos.toggleBtn, pestanaActiva === p && estilos.toggleBtnActivo]}
            onPress={() => setPestanaActiva(p)}
          >
            <Text style={[estilos.toggleTexto, pestanaActiva === p && estilos.toggleTextoActivo]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {pestanaActiva === "Bancos" && (
        <>
          <View style={estilos.tabHeader}>
            <Text style={estilos.tabTitulo}>Bancos registrados</Text>
            <TouchableOpacity style={estilos.btnAgregar} onPress={abrirNuevoBanco}>
              <MaterialCommunityIcons name="plus" size={22} color={colors.surface} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={bancos}
              keyExtractor={(item) => String(item.id_banco)}
              renderItem={renderBanco}
              contentContainerStyle={estilos.listaContenido}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={
                <View style={estilos.vacio}>
                  <MaterialCommunityIcons name="home-city-outline" size={36} color={colors.textSecondary} />
                  <Text style={estilos.vacioTexto}>No hay bancos registrados</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {pestanaActiva === "Distancias" && (
        <>
          <View style={estilos.tabHeader}>
            <Text style={estilos.tabTitulo}>Distancias banco-obra</Text>
            <TouchableOpacity style={estilos.btnAgregar} onPress={abrirNuevaDistancia}>
              <MaterialCommunityIcons name="plus" size={22} color={colors.surface} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={distancias}
              keyExtractor={(item) => String(item.id_distancia_banco_obra)}
              renderItem={renderDistancia}
              contentContainerStyle={estilos.listaContenido}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={
                <View style={estilos.vacio}>
                  <MaterialCommunityIcons name="map-marker-distance" size={36} color={colors.textSecondary} />
                  <Text style={estilos.vacioTexto}>No hay distancias configuradas</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {pestanaActiva === "Pesos" && (
        <>
          <View style={estilos.tabHeader}>
            <Text style={estilos.tabTitulo}>Pesos especificos</Text>
            <TouchableOpacity style={estilos.btnAgregar} onPress={abrirNuevoPeso}>
              <MaterialCommunityIcons name="plus" size={22} color={colors.surface} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={pesosEspecificos}
              keyExtractor={(item) => String(item.id_peso_especifico)}
              renderItem={renderPeso}
              contentContainerStyle={estilos.listaContenido}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={
                <View style={estilos.vacio}>
                  <MaterialCommunityIcons name="weight-kilogram" size={36} color={colors.textSecondary} />
                  <Text style={estilos.vacioTexto}>No hay pesos especificos configurados</Text>
                </View>
              }
            />
          )}
        </>
      )}

      <ModalBanco
        visible={modalBancoVisible}
        banco={bancoSeleccionado}
        onGuardar={async (nombre) => {
          if (bancoSeleccionado) await editarBanco(bancoSeleccionado.id_banco, nombre);
          else await crearBanco(nombre);
        }}
        onCerrar={() => setModalBancoVisible(false)}
      />

      <ModalDistancia
        visible={modalDistanciaVisible}
        distancia={distanciaSeleccionada}
        listaBancos={listaBancosActivos}
        obras={obras}
        onGuardar={async (idOrDatos, km) => {
          if (distanciaSeleccionada) await editarDistancia(idOrDatos, km);
          else await crearDistancia(idOrDatos);
        }}
        onCerrar={() => setModalDistanciaVisible(false)}
      />

      <ModalPesoEspecifico
        visible={modalPesoVisible}
        peso={pesoSeleccionado}
        listaBancos={listaBancosActivos}
        materiales={materiales}
        onGuardar={async (idOrDatos, val) => {
          if (pesoSeleccionado) await editarPeso(idOrDatos, val);
          else await crearPeso(idOrDatos);
        }}
        onCerrar={() => setModalPesoVisible(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  errorTexto: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  btnReintentar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  btnReintentarTexto: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: "row",
    margin: 14,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleBtnActivo: {
    backgroundColor: colors.secondary,
  },
  toggleTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  toggleTextoActivo: {
    color: colors.surface,
  },
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  tabTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  btnAgregar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  listaContenido: {
    padding: 14,
    paddingBottom: 40,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  filaIcono: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  filaTextos: {
    flex: 1,
    gap: 4,
  },
  filaNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  filaSubRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  filaSubtexto: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  btnEliminar: {
    padding: 4,
  },
  vacio: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },
  vacioTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
