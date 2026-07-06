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
import { useGestionObras } from "../hooks/useGestionObras";
import { useAsignacionesObra } from "../hooks/useAsignacionesObra";
import { useUsuariosActivos } from "../hooks/useUsuariosActivos";
import { ModalObra } from "../componets/obras/GestionObrasModales";

const PESTANAS = ["Obras", "Asignaciones"];

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

  const { usuarios, loading: loadingUsuarios } = useUsuariosActivos();
  const {
    asignaciones,
    loading: loadingAsignaciones,
    fetchAsignaciones,
    asignarObra,
    quitarObra,
  } = useAsignacionesObra();

  const [empresas, setEmpresas] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState("Obras");

  const [modalObraVisible, setModalObraVisible] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);

  const [usuarioSelId, setUsuarioSelId] = useState(null);

  useEffect(() => {
    fetchObras();
    supabase
      .from("empresas")
      .select("id_empresa, empresa")
      .order("empresa")
      .then(({ data }) => setEmpresas(data ?? []));
  }, []);

  useEffect(() => {
    if (usuarioSelId) fetchAsignaciones(usuarioSelId);
  }, [usuarioSelId]);

  const abrirNuevaObra = () => { setObraSeleccionada(null); setModalObraVisible(true); };
  const abrirEditarObra = (o) => { setObraSeleccionada(o); setModalObraVisible(true); };

  const confirmarToggleActivo = (item) => {
    const activar = !item.activo;
    Alert.alert(
      activar ? "Activar obra" : "Desactivar obra",
      activar
        ? `¿Activar "${item.obra}"? Volvera a estar disponible para asignar y usar en vales.`
        : `¿Desactivar "${item.obra}"? Dejara de estar disponible para nuevas asignaciones y vales.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: activar ? "Activar" : "Desactivar",
          style: activar ? "default" : "destructive",
          onPress: () => toggleActivoObra(item.id_obra, activar),
        },
      ],
    );
  };

  const obraIdsAsignadas = new Set(asignaciones.map((a) => a.obra_id));

  const handleToggleAsignacion = (obraId) => {
    if (!usuarioSelId) return;
    if (obraIdsAsignadas.has(obraId)) {
      quitarObra(usuarioSelId, obraId);
    } else {
      asignarObra(usuarioSelId, obraId);
    }
  };

  const renderObra = ({ item }) => (
    <TouchableOpacity style={estilos.fila} onPress={() => abrirEditarObra(item)} activeOpacity={0.7}>
      <View style={estilos.filaIcono}>
        <MaterialCommunityIcons name="office-building-marker-outline" size={22} color={colors.secondary} />
      </View>
      <View style={estilos.filaTextos}>
        <Text style={estilos.filaNombre}>{item.obra}</Text>
        <View style={estilos.filaSubRow}>
          {item.cc != null && (
            <Text style={estilos.filaSubtexto}>CC {item.cc}</Text>
          )}
          {item.empresas?.empresa && (
            <Text style={estilos.filaSubtexto}>{item.empresas.empresa}</Text>
          )}
          <View
            style={[
              estilos.badge,
              item.activo
                ? { borderColor: colors.accent, backgroundColor: "#EAF6F1" }
                : { borderColor: colors.border, backgroundColor: colors.background },
            ]}
          >
            <Text
              style={[
                estilos.badgeTexto,
                { color: item.activo ? colors.accent : colors.textSecondary },
              ]}
            >
              {item.activo ? "Activa" : "Inactiva"}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={estilos.btnToggle}
        onPress={() => confirmarToggleActivo(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons
          name={item.activo ? "power" : "power-off"}
          size={20}
          color={item.activo ? colors.accent : colors.textSecondary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderUsuario = ({ item }) => {
    const seleccionado = usuarioSelId === item.id_persona;
    const nombreCompleto = [item.nombre, item.primer_apellido, item.segundo_apellido]
      .filter(Boolean)
      .join(" ");
    return (
      <TouchableOpacity
        style={[estilos.fila, seleccionado && estilos.filaSeleccionada]}
        onPress={() => setUsuarioSelId(item.id_persona)}
        activeOpacity={0.7}
      >
        <View style={estilos.filaIcono}>
          <MaterialCommunityIcons name="account-outline" size={22} color={colors.secondary} />
        </View>
        <View style={estilos.filaTextos}>
          <Text style={estilos.filaNombre}>{nombreCompleto}</Text>
          <Text style={estilos.filaSubtexto}>{item.roles?.role ?? "Sin rol"}</Text>
        </View>
        {seleccionado && (
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.secondary} />
        )}
      </TouchableOpacity>
    );
  };

  if (errorObras) {
    return (
      <View style={estilos.centrado}>
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#E74C3C" />
        <Text style={estilos.errorTexto}>Error al cargar obras</Text>
        <TouchableOpacity style={estilos.btnReintentar} onPress={fetchObras}>
          <Text style={estilos.btnReintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

      {pestanaActiva === "Obras" && (
        <>
          <View style={estilos.tabHeader}>
            <Text style={estilos.tabTitulo}>Obras registradas</Text>
            <TouchableOpacity style={estilos.btnAgregar} onPress={abrirNuevaObra}>
              <MaterialCommunityIcons name="plus" size={22} color={colors.surface} />
            </TouchableOpacity>
          </View>
          {loadingObras ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={obras}
              keyExtractor={(item) => String(item.id_obra)}
              renderItem={renderObra}
              contentContainerStyle={estilos.listaContenido}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={
                <View style={estilos.vacio}>
                  <MaterialCommunityIcons name="office-building-marker-outline" size={36} color={colors.textSecondary} />
                  <Text style={estilos.vacioTexto}>No hay obras registradas</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {pestanaActiva === "Asignaciones" && (
        <View style={{ flex: 1 }}>
          <View style={estilos.tabHeader}>
            <Text style={estilos.tabTitulo}>Selecciona un usuario</Text>
          </View>
          {loadingUsuarios ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={usuarios}
              keyExtractor={(item) => String(item.id_persona)}
              renderItem={renderUsuario}
              contentContainerStyle={estilos.listaUsuarios}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              style={{ maxHeight: "40%" }}
              ListEmptyComponent={
                <View style={estilos.vacio}>
                  <Text style={estilos.vacioTexto}>No hay usuarios activos</Text>
                </View>
              }
            />
          )}

          {usuarioSelId && (
            <>
              <View style={estilos.tabHeader}>
                <Text style={estilos.tabTitulo}>Obras asignadas</Text>
              </View>
              {loadingAsignaciones ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="small" color={colors.primary} />
              ) : (
                <View style={estilos.chipsGrid}>
                  {obras.filter((o) => o.activo).map((o) => {
                    const asignada = obraIdsAsignadas.has(o.id_obra);
                    return (
                      <TouchableOpacity
                        key={o.id_obra}
                        style={[estilos.chip, asignada && estilos.chipActivo]}
                        onPress={() => handleToggleAsignacion(o.id_obra)}
                      >
                        <MaterialCommunityIcons
                          name={asignada ? "check" : "plus"}
                          size={14}
                          color={asignada ? colors.surface : colors.textSecondary}
                        />
                        <Text style={[estilos.chipTexto, asignada && estilos.chipTextoActivo]}>
                          {o.obra}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>
      )}

      <ModalObra
        visible={modalObraVisible}
        obra={obraSeleccionada}
        empresas={empresas}
        onGuardar={async (datos) => {
          if (obraSeleccionada) await editarObra(obraSeleccionada.id_obra, datos);
          else await crearObra(datos);
        }}
        onCerrar={() => setModalObraVisible(false)}
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
  listaUsuarios: {
    paddingHorizontal: 14,
    paddingBottom: 12,
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
  filaSeleccionada: {
    borderColor: colors.secondary,
    borderWidth: 2,
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
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: "600",
  },
  btnToggle: {
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
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActivo: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextoActivo: {
    color: colors.surface,
  },
});
