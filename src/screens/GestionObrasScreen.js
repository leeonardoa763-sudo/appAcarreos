import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { supabase } from "../config/supabase";
import { useGestionObras } from "../hooks/useGestionObras";
import { useAsignacionesObra } from "../hooks/useAsignacionesObra";
import { useUsuariosActivos } from "../hooks/useUsuariosActivos";
import crossAlert from "../utils/crossAlert";
import { estilosObras as estilos } from "../componets/obras/gestionObrasStyles";
import {
  CajaBusqueda,
  FilaObra,
  FilaUsuario,
} from "../componets/obras/GestionObrasFilas";
import { ModalObra } from "../componets/obras/GestionObrasModales";
import ModalAsignacionesUsuario from "../componets/obras/ModalAsignacionesUsuario";

const PESTANAS = ["Obras", "Asignaciones"];

const FILTROS_ESTADO = [
  { clave: "todas", etiqueta: "Todas", icono: "format-list-bulleted" },
  { clave: "activas", etiqueta: "Activas", icono: "power" },
  { clave: "inactivas", etiqueta: "Inactivas", icono: "power-off" },
];

const contiene = (texto, query) =>
  String(texto ?? "").toLowerCase().includes(query);

export default function GestionObrasScreen() {
  const {
    obras,
    loading: loadingObras,
    error: errorObras,
    fetchObras,
    crearObra,
    editarObra,
    toggleActivoObra,
  } = useGestionObras();

  const {
    usuarios,
    loading: loadingUsuarios,
    refetch: refetchUsuarios,
  } = useUsuariosActivos();

  const {
    asignaciones,
    conteos,
    loading: loadingAsignaciones,
    fetchAsignaciones,
    fetchConteos,
    asignarObra,
    quitarObra,
  } = useAsignacionesObra();

  const [empresas, setEmpresas] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState("Obras");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [refrescando, setRefrescando] = useState(false);

  const [modalObraVisible, setModalObraVisible] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);

  const [usuarioSel, setUsuarioSel] = useState(null);
  const [modalAsignacionesVisible, setModalAsignacionesVisible] =
    useState(false);

  const cargarEmpresas = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("empresas")
      .select("id_empresa, empresa, sufijo")
      .order("empresa");
    if (err) {
      console.error("[GestionObras] Error al cargar empresas:", err);
      return;
    }
    setEmpresas(data ?? []);
  }, []);

  useEffect(() => {
    fetchObras();
    cargarEmpresas();
    fetchConteos();
  }, [fetchObras, cargarEmpresas, fetchConteos]);

  const handleRefrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await Promise.all([
        fetchObras(),
        cargarEmpresas(),
        fetchConteos(),
        refetchUsuarios(),
      ]);
    } finally {
      setRefrescando(false);
    }
  }, [fetchObras, cargarEmpresas, fetchConteos, refetchUsuarios]);

  const cambiarPestana = (p) => {
    setPestanaActiva(p);
    setBusqueda("");
  };

  // ─── Obras ────────────────────────────────────────────────────────────────
  const q = busqueda.trim().toLowerCase();

  const obrasFiltradas = useMemo(() => {
    let lista = obras;
    if (filtroEstado === "activas") lista = lista.filter((o) => o.activo);
    if (filtroEstado === "inactivas") lista = lista.filter((o) => !o.activo);
    if (!q) return lista;
    return lista.filter(
      (o) =>
        contiene(o.obra, q) ||
        contiene(o.cc, q) ||
        contiene(o.id_obra, q) ||
        contiene(o.empresas?.empresa, q) ||
        contiene(o.empresas?.sufijo, q),
    );
  }, [obras, filtroEstado, q]);

  const totalActivas = useMemo(
    () => obras.filter((o) => o.activo).length,
    [obras],
  );

  const abrirNuevaObra = () => {
    setObraSeleccionada(null);
    setModalObraVisible(true);
  };

  const abrirEditarObra = (o) => {
    setObraSeleccionada(o);
    setModalObraVisible(true);
  };

  // Alert.alert es un no-op en web: la confirmacion va por crossAlert.
  const confirmarToggleActivo = (item) => {
    const activar = !item.activo;
    crossAlert(
      activar ? "Activar obra" : "Desactivar obra",
      activar
        ? `¿Activar "${item.obra}"? Volvera a estar disponible para asignar y usar en vales.`
        : `¿Desactivar "${item.obra}"? Dejara de estar disponible para nuevas asignaciones y vales. Los vales ya creados no se modifican.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: activar ? "Activar" : "Desactivar",
          style: activar ? "default" : "destructive",
          onPress: async () => {
            try {
              await toggleActivoObra(item.id_obra, activar);
            } catch (e) {
              console.error("[GestionObras] Error al cambiar estado:", e);
              Alert.alert(
                "Error",
                "No se pudo cambiar el estado de la obra. Intenta de nuevo.",
              );
            }
          },
        },
      ],
    );
  };

  // ─── Asignaciones ─────────────────────────────────────────────────────────
  const usuariosFiltrados = useMemo(() => {
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        contiene(
          [u.nombre, u.primer_apellido, u.segundo_apellido]
            .filter(Boolean)
            .join(" "),
          q,
        ) || contiene(u.roles?.role, q),
    );
  }, [usuarios, q]);

  const obraIdsAsignadas = useMemo(
    () => new Set(asignaciones.map((a) => a.obra_id)),
    [asignaciones],
  );

  const abrirAsignaciones = (usuario) => {
    setUsuarioSel(usuario);
    fetchAsignaciones(usuario.id_persona);
    setModalAsignacionesVisible(true);
  };

  const handleToggleAsignacion = async (obraId) => {
    if (!usuarioSel) return;
    if (obraIdsAsignadas.has(obraId)) {
      await quitarObra(usuarioSel.id_persona, obraId);
    } else {
      await asignarObra(usuarioSel.id_persona, obraId);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (errorObras) {
    return (
      <View style={estilos.centrado}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={40}
          color={colors.danger}
        />
        <Text style={estilos.errorTexto}>Error al cargar obras</Text>
        <Text style={estilos.errorDetalle}>{errorObras}</Text>
        <TouchableOpacity style={estilos.btnReintentar} onPress={fetchObras}>
          <Text style={estilos.btnReintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const esObras = pestanaActiva === "Obras";
  const cargando = esObras ? loadingObras : loadingUsuarios;

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
          {esObras
            ? `Obras registradas (${obras.length})`
            : `Usuarios activos (${usuarios.length})`}
        </Text>
        {esObras && (
          <TouchableOpacity
            style={estilos.btnAgregar}
            onPress={abrirNuevaObra}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="plus"
              size={22}
              color={colors.surface}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={estilos.tabSubtitulo}>
        {esObras
          ? `${totalActivas} activas · toca una obra para editarla`
          : "Toca un usuario para elegir a que obras tiene acceso"}
      </Text>

      <CajaBusqueda
        valor={busqueda}
        onCambiar={setBusqueda}
        placeholder={
          esObras ? "Buscar obra, CC o empresa..." : "Buscar usuario o rol..."
        }
      />

      {esObras && (
        <View style={estilos.filtrosRow}>
          {FILTROS_ESTADO.map((f) => {
            const activo = filtroEstado === f.clave;
            return (
              <TouchableOpacity
                key={f.clave}
                style={[
                  estilos.filtroChip,
                  activo && estilos.filtroChipActivo,
                ]}
                onPress={() => setFiltroEstado(f.clave)}
              >
                <MaterialCommunityIcons
                  name={f.icono}
                  size={13}
                  color={activo ? colors.surface : colors.textSecondary}
                />
                <Text
                  style={[
                    estilos.filtroChipTexto,
                    activo && estilos.filtroChipTextoActivo,
                  ]}
                >
                  {f.etiqueta}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {cargando && !refrescando ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          size="large"
          color={colors.primary}
        />
      ) : (
        <FlatList
          key={pestanaActiva}
          data={esObras ? obrasFiltradas : usuariosFiltrados}
          keyExtractor={(item) =>
            String(esObras ? item.id_obra : item.id_persona)
          }
          renderItem={({ item }) =>
            esObras ? (
              <FilaObra
                obra={item}
                onEditar={abrirEditarObra}
                onToggleActivo={confirmarToggleActivo}
              />
            ) : (
              <FilaUsuario
                usuario={item}
                totalObras={conteos ? (conteos[item.id_persona] ?? 0) : null}
                onPress={() => abrirAsignaciones(item)}
              />
            )
          }
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
                name={
                  esObras ? "office-building-marker-outline" : "account-outline"
                }
                size={36}
                color={colors.textSecondary}
              />
              <Text style={estilos.vacioTexto}>
                {busqueda
                  ? "Sin resultados para la busqueda"
                  : esObras
                    ? "No hay obras registradas"
                    : "No hay usuarios activos"}
              </Text>
            </View>
          }
        />
      )}

      <ModalObra
        visible={modalObraVisible}
        obra={obraSeleccionada}
        obras={obras}
        empresas={empresas}
        onGuardar={async (datos) => {
          if (obraSeleccionada) await editarObra(obraSeleccionada.id_obra, datos);
          else await crearObra(datos);
        }}
        onCerrar={() => setModalObraVisible(false)}
      />

      <ModalAsignacionesUsuario
        visible={modalAsignacionesVisible}
        usuario={usuarioSel}
        obras={obras}
        asignadasIds={obraIdsAsignadas}
        loading={loadingAsignaciones}
        onToggle={handleToggleAsignacion}
        onCerrar={() => setModalAsignacionesVisible(false)}
      />
    </View>
  );
}
