/**
 * screens/HistorialValesScreen.js
 *
 * HISTORIAL DE VALES — consulta y exportacion
 *
 * Sustituye a la antigua ArchivadosScreen, que filtraba por vales.archivado (una
 * columna que ninguna parte de la app escribe, asi que la pantalla salia vacia).
 *
 * La pantalla NO carga nada al abrirse: primero pregunta que vales quiere el
 * usuario y luego que hacer con ellos.
 *
 *   fase "filtros" -> formulario + [Ver en la app] / [Exportar a Excel]
 *   fase "lista"   -> folios con buscador; tap abre ValeDetalleModal
 *
 * Exportar no cambia de fase: es el camino mas corto para el uso principal.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "../config/colors";

import { useAuth } from "../hooks/useAuth";
import { useObras } from "../hooks/useObras";
import { useCatalogos } from "../hooks/useCatalogos";
import { useHistorialVales } from "../hooks/useHistorialVales";
import { TIPOS_HISTORIAL } from "../hooks/exportHelpers/historialQueries";
import crossAlert from "../utils/crossAlert";
import {
  MODO_PERIODO,
  mesActualId,
  construirRangoFechas,
} from "../utils/periodoHistorial";

import FiltrosHistorial, {
  SIN_FILTRO,
} from "../componets/historial/FiltrosHistorial";
import ListaFoliosHistorial from "../componets/historial/ListaFoliosHistorial";
import ValeDetalleModal from "../componets/acarreos/ValeDetalleModal";
import PrimaryButton from "../componets/common/PrimaryButton";

const FILTROS_INICIALES = {
  modoPeriodo: MODO_PERIODO.MES,
  mes: mesActualId(),
  fechaDesde: null,
  fechaHasta: null,
  obraId: SIN_FILTRO,
  tipo: TIPOS_HISTORIAL.TODOS,
  materialId: SIN_FILTRO,
  sindicatoId: SIN_FILTRO,
  bancoId: SIN_FILTRO,
  incluirCancelados: false,
};

/** El centinela de los pickers no viaja a la consulta. */
const sinCentinela = (valor) => (valor === SIN_FILTRO ? null : valor);

const HistorialValesScreen = () => {
  const { userProfile, userRole } = useAuth();
  const esAdministrador = userRole === "Administrador";

  const { obras, loading: obrasLoading } = useObras(
    userProfile?.id_persona,
    esAdministrador,
  );

  const {
    materiales,
    sindicatos,
    bancos,
    loading: catalogosLoading,
  } = useCatalogos(["materiales", "sindicatos", "bancos"]);

  const { cargando, exportando, folios, cargarLista, exportarCSV, limpiarLista } =
    useHistorialVales(obras, userRole);

  const [fase, setFase] = useState("filtros");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [valeSeleccionado, setValeSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const setFiltro = useCallback((clave, valor) => {
    setFiltros((previos) => ({ ...previos, [clave]: valor }));
  }, []);

  const normalizarFiltros = useCallback(() => {
    const { fechaDesde, fechaHasta } = construirRangoFechas(filtros);
    return {
      fechaDesde,
      fechaHasta,
      obraId: sinCentinela(filtros.obraId),
      tipo: filtros.tipo,
      materialId: sinCentinela(filtros.materialId),
      sindicatoId: sinCentinela(filtros.sindicatoId),
      bancoId: sinCentinela(filtros.bancoId),
      incluirCancelados: filtros.incluirCancelados,
    };
  }, [filtros]);

  /** Valida el rango antes de consultar. Devuelve true si es usable. */
  const rangoValido = useCallback(() => {
    if (filtros.modoPeriodo !== MODO_PERIODO.RANGO) return true;

    if (!filtros.fechaDesde || !filtros.fechaHasta) {
      crossAlert(
        "Rango incompleto",
        "Selecciona la fecha inicial y la fecha final.",
      );
      return false;
    }
    if (filtros.fechaDesde > filtros.fechaHasta) {
      crossAlert(
        "Rango invalido",
        "La fecha inicial no puede ser posterior a la final.",
      );
      return false;
    }
    return true;
  }, [filtros]);

  const handleVerEnApp = useCallback(async () => {
    if (!rangoValido()) return;
    const hayResultados = await cargarLista(normalizarFiltros());
    if (hayResultados) setFase("lista");
  }, [rangoValido, cargarLista, normalizarFiltros]);

  const handleExportar = useCallback(async () => {
    if (!rangoValido()) return;
    await exportarCSV(normalizarFiltros());
  }, [rangoValido, exportarCSV, normalizarFiltros]);

  const handleVolverAFiltros = useCallback(() => {
    setFase("filtros");
    limpiarLista();
  }, [limpiarLista]);

  // ValeDetalleModal carga el vale completo por su cuenta; aqui solo se le
  // entrega la referencia ligera de la lista.
  const handleAbrirVale = useCallback((item) => {
    setValeSeleccionado({
      id_vale: item.id_vale,
      tipo_vale: item.tipo_vale,
    });
    setModalVisible(true);
  }, []);

  if (!userProfile?.id_persona || obrasLoading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const ocupado = cargando || exportando;

  if (fase === "lista") {
    return (
      <View style={styles.container}>
        <ListaFoliosHistorial
          folios={folios}
          onSeleccionar={handleAbrirVale}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.volver}
              onPress={handleVolverAFiltros}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={18}
                color={colors.secondary}
              />
              <Text style={styles.volverTexto}>Cambiar filtros</Text>
            </TouchableOpacity>
          }
        />

        <ValeDetalleModal
          visible={modalVisible}
          vale={valeSeleccionado}
          onClose={() => {
            setModalVisible(false);
            setValeSeleccionado(null);
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="history"
          size={30}
          color={colors.primary}
        />
        <Text style={styles.headerTitulo}>Historial de Vales</Text>
        <Text style={styles.headerSubtitulo}>
          Elige que vales quieres consultar. Nada se carga hasta que lo pidas.
        </Text>
      </View>

      <FiltrosHistorial
        filtros={filtros}
        setFiltro={setFiltro}
        obras={obras}
        materiales={materiales}
        sindicatos={sindicatos}
        bancos={bancos}
        catalogosCargando={catalogosLoading}
        deshabilitado={ocupado}
      />

      <View style={styles.instrucciones}>
        <View style={styles.instruccionesHeader}>
          <MaterialCommunityIcons
            name="microsoft-excel"
            size={20}
            color={colors.accent}
          />
          <Text style={styles.instruccionesTitulo}>Sobre la exportacion</Text>
        </View>
        <Text style={styles.instruccionesTexto}>
          Se genera un archivo CSV con{" "}
          <Text style={styles.negrita}>una fila por cada viaje</Text> registrado:
          folio, fechas, autorizaciones, estado, operador, material, banco,
          pesos, volumenes y costos. Abrelo con Excel y usa Datos {">"} Filtro
          para trabajarlo.
        </Text>
        <Text style={styles.instruccionesTexto}>
          Los vales que todavia no tienen viajes registrados no aparecen, porque
          no hay nada que reportar de ellos.
        </Text>
      </View>

      <View style={styles.botones}>
        <PrimaryButton
          title={exportando ? "Generando archivo..." : "Exportar a Excel"}
          onPress={handleExportar}
          loading={exportando}
          disabled={ocupado}
          icon="file-excel"
          backgroundColor={colors.accent}
        />

        <View style={styles.separadorBotones} />

        <PrimaryButton
          title={cargando ? "Buscando..." : "Ver en la app"}
          onPress={handleVerEnApp}
          loading={cargando}
          disabled={ocupado}
          icon="format-list-bulleted"
          backgroundColor={colors.secondary}
        />
      </View>
    </ScrollView>
  );
};

export default HistorialValesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: 16,
    paddingBottom: 32,
  },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  headerTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 8,
  },
  headerSubtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },

  instrucciones: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  instruccionesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  instruccionesTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 8,
  },
  instruccionesTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  negrita: {
    fontWeight: "700",
    color: colors.textPrimary,
  },

  botones: {
    marginTop: 4,
  },
  separadorBotones: {
    height: 12,
  },

  volver: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 8,
  },
  volverTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.secondary,
    marginLeft: 6,
  },
});
