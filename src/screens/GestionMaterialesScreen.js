import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { useGestionMateriales } from "../hooks/useGestionMateriales";
import {
  ModalMaterial,
  ModalTipo,
  ModalCategoriaRenta,
  ModalMaterialRenta,
} from "../componets/materiales/GestionMaterialesModales";

const PESTANAS = ["Materiales", "Tipos", "Categorías Renta"];

export default function GestionMaterialesScreen() {
  const {
    materiales,
    tipos,
    categoriasRenta,
    loading,
    error,
    fetchMateriales,
    fetchTipos,
    fetchCategoriasRenta,
    crearMaterial,
    editarMaterial,
    crearTipo,
    editarTipo,
    crearCategoriaRenta,
    editarCategoriaRenta,
  } = useGestionMateriales();

  const [pestanaActiva, setPestanaActiva] = useState("Materiales");
  const [busqueda, setBusqueda] = useState("");

  const [modalMaterialVisible, setModalMaterialVisible] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);

  const [modalTipoVisible, setModalTipoVisible] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

  const [modalCategoriaVisible, setModalCategoriaVisible] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  const [categoriaExpandidaId, setCategoriaExpandidaId] = useState(null);
  const [modalMaterialRentaVisible, setModalMaterialRentaVisible] = useState(false);
  const [materialRentaSeleccionado, setMaterialRentaSeleccionado] = useState(null);
  const [categoriaParaMaterial, setCategoriaParaMaterial] = useState(null);

  useEffect(() => {
    fetchMateriales();
    fetchTipos();
    fetchCategoriasRenta();
  }, []);

  const materialesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return materiales;
    const q = busqueda.trim().toLowerCase();
    return materiales.filter((m) =>
      m.material.toLowerCase().includes(q) ||
      m.tipo_de_material?.tipo_de_material?.toLowerCase().includes(q)
    );
  }, [materiales, busqueda]);

  const tiposConConteo = useMemo(() =>
    tipos.map((t) => ({
      ...t,
      conteo: materiales.filter((m) => m.id_tipo_de_material === t.id_tipo_de_material).length,
    })),
    [tipos, materiales]
  );

  const abrirNuevoMaterial = () => {
    setMaterialSeleccionado(null);
    setModalMaterialVisible(true);
  };

  const abrirEditarMaterial = (mat) => {
    setMaterialSeleccionado(mat);
    setModalMaterialVisible(true);
  };

  const abrirNuevoTipo = () => {
    setTipoSeleccionado(null);
    setModalTipoVisible(true);
  };

  const abrirEditarTipo = (tipo) => {
    setTipoSeleccionado(tipo);
    setModalTipoVisible(true);
  };

  const abrirNuevaCategoria = () => {
    setCategoriaSeleccionada(null);
    setModalCategoriaVisible(true);
  };

  const abrirEditarCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setModalCategoriaVisible(true);
  };

  const materialesPorCategoria = (idCategoria) =>
    materiales.filter((m) => m.id_categoria_material_renta === idCategoria);

  const abrirNuevoMaterialRenta = (categoria) => {
    setMaterialRentaSeleccionado(null);
    setCategoriaParaMaterial(categoria);
    setModalMaterialRentaVisible(true);
  };

  const abrirEditarMaterialRenta = (material, categoria) => {
    setMaterialRentaSeleccionado(material);
    setCategoriaParaMaterial(categoria);
    setModalMaterialRentaVisible(true);
  };

  const handleGuardarMaterial = async (datos) => {
    if (materialSeleccionado) {
      await editarMaterial(materialSeleccionado.id_material, datos);
    } else {
      await crearMaterial(datos);
    }
  };

  const handleGuardarTipo = async (datos) => {
    if (tipoSeleccionado) {
      await editarTipo(tipoSeleccionado.id_tipo_de_material, datos);
    } else {
      await crearTipo(datos);
    }
  };

  const handleGuardarCategoria = async (datos) => {
    if (categoriaSeleccionada) {
      await editarCategoriaRenta(
        categoriaSeleccionada.id_categoria_material_renta,
        datos,
      );
    } else {
      await crearCategoriaRenta(datos);
    }
  };

  // Material "hijo" de una categoría de renta: sin tipo_de_material (esa
  // jerarquía es para el pricing de material/bancos, no aplica en renta) y
  // sin es_material_descarga (exclusivo de pipas, ver
  // 20260904_categorias_material_renta.sql).
  const handleGuardarMaterialRenta = async (datos) => {
    const payload = {
      material: datos.material,
      id_tipo_de_material: null,
      es_material_descarga: false,
      id_categoria_material_renta: categoriaParaMaterial.id_categoria_material_renta,
      activo: datos.activo,
    };
    if (materialRentaSeleccionado) {
      await editarMaterial(materialRentaSeleccionado.id_material, payload);
    } else {
      await crearMaterial(payload);
    }
  };

  const renderMaterial = ({ item }) => (
    <TouchableOpacity
      style={[estilos.fila, !item.activo && estilos.filaInactiva]}
      onPress={() => abrirEditarMaterial(item)}
      activeOpacity={0.7}
    >
      <View style={estilos.filaIcono}>
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={22}
          color={item.activo ? colors.secondary : colors.textSecondary}
        />
      </View>

      <View style={estilos.filaTextos}>
        <Text style={[estilos.filaNombre, !item.activo && { color: colors.textSecondary }]}>
          {item.material}
        </Text>
        <View style={estilos.filaChips}>
          {item.tipo_de_material && (
            <View style={estilos.badge}>
              <Text style={estilos.badgeTexto}>{item.tipo_de_material.tipo_de_material}</Text>
            </View>
          )}
          {item.es_material_descarga && (
            <View style={[estilos.badge, { backgroundColor: "#EAF6F1", borderColor: colors.accent }]}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={11} color={colors.accent} />
              <Text style={[estilos.badgeTexto, { color: colors.accent }]}>Descarga</Text>
            </View>
          )}
          {!item.activo && (
            <View style={[estilos.badge, { backgroundColor: "#FDF2F2", borderColor: "#E74C3C" }]}>
              <Text style={[estilos.badgeTexto, { color: "#E74C3C" }]}>Inactivo</Text>
            </View>
          )}
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderTipo = ({ item }) => (
    <TouchableOpacity
      style={estilos.fila}
      onPress={() => abrirEditarTipo(item)}
      activeOpacity={0.7}
    >
      <View style={estilos.filaIcono}>
        <MaterialCommunityIcons name="label-outline" size={22} color={colors.secondary} />
      </View>
      <View style={estilos.filaTextos}>
        <Text style={estilos.filaNombre}>{item.tipo_de_material}</Text>
        <Text style={estilos.filaSubtexto}>
          {item.conteo} {item.conteo === 1 ? "material" : "materiales"}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderCategoria = ({ item }) => {
    const expandida = categoriaExpandidaId === item.id_categoria_material_renta;
    const materialesCategoria = materialesPorCategoria(item.id_categoria_material_renta);

    return (
      <View style={estilos.categoriaCard}>
        <View style={estilos.categoriaFilaPrincipal}>
          <TouchableOpacity
            style={estilos.filaTocable}
            onPress={() => abrirEditarCategoria(item)}
            activeOpacity={0.7}
          >
            <View style={estilos.filaIcono}>
              <MaterialCommunityIcons name="shape-outline" size={22} color={colors.secondary} />
            </View>
            <View style={estilos.filaTextos}>
              <Text style={estilos.filaNombre}>{item.categoria}</Text>
              {!!item.descripcion && (
                <Text style={estilos.filaSubtexto} numberOfLines={2}>{item.descripcion}</Text>
              )}
              <Text style={estilos.filaSubtextoConteo}>
                {materialesCategoria.length} {materialesCategoria.length === 1 ? "material" : "materiales"}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              setCategoriaExpandidaId(expandida ? null : item.id_categoria_material_renta)
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={estilos.chevronBtn}
          >
            <MaterialCommunityIcons
              name={expandida ? "chevron-up" : "chevron-down"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {expandida && (
          <View style={estilos.subLista}>
            {materialesCategoria.map((mat) => (
              <TouchableOpacity
                key={mat.id_material}
                style={estilos.subFila}
                onPress={() => abrirEditarMaterialRenta(mat, item)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="circle-small"
                  size={18}
                  color={mat.activo ? colors.secondary : colors.textSecondary}
                />
                <Text
                  style={[estilos.subFilaTexto, !mat.activo && estilos.subFilaTextoInactivo]}
                >
                  {mat.material}{!mat.activo ? " (inactivo)" : ""}
                </Text>
              </TouchableOpacity>
            ))}
            {materialesCategoria.length === 0 && (
              <Text style={estilos.subVacioTexto}>Sin materiales en esta categoría</Text>
            )}
            <TouchableOpacity
              style={estilos.btnAgregarSub}
              onPress={() => abrirNuevoMaterialRenta(item)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
              <Text style={estilos.btnAgregarSubTexto}>Agregar material</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (error) {
    return (
      <View style={estilos.centrado}>
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#E74C3C" />
        <Text style={estilos.errorTexto}>Error al cargar datos</Text>
        <TouchableOpacity
          style={estilos.btnReintentar}
          onPress={() => { fetchMateriales(); fetchTipos(); fetchCategoriasRenta(); }}
        >
          <Text style={estilos.btnReintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      {/* Toggle de pestanas */}
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

      {/* Pestaña Materiales */}
      {pestanaActiva === "Materiales" && (
        <>
          <View style={estilos.searchRow}>
            <View style={estilos.searchBox}>
              <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
              <TextInput
                style={estilos.searchInput}
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar material o tipo..."
                placeholderTextColor={colors.textSecondary}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => setBusqueda("")}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={estilos.btnAgregar} onPress={abrirNuevoMaterial}>
              <MaterialCommunityIcons name="plus" size={22} color={colors.surface} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={materialesFiltrados}
              keyExtractor={(item) => String(item.id_material)}
              renderItem={renderMaterial}
              contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={
                <View style={estilos.vacio}>
                  <MaterialCommunityIcons name="package-variant-closed-remove" size={36} color={colors.textSecondary} />
                  <Text style={estilos.vacioTexto}>
                    {busqueda ? "Sin resultados para la busqueda" : "No hay materiales registrados"}
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Pestaña Tipos */}
      {pestanaActiva === "Tipos" && (
        <>
          <View style={estilos.tiposHeader}>
            <Text style={estilos.tiposTitulo}>Tipos de material</Text>
            <TouchableOpacity style={estilos.btnAgregar} onPress={abrirNuevoTipo}>
              <MaterialCommunityIcons name="plus" size={22} color={colors.surface} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={tiposConConteo}
              keyExtractor={(item) => String(item.id_tipo_de_material)}
              renderItem={renderTipo}
              contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={
                <View style={estilos.vacio}>
                  <MaterialCommunityIcons name="label-off-outline" size={36} color={colors.textSecondary} />
                  <Text style={estilos.vacioTexto}>No hay tipos registrados</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Pestaña Categorías Renta */}
      {pestanaActiva === "Categorías Renta" && (
        <>
          <View style={estilos.tiposHeader}>
            <Text style={estilos.tiposTitulo}>Categorías de material (Renta)</Text>
            <TouchableOpacity style={estilos.btnAgregar} onPress={abrirNuevaCategoria}>
              <MaterialCommunityIcons name="plus" size={22} color={colors.surface} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={categoriasRenta}
              keyExtractor={(item) => String(item.id_categoria_material_renta)}
              renderItem={renderCategoria}
              contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={
                <View style={estilos.vacio}>
                  <MaterialCommunityIcons name="shape-off-outline" size={36} color={colors.textSecondary} />
                  <Text style={estilos.vacioTexto}>No hay categorías registradas</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Modales */}
      <ModalMaterial
        visible={modalMaterialVisible}
        material={materialSeleccionado}
        tipos={tipos}
        categoriasRenta={categoriasRenta}
        onGuardar={handleGuardarMaterial}
        onCerrar={() => setModalMaterialVisible(false)}
      />
      <ModalTipo
        visible={modalTipoVisible}
        tipo={tipoSeleccionado}
        onGuardar={handleGuardarTipo}
        onCerrar={() => setModalTipoVisible(false)}
      />
      <ModalCategoriaRenta
        visible={modalCategoriaVisible}
        categoria={categoriaSeleccionada}
        onGuardar={handleGuardarCategoria}
        onCerrar={() => setModalCategoriaVisible(false)}
      />
      <ModalMaterialRenta
        visible={modalMaterialRentaVisible}
        material={materialRentaSeleccionado}
        categoria={categoriaParaMaterial}
        onGuardar={handleGuardarMaterialRenta}
        onCerrar={() => setModalMaterialRentaVisible(false)}
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

  // Toggle
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

  // Search
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 4,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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

  // Tipos header
  tiposHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  tiposTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  // Filas
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

  // Categorías de renta — card con fila principal + sub-lista de materiales
  categoriaCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  categoriaFilaPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  filaTocable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chevronBtn: {
    padding: 4,
  },
  filaSubtextoConteo: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: "600",
    marginTop: 2,
  },
  subLista: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: 6,
  },
  subFila: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  subFilaTexto: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  subFilaTextoInactivo: {
    color: colors.textSecondary,
  },
  subVacioTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontStyle: "italic",
  },
  btnAgregarSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnAgregarSubTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  filaInactiva: {
    opacity: 0.65,
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
  filaSubtexto: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
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

  // Vacío
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
