// src/componets/obras/ModalAsignacionesUsuario.js
// Asigna/quita obras a un usuario. Vive en un modal a pantalla casi completa
// para no partir la pantalla de gestion en dos listas competidas.
import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { estilosObras as estilos } from "./gestionObrasStyles";
import { CajaBusqueda } from "./GestionObrasFilas";

const contiene = (texto, query) =>
  String(texto ?? "").toLowerCase().includes(query);

export default function ModalAsignacionesUsuario({
  visible,
  usuario,
  obras,
  asignadasIds,
  loading,
  onToggle,
  onCerrar,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [guardandoId, setGuardandoId] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (visible) {
      setBusqueda("");
      setErrMsg("");
      setGuardandoId(null);
    }
  }, [visible]);

  const nombreCompleto = usuario
    ? [usuario.nombre, usuario.primer_apellido, usuario.segundo_apellido]
        .filter(Boolean)
        .join(" ")
    : "";

  // Una obra inactiva ya asignada tiene que seguir visible, o no habria forma
  // de quitarla desde aqui.
  const disponibles = useMemo(
    () => obras.filter((o) => o.activo || asignadasIds.has(o.id_obra)),
    [obras, asignadasIds],
  );

  const q = busqueda.trim().toLowerCase();
  const filtradas = useMemo(
    () =>
      !q
        ? disponibles
        : disponibles.filter(
            (o) =>
              contiene(o.obra, q) ||
              contiene(o.cc, q) ||
              contiene(o.empresas?.empresa, q) ||
              contiene(o.id_obra, q),
          ),
    [disponibles, q],
  );

  const handleToggle = async (obraId) => {
    setErrMsg("");
    setGuardandoId(obraId);
    try {
      await onToggle(obraId);
    } catch (e) {
      console.error("[GestionObras] Error al cambiar asignacion:", e);
      setErrMsg("No se pudo guardar el cambio. Intenta de nuevo.");
    } finally {
      setGuardandoId(null);
    }
  };

  const renderObra = ({ item }) => {
    const asignada = asignadasIds.has(item.id_obra);
    const guardando = guardandoId === item.id_obra;
    const detalle = [
      item.cc != null ? `CC ${item.cc}` : "Sin CC",
      item.empresas?.empresa ?? "Sin empresa",
      !item.activo ? "Inactiva" : null,
    ]
      .filter(Boolean)
      .join("  ·  ");

    return (
      <TouchableOpacity
        style={[
          estilos.modalSeleccionable,
          asignada && estilos.modalSeleccionableActivo,
        ]}
        onPress={() => handleToggle(item.id_obra)}
        disabled={guardando}
        activeOpacity={0.7}
      >
        {guardando ? (
          <ActivityIndicator size="small" color={colors.secondary} />
        ) : (
          <MaterialCommunityIcons
            name={asignada ? "checkbox-marked" : "checkbox-blank-outline"}
            size={22}
            color={asignada ? colors.secondary : colors.textSecondary}
          />
        )}
        <View style={estilos.filaTextos}>
          <Text style={estilos.filaNombre} numberOfLines={2}>
            {item.obra}
          </Text>
          <Text style={estilos.filaMeta}>{detalle}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={estilos.overlay}>
        <View style={estilos.caja}>
          <View style={estilos.modalHeader}>
            <MaterialCommunityIcons
              name="account-outline"
              size={22}
              color={colors.secondary}
            />
            <View style={{ flex: 1 }}>
              <Text style={estilos.modalTitulo} numberOfLines={1}>
                {nombreCompleto}
              </Text>
              <Text style={estilos.modalSubtitulo}>
                {usuario?.roles?.role ?? "Sin rol"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCerrar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={{ paddingTop: 12 }}>
            <CajaBusqueda
              valor={busqueda}
              onCambiar={setBusqueda}
              placeholder="Buscar obra, CC o empresa..."
            />
          </View>

          {errMsg ? (
            <Text
              style={[
                estilos.tabSubtitulo,
                { color: colors.danger, fontWeight: "600" },
              ]}
            >
              {errMsg}
            </Text>
          ) : null}

          {loading ? (
            <ActivityIndicator
              style={{ marginTop: 30 }}
              size="large"
              color={colors.primary}
            />
          ) : (
            <FlatList
              data={filtradas}
              keyExtractor={(item) => String(item.id_obra)}
              renderItem={renderObra}
              contentContainerStyle={estilos.listaContenido}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={estilos.vacio}>
                  <MaterialCommunityIcons
                    name="office-building-marker-outline"
                    size={36}
                    color={colors.textSecondary}
                  />
                  <Text style={estilos.vacioTexto}>
                    {busqueda
                      ? "Sin resultados para la busqueda"
                      : "No hay obras activas para asignar"}
                  </Text>
                </View>
              }
            />
          )}

          <View style={estilos.modalPie}>
            <Text style={estilos.modalPieTexto}>
              {loading
                ? "Cargando asignaciones..."
                : `${asignadasIds.size} ${
                    asignadasIds.size === 1 ? "obra asignada" : "obras asignadas"
                  }`}
            </Text>
            <TouchableOpacity style={estilos.btnListo} onPress={onCerrar}>
              <Text style={estilos.btnListoTexto}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
