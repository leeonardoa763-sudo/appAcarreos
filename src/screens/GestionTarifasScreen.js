// src/screens/GestionTarifasScreen.js
//
// Panel de Administrador → Tarifas por obra.
//
// Muestra, para la obra elegida, que tarifa se aplicaria hoy en cada combinacion
// y permite sobrescribirla con una tarifa propia de esa obra. Las tarifas por
// defecto del sindicato (precios_material / precios_renta) son de SOLO LECTURA
// aqui: se editan en Supabase, porque un error de captura afectaria a todas las
// obras incluida la 146 (produccion).
//
// La resolucion en tiempo de cotizacion vive en utils/preciosMaterial.js y
// utils/preciosRenta.js — esta pantalla solo administra el catalogo.
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
import { useAuth } from "../hooks/useAuth";
import { useObras } from "../hooks/useObras";
import { useGestionTarifas } from "../hooks/useGestionTarifas";
import crossAlert from "../utils/crossAlert";
import { estilosTarifas as estilos } from "../componets/tarifas/gestionTarifasStyles";
import {
  CajaBusqueda,
  FilaTarifaMaterial,
  FilaTarifaRenta,
  ModalSeleccionarObra,
} from "../componets/tarifas/GestionTarifasFilas";
import {
  ModalTarifaMaterialObra,
  ModalTarifaRentaObra,
} from "../componets/tarifas/GestionTarifasModales";

const PESTANAS = ["Material", "Renta"];

const contiene = (texto, query) =>
  String(texto ?? "").toLowerCase().includes(query);

export default function GestionTarifasScreen() {
  const { userProfile } = useAuth();
  // esAdmin = true: la pantalla solo es alcanzable desde el tab Admin
  const { obras, loading: loadingObras } = useObras(
    userProfile?.id_persona,
    true,
  );

  const {
    sindicatos,
    tiposMaterial,
    defaultsMaterial,
    defaultsRenta,
    tarifasMaterialObra,
    tarifasRentaObra,
    loading,
    error,
    fetchTodo,
    crearTarifaMaterialObra,
    editarTarifaMaterialObra,
    eliminarTarifaMaterialObra,
    crearTarifaRentaObra,
    editarTarifaRentaObra,
    eliminarTarifaRentaObra,
  } = useGestionTarifas();

  const [obraId, setObraId] = useState(null);
  const [pestanaActiva, setPestanaActiva] = useState("Material");
  const [busqueda, setBusqueda] = useState("");
  const [refrescando, setRefrescando] = useState(false);
  const [modalObraVisible, setModalObraVisible] = useState(false);

  // Combinacion abierta en el modal. Que sea alta o edicion lo decide su
  // `tarifaObra`: null = crear, objeto = editar.
  const [seleccion, setSeleccion] = useState(null);
  const [modalMaterialVisible, setModalMaterialVisible] = useState(false);
  const [modalRentaVisible, setModalRentaVisible] = useState(false);

  // Preselecciona la primera obra disponible para no arrancar en vacio
  useEffect(() => {
    if (obraId == null && obras.length > 0) {
      setObraId(obras[0].id);
    }
  }, [obras, obraId]);

  useEffect(() => {
    fetchTodo(obraId);
  }, [fetchTodo, obraId]);

  const handleRefrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await fetchTodo(obraId);
    } finally {
      setRefrescando(false);
    }
  }, [fetchTodo, obraId]);

  const obraSel = useMemo(
    () => obras.find((o) => o.id === obraId) ?? null,
    [obras, obraId],
  );

  const nombreSindicato = useCallback(
    (id) =>
      sindicatos.find((s) => s.id_sindicato === id)?.sindicato ??
      `Sindicato ${id}`,
    [sindicatos],
  );

  const nombreTipoMaterial = useCallback(
    (id) =>
      tiposMaterial.find((t) => t.id_tipo_de_material === id)
        ?.tipo_de_material ?? `Tipo ${id}`,
    [tiposMaterial],
  );

  // ─── Cruce default + tarifa de obra ───────────────────────────────────────
  // Una fila por combinacion. La base son las combinaciones que tienen default;
  // se agregan las tarifas de obra huerfanas (sin default) para que sigan siendo
  // visibles y editables en vez de quedar invisibles en la pantalla.
  const filasMaterial = useMemo(() => {
    const claveDe = (t) => `${t.id_tipo_de_material}-${t.id_sindicato}`;
    const porClave = new Map();

    defaultsMaterial.forEach((d) => {
      porClave.set(claveDe(d), {
        id_tipo_de_material: d.id_tipo_de_material,
        id_sindicato: d.id_sindicato,
        base: d,
        tarifaObra: null,
      });
    });

    tarifasMaterialObra.forEach((t) => {
      const clave = claveDe(t);
      const previo = porClave.get(clave);
      porClave.set(clave, {
        id_tipo_de_material: t.id_tipo_de_material,
        id_sindicato: t.id_sindicato,
        base: previo?.base ?? null,
        tarifaObra: t,
      });
    });

    return Array.from(porClave.values())
      .map((c) => ({
        ...c,
        clave: `${c.id_tipo_de_material}-${c.id_sindicato}`,
        tipoMaterialNombre: nombreTipoMaterial(c.id_tipo_de_material),
        sindicatoNombre: nombreSindicato(c.id_sindicato),
        vigente: c.tarifaObra ?? c.base,
        esTarifaDeObra: !!c.tarifaObra,
      }))
      .sort(
        (a, b) =>
          a.tipoMaterialNombre.localeCompare(b.tipoMaterialNombre) ||
          a.sindicatoNombre.localeCompare(b.sindicatoNombre),
      );
  }, [
    defaultsMaterial,
    tarifasMaterialObra,
    nombreTipoMaterial,
    nombreSindicato,
  ]);

  const filasRenta = useMemo(() => {
    const porSindicato = new Map();

    defaultsRenta.forEach((d) => {
      porSindicato.set(d.id_sindicato, {
        id_sindicato: d.id_sindicato,
        base: d,
        tarifaObra: null,
      });
    });

    tarifasRentaObra.forEach((t) => {
      const previo = porSindicato.get(t.id_sindicato);
      porSindicato.set(t.id_sindicato, {
        id_sindicato: t.id_sindicato,
        base: previo?.base ?? null,
        tarifaObra: t,
      });
    });

    return Array.from(porSindicato.values())
      .map((c) => ({
        ...c,
        clave: String(c.id_sindicato),
        sindicatoNombre: nombreSindicato(c.id_sindicato),
        vigente: c.tarifaObra ?? c.base,
        esTarifaDeObra: !!c.tarifaObra,
      }))
      .sort((a, b) => a.sindicatoNombre.localeCompare(b.sindicatoNombre));
  }, [defaultsRenta, tarifasRentaObra, nombreSindicato]);

  const esMaterial = pestanaActiva === "Material";
  const q = busqueda.trim().toLowerCase();

  const filasFiltradas = useMemo(() => {
    const lista = esMaterial ? filasMaterial : filasRenta;
    if (!q) return lista;
    return lista.filter(
      (f) => contiene(f.sindicatoNombre, q) || contiene(f.tipoMaterialNombre, q),
    );
  }, [esMaterial, filasMaterial, filasRenta, q]);

  const totalConTarifaObra = useMemo(
    () =>
      (esMaterial ? filasMaterial : filasRenta).filter((f) => f.esTarifaDeObra)
        .length,
    [esMaterial, filasMaterial, filasRenta],
  );

  // ─── Acciones ─────────────────────────────────────────────────────────────
  const abrirModal = (fila) => {
    setSeleccion(fila);
    if (esMaterial) setModalMaterialVisible(true);
    else setModalRentaVisible(true);
  };

  const cerrarModales = () => {
    setModalMaterialVisible(false);
    setModalRentaVisible(false);
    setSeleccion(null);
  };

  const guardarMaterial = async (datos) => {
    if (seleccion?.tarifaObra) {
      await editarTarifaMaterialObra(
        obraId,
        seleccion.tarifaObra.id_precios_material_obra,
        datos,
      );
      return;
    }
    await crearTarifaMaterialObra(obraId, {
      ...datos,
      id_tipo_de_material: seleccion.id_tipo_de_material,
      id_sindicato: seleccion.id_sindicato,
    });
  };

  const guardarRenta = async (datos) => {
    if (seleccion?.tarifaObra) {
      await editarTarifaRentaObra(
        obraId,
        seleccion.tarifaObra.id_precios_renta_obra,
        datos,
      );
      return;
    }
    await crearTarifaRentaObra(obraId, {
      ...datos,
      id_sindicato: seleccion.id_sindicato,
    });
  };

  // Alert.alert es un no-op en web: la confirmacion va por crossAlert.
  const confirmarQuitar = (fila) => {
    const queEs = esMaterial
      ? `${fila.tipoMaterialNombre} · ${fila.sindicatoNombre}`
      : fila.sindicatoNombre;
    const hayDefault = !!fila.base;

    crossAlert(
      "Quitar tarifa de obra",
      `¿Quitar la tarifa propia de "${queEs}" en ${obraSel?.nombre ?? "esta obra"}?\n\n` +
        (hayDefault
          ? "La obra volvera a usar la tarifa por defecto del sindicato. Los vales ya creados conservan el importe con el que se emitieron."
          : "Esta combinacion NO tiene tarifa por defecto del sindicato: al quitarla, los vales nuevos fallaran hasta que se cargue una."),
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: async () => {
            try {
              if (esMaterial) {
                await eliminarTarifaMaterialObra(
                  obraId,
                  fila.tarifaObra.id_precios_material_obra,
                );
              } else {
                await eliminarTarifaRentaObra(
                  obraId,
                  fila.tarifaObra.id_precios_renta_obra,
                );
              }
            } catch (e) {
              console.error("[GestionTarifas] Error al quitar tarifa:", e);
              Alert.alert(
                "Error",
                "No se pudo quitar la tarifa. Intenta de nuevo.",
              );
            }
          },
        },
      ],
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={estilos.centrado}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={40}
          color={colors.danger}
        />
        <Text style={estilos.errorTexto}>Error al cargar tarifas</Text>
        <Text style={estilos.errorDetalle}>{error}</Text>
        <TouchableOpacity
          style={estilos.btnReintentar}
          onPress={() => fetchTodo(obraId)}
        >
          <Text style={estilos.btnReintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cargando = loading || loadingObras;

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
            onPress={() => {
              setPestanaActiva(p);
              setBusqueda("");
            }}
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

      <TouchableOpacity
        style={estilos.selectorObra}
        onPress={() => setModalObraVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="office-building-marker-outline"
          size={21}
          color={colors.secondary}
        />
        <View style={estilos.selectorObraTextos}>
          <Text style={estilos.selectorObraEtiqueta}>Obra</Text>
          <Text
            style={[
              estilos.selectorObraValor,
              !obraSel && estilos.selectorObraPlaceholder,
            ]}
          >
            {obraSel?.nombre ?? "Selecciona una obra"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <Text style={estilos.tabSubtitulo}>
        {totalConTarifaObra > 0
          ? `${totalConTarifaObra} de ${filasFiltradas.length} con tarifa propia de esta obra. El resto usa el default del sindicato.`
          : "Ninguna combinacion tiene tarifa propia: esta obra usa los defaults del sindicato."}
      </Text>

      <CajaBusqueda
        valor={busqueda}
        onCambiar={setBusqueda}
        placeholder={
          esMaterial ? "Buscar material o sindicato" : "Buscar sindicato"
        }
      />

      {cargando && filasFiltradas.length === 0 ? (
        <View style={estilos.centrado}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          key={pestanaActiva}
          data={filasFiltradas}
          keyExtractor={(item) => item.clave}
          contentContainerStyle={estilos.listaContenido}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={handleRefrescar}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) =>
            esMaterial ? (
              <FilaTarifaMaterial
                item={item}
                onAsignar={() => abrirModal(item)}
                onEditar={() => abrirModal(item)}
                onQuitar={() => confirmarQuitar(item)}
              />
            ) : (
              <FilaTarifaRenta
                item={item}
                onAsignar={() => abrirModal(item)}
                onEditar={() => abrirModal(item)}
                onQuitar={() => confirmarQuitar(item)}
              />
            )
          }
          ListEmptyComponent={
            <View style={estilos.vacio}>
              <MaterialCommunityIcons
                name="cash-remove"
                size={38}
                color={colors.textSecondary}
              />
              <Text style={estilos.vacioTexto}>
                {q
                  ? "Ninguna combinacion coincide con la busqueda"
                  : "No hay tarifas por defecto cargadas para este tipo de vale"}
              </Text>
            </View>
          }
        />
      )}

      <ModalSeleccionarObra
        visible={modalObraVisible}
        obras={obras}
        obraId={obraId}
        onSelect={(id) => {
          setObraId(id);
          setModalObraVisible(false);
        }}
        onCerrar={() => setModalObraVisible(false)}
      />

      <ModalTarifaMaterialObra
        visible={modalMaterialVisible}
        tarifa={seleccion?.tarifaObra ?? null}
        base={seleccion?.base ?? null}
        tipoMaterialNombre={seleccion?.tipoMaterialNombre ?? ""}
        sindicatoNombre={seleccion?.sindicatoNombre ?? ""}
        obraNombre={obraSel?.nombre ?? ""}
        onGuardar={guardarMaterial}
        onCerrar={cerrarModales}
      />

      <ModalTarifaRentaObra
        visible={modalRentaVisible}
        tarifa={seleccion?.tarifaObra ?? null}
        base={seleccion?.base ?? null}
        sindicatoNombre={seleccion?.sindicatoNombre ?? ""}
        obraNombre={obraSel?.nombre ?? ""}
        onGuardar={guardarRenta}
        onCerrar={cerrarModales}
      />
    </View>
  );
}
